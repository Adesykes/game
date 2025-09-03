const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// Add CORS middleware for all Express routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
const server = createServer(app);
const io = new Server(server, {
  cors: {
    // Explicitly allow localhost connections on various ports
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://192.168.0.42:5173",
      "http://192.168.0.42:5174"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
  transports: ['websocket', 'polling'], // Try websocket first for better performance
  allowUpgrades: true,
  pingTimeout: 60000, // Increased timeout
  pingInterval: 25000,
  cookie: false // Disable cookie for better cross-origin support
});

// Socket.io error handling
io.engine.on('connection_error', (err) => {
  console.log('Connection error:', err.req);      // the request object
  console.log('Error code:', err.code);           // the error code
  console.log('Error message:', err.message);     // the error message
  console.log('Error context:', err.context);     // some additional error context
});

// Catch uncaught exceptions to prevent server from crashing
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Track per-room timeouts to avoid getting stuck in phases
const questionTimeouts = new Map(); // roomCode -> NodeJS.Timeout
const charadeTimeouts = new Map(); // roomCode -> NodeJS.Timeout
// Charade duration hardcoded to 30 seconds
const CHARADE_DURATION_MS = 30000;

// Game state management
const rooms = new Map();

// Utility functions
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CATEGORIES = [
  'History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology',
  'Music', 'Food', 'Literature', 'Animals'
];
const REQUIRED_PER_CATEGORY = 5;

const createPlayer = (name, isHost = false) => {
  // Initialize scores for all categories
  const categoryScores = {};
  CATEGORIES.forEach(cat => { categoryScores[cat] = 0; });
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    name,
    color: '',
    avatar: '',
    score: 0,
    lives: 3,
    isHost,
    isEliminated: false,
    categoryScores,
    charadeCount: 0 // Track number of charades performed
  };
};

const playerColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const playerAvatars = ['🦊', '🐻', '🐱', '🐸', '🦁', '🐼'];
const BOARD_SIZE = 50;
const MAX_PLAYERS = 6;

const assignPlayerAppearance = (player, existingPlayers) => {
  const usedColors = existingPlayers.map(p => p.color);
  const usedAvatars = existingPlayers.map(p => p.avatar);
  
  const availableColors = playerColors.filter(color => !usedColors.includes(color));
  const availableAvatars = playerAvatars.filter(avatar => !usedAvatars.includes(avatar));
  
  return {
    ...player,
    color: availableColors[0] || playerColors[0],
    avatar: availableAvatars[0] || playerAvatars[0]
  };
};

const generateBoard = () => {
  const board = [];
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i === 0) {
      board.push({ id: i, type: 'start' });
    } else {
      const rand = Math.random();
      if (rand < 0.6) {
        board.push({ id: i, type: 'question' });
      } else if (rand < 0.8) {
        board.push({ id: i, type: 'chance' });
      } else {
        board.push({ id: i, type: 'normal' });
      }
    }
  }
  
  return board;
};

// Questions pool (server-side) - Using expanded question set with additional categories
const { allQuestions } = require('./server_data/expanded_questions.cjs');

// Select a random question avoiding repeats until pool is exhausted
const getRandomQuestion = (usedQuestionIds = []) => {
  const available = allQuestions.filter(q => !usedQuestionIds.includes(q.id));
  if (available.length === 0) {
    // reset used list to allow reuse if completely exhausted
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
};

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const chanceEvents = [
  { type: 'move', value: 3, description: 'Lucky break! Move forward 3 spaces!' },
  { type: 'move', value: -2, description: 'Oops! Move back 2 spaces!' },
  { type: 'points', value: 50, description: 'Bonus points! Gain 50 points!' },
  { type: 'points', value: -25, description: 'Point penalty! Lose 25 points!' }
];

const getRandomChanceEvent = () => {
  return chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
};

// Socket event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'from address:', socket.handshake.address);

  // Rejoin an existing room after refresh/reconnect
  socket.on('rejoin-room', (roomCode, playerId, callback) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) {
        callback?.({ success: false, error: 'Room not found' });
        return;
      }

      // If playerId is provided, ensure it exists in the room (player rejoin)
      if (playerId) {
        const player = room.gameState.players.find(p => p.id === playerId);
        if (!player) {
          callback?.({ success: false, error: 'Player not found in room' });
          return;
        }
      }

      // Join the socket.io room again for event delivery
      socket.join(roomCode);

      // Send back the current state so the client can resync UI
      callback?.({ success: true, gameState: room.gameState, board: room.board, playerId });
      // Also emit a one-off state-sync event to this socket (optional)
      io.to(socket.id).emit('state-sync', { gameState: room.gameState, board: room.board });
    } catch (err) {
      console.error('Error in rejoin-room:', err);
      callback?.({ success: false, error: 'Internal error' });
    }
  });

  socket.on('create-room', (hostName, callback) => {
    try {
      console.log('Received create-room event from socket:', socket.id);
      console.log('Attempting to create room with host:', hostName);
      const roomCode = generateRoomCode();
      const host = createPlayer(hostName, true);
      // Store the persistent ID with the player
      host.persistentId = socket.handshake.auth.persistentId || null;
      const assignedHost = assignPlayerAppearance(host, []);
      
      const gameState = {
        id: roomCode,
        players: [assignedHost],
        currentPlayerIndex: 0,
        currentQuestion: null,
        selectedCategory: null,
        gamePhase: 'waiting',
        winner: null,
        round: 1,
        currentForfeit: null,
        charadeSolution: null,
        charadeSolved: false
      };

      const room = {
        id: roomCode,
        gameState,
        board: generateBoard(),
        usedQuestionIds: []
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      
      console.log('Room created successfully:', roomCode);
      console.log('Callback function exists:', typeof callback === 'function');
      if (typeof callback === 'function') {
        console.log('Calling callback with success response');
        callback({ success: true, roomCode, gameState, board: room.board });
      } else {
        console.error('Callback is not a function!');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to create room: ' + error.message });
      }
    }
  });

  socket.on('join-room', (roomCode, playerName, callback) => {
    console.log('Attempting to join room:', roomCode, 'with player:', playerName);
    const room = rooms.get(roomCode);
    
    if (!room) {
      console.log('Room not found:', roomCode);
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameState.players.length >= MAX_PLAYERS) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.gameState.gamePhase !== 'waiting') {
      callback({ success: false, error: 'Game already started' });
      return;
    }

    const newPlayer = createPlayer(playerName);
    const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);
    
    room.gameState.players.push(assignedPlayer);
    socket.join(roomCode);
    
    io.to(roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });
    callback({ success: true, gameState: room.gameState, board: room.board, playerId: assignedPlayer.id });
  });

  socket.on('start-game', (roomCode) => {
    console.log(`Received start-game event for room: ${roomCode}`);
    const room = rooms.get(roomCode);
    if (!room) {
      console.log('Room not found');
      return;
    }
    if (room.gameState.players.length < 2) {
      console.log('Not enough players to start game');
      return;
    }

    console.log('Starting game, setting phase to category_selection');
    room.gameState.gamePhase = 'category_selection';
    console.log(`Current game state: ${JSON.stringify(room.gameState)}`);
    io.to(roomCode).emit('game-started', { gameState: room.gameState, board: room.board });
  });

  socket.on('roll-dice', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

  const diceRoll = rollDice();
  const player = room.gameState.players.find(p => p.id === playerId);
  const newPosition = (player.position + diceRoll) % BOARD_SIZE;

  player.position = newPosition;
    const boardSquare = room.board[newPosition];
    
    io.to(roomCode).emit('dice-rolled', { 
      diceRoll, 
      gameState: room.gameState, 
      playerId,
      newPosition,
      squareType: boardSquare.type
    });

    setTimeout(() => {
      if (boardSquare.type === 'question') {
        // Get a question avoiding repeats
        let question = getRandomQuestion(room.usedQuestionIds);
        // If pool seems exhausted (available length 0), reset used list and draw again for freshness
        if (room.usedQuestionIds.length >= allQuestions.length - 1) {
          room.usedQuestionIds = [];
          question = getRandomQuestion(room.usedQuestionIds);
        }
        room.usedQuestionIds.push(question.id);
        room.gameState.currentQuestion = question;
        room.gameState.gamePhase = 'question';
        
        io.to(roomCode).emit('question-presented', { 
          question, 
          gameState: room.gameState,
          playerId 
        });

        // Clear any existing timeout for this room, then start a new one
        const existing = questionTimeouts.get(roomCode);
        if (existing) clearTimeout(existing);

        const timeoutMs = 30000; // 30s to answer
        const handle = setTimeout(() => {
          // If still on the same question phase, auto-resolve as incorrect
          if (room.gameState.gamePhase === 'question' && room.gameState.currentQuestion) {
            const current = room.gameState.players[room.gameState.currentPlayerIndex];
            const correctAnswer = room.gameState.currentQuestion.correctAnswer;
            room.gameState.currentQuestion = null;
            room.gameState.gamePhase = 'playing';

            io.to(roomCode).emit('answer-submitted', {
              playerId: current.id,
              answerIndex: -1,
              isCorrect: false,
              points: 0,
              correctAnswer,
              gameState: room.gameState
            });

            setTimeout(() => nextTurn(room, roomCode), 1500);
          }
        }, timeoutMs);
        questionTimeouts.set(roomCode, handle);
      } else if (boardSquare.type === 'chance') {
        const event = getRandomChanceEvent();
        
        if (event.type === 'move') {
          player.position = Math.max(0, Math.min(BOARD_SIZE - 1, player.position + event.value));
        } else if (event.type === 'points') {
          player.score = Math.max(0, player.score + event.value);
        }
        
        io.to(roomCode).emit('chance-event', { 
          event, 
          gameState: room.gameState,
          playerId 
        });
        
        setTimeout(() => nextTurn(room, roomCode), 3000);
      } else {
        nextTurn(room, roomCode);
      }
    }, 1500);
  });

  socket.on('select-category', (roomCode, playerId, category) => {
    console.log(`Received select-category event: room=${roomCode}, player=${playerId}, category=${category}`);
    const room = rooms.get(roomCode);
    if (!room) {
      console.log('Room not found');
      return;
    }

    const gameState = room.gameState;
    console.log(`Current game phase: ${gameState.gamePhase}`);
    if (gameState.gamePhase !== 'category_selection') {
      console.log(`Invalid game phase: ${gameState.gamePhase}`);
      return;
    }
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    console.log(`Current player: ${currentPlayer.id}, Requesting player: ${playerId}`);
    if (currentPlayer.id !== playerId) {
      console.log('Not the current player\'s turn');
      return;
    }

    // Get a random question from the selected category
    const categoryQuestions = allQuestions.filter(q => 
      q.category.toLowerCase() === category.toLowerCase() && 
      !room.usedQuestionIds.includes(q.id)
    );
    
    let question;
    if (categoryQuestions.length > 0) {
      question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    } else {
      // If all questions from category are exhausted, pick any question from that category
      const allCategoryQuestions = allQuestions.filter(q => 
        q.category.toLowerCase() === category.toLowerCase()
      );
      question = allCategoryQuestions[Math.floor(Math.random() * allCategoryQuestions.length)];
    }
    
    // Mark question as used to avoid repeats
    if (question) {
      room.usedQuestionIds.push(question.id);
    }
    
    // Set the current question and update game phase
    gameState.currentQuestion = question;
    gameState.gamePhase = 'question';
    
    // Emit the event to all players
    io.to(roomCode).emit('category-selected', {
      category,
      question,
      gameState,
      playerId
    });
    
    // Start a timer for answering the question
    const timeoutMs = 30000; // 30s to answer
    const existingTimeout = questionTimeouts.get(roomCode);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const handle = setTimeout(() => {
      // If still on question phase when time expires, auto-resolve as incorrect
      if (gameState.gamePhase === 'question' && gameState.currentQuestion) {
        const correctAnswer = gameState.currentQuestion.correctAnswer;
        gameState.gamePhase = 'forfeit';
        
        // Get a random forfeit
        const forfeit = require('./server_data/forfeits.cjs').getRandomForfeit();
        gameState.currentForfeit = forfeit;
        
        io.to(roomCode).emit('answer-submitted', {
          playerId: currentPlayer.id,
          isCorrect: false,
          correctAnswer,
          gameState
        });
      }
    }, timeoutMs);
    
    questionTimeouts.set(roomCode, handle);
  });

  socket.on('submit-answer', (roomCode, playerId, answerIndex) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
    const points = isCorrect ? 100 : 0;
    
    currentPlayer.score += points;
    const currentQ = room.gameState.currentQuestion;
    const correctAnswer = currentQ.correctAnswer;
    
    if (!isCorrect) {
      // On incorrect answers, deduct a life
      currentPlayer.lives = Math.max(0, (currentPlayer.lives || 0) - 1);
      
      if (currentPlayer.lives === 0) {
        console.log(`[submit-answer] Player ${currentPlayer.name} eliminated (no lives left)`);
        currentPlayer.isEliminated = true;
        
        // Check if this elimination resulted in only one player remaining
        const lastPlayerStanding = checkLastPlayerStanding(room);
        if (lastPlayerStanding) {
          console.log(`[submit-answer] Last player standing detected: ${lastPlayerStanding.name}`);
          // End the game with the last player as winner
          endGame(room, roomCode, lastPlayerStanding);
          return; // Exit early
        }
      } else {
        console.log(`[submit-answer] Player ${currentPlayer.name} lost a life (${currentPlayer.lives} remaining)`);
      }
    }

    // Update category progress on correct answers (use categoryScores)
    if (isCorrect && currentQ && currentQ.category) {
      const cat = currentQ.category;
      const current = currentPlayer.categoryScores?.[cat] || 0;
      if (!currentPlayer.categoryScores) currentPlayer.categoryScores = {};
      currentPlayer.categoryScores[cat] = current + 1;
    }
    
    room.gameState.currentQuestion = null;
    
    if (isCorrect) {
      room.gameState.gamePhase = 'category_selection';
    } else {
      // If answer is incorrect, move to forfeit phase
      room.gameState.gamePhase = 'forfeit';
      const forfeit = require('./server_data/forfeits.cjs').getRandomForfeit(currentPlayer);
      room.gameState.currentForfeit = forfeit;
    }

    // Clear any pending question timeout since the answer arrived
    const existing = questionTimeouts.get(roomCode);
    if (existing) clearTimeout(existing);
    questionTimeouts.delete(roomCode);

    // Check win condition: 5 correct in each category
    const hasAll = CATEGORIES.every(cat => (currentPlayer.categoryScores?.[cat] || 0) >= REQUIRED_PER_CATEGORY);
    if (hasAll) {
      console.log(`[submit-answer] Player ${currentPlayer.name} has won by completing all categories!`);
      endGame(room, roomCode, currentPlayer);
      return;
    }
    
    // Also check for last player standing (in case this was the only player who wasn't eliminated)
    const lastPlayerStanding = checkLastPlayerStanding(room);
    if (lastPlayerStanding) {
      console.log(`[submit-answer] Last player standing detected: ${lastPlayerStanding.name}`);
      endGame(room, roomCode, lastPlayerStanding);
      return;
    }

    // IMPORTANT: Send the answer result with current game state
    io.to(roomCode).emit('answer-submitted', { 
      playerId,
      isCorrect,
      correctAnswer,
      gameState: room.gameState
    });

    // For correct answers only, add a small delay before changing turn
    // This ensures client UI has time to show the correct answer
    if (isCorrect && room.gameState.gamePhase === 'category_selection') {
      console.log(`[nextTurn] After correct answer by ${playerId}, advancing turn`);
      
      // First, emit a game-state-update with the current game state after the answer was submitted
      // This ensures clients are aware that the answer was submitted correctly
      io.to(roomCode).emit('game-state-update', { 
        gameState: {...room.gameState},
        message: 'Correct answer submitted'
      });
      
      // Add a small delay to ensure clients process the answer-submitted event first
      setTimeout(() => {
        console.log(`[nextTurn] Executing delayed turn advancement for ${playerId}`);
        nextTurn(room, roomCode);
        
        // Send another explicit state update AFTER the turn advances to force UI refresh
        io.to(roomCode).emit('game-state-update', { 
          gameState: room.gameState,
          message: 'Turn advanced after correct answer'
        });
        
        // Double-check that the client is updated with the new player's turn
        io.to(roomCode).emit('next-turn', { gameState: room.gameState });
      }, 1500); // Increased delay to ensure UI has time to update
    }
  });

  // Forfeit: start the charade timer and reveal the word to audience (as needed)
  socket.on('start-charade', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;
    
    // Handle different forfeit types
    if (gameState.currentForfeit.type === 'shot') {
      // For shot forfeits, we just wait a moment then move to next turn
      console.log(`[forfeit] Shot forfeit for ${currentPlayer.name}`);
      gameState.gamePhase = 'category_selection';
      gameState.currentForfeit = null;
      
      // Notify clients about the shot forfeit
      io.to(roomCode).emit('forfeit-completed', { gameState, forfeitType: 'shot' });
      
      // Move to next turn after a short delay
      setTimeout(() => nextTurn(room, roomCode), 5000);
      return;
    }
    
    // For charade forfeits, increment the player's charade count
    if (!currentPlayer.charadeCount) currentPlayer.charadeCount = 0;
    currentPlayer.charadeCount++;
    
    console.log(`[charade] ${currentPlayer.name} has now done ${currentPlayer.charadeCount} charades`);

    // Transition to guessing phase
    gameState.gamePhase = 'charade_guessing';
    gameState.charadeSolution = gameState.currentForfeit.wordToAct;
    gameState.charadeSolved = false;
    const startedAt = Date.now();
    const endsAt = startedAt + CHARADE_DURATION_MS;
    console.log(`[charade] start: room=${roomCode} player=${currentPlayer.id} durationMs=${CHARADE_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
    io.to(roomCode).emit('charade-started', { gameState, deadline: endsAt });

  // Start a 30s countdown
    const prev = charadeTimeouts.get(roomCode);
    if (prev) clearTimeout(prev);
  const handle = setTimeout(() => {
      if (!gameState.charadeSolved) {
        const now = Date.now();
        console.log(`[charade] timeout: room=${roomCode} player=${currentPlayer.id} elapsedMs=${now - startedAt}`);
        // Fail: deduct a life and potentially eliminate
        currentPlayer.lives = Math.max(0, (currentPlayer.lives || 0) - 1);
        if (currentPlayer.lives === 0) {
          currentPlayer.isEliminated = true;
          console.log(`[charade] Player ${currentPlayer.name} eliminated (no lives left)`);
          
          // Check if this was the second-to-last player (leaving only one player)
          const lastPlayerStanding = checkLastPlayerStanding(room);
          if (lastPlayerStanding) {
            console.log(`[charade] Last player standing detected: ${lastPlayerStanding.name}`);
            
            // First notify clients about the charade failure
            io.to(roomCode).emit('charade-failed', { gameState, playerId: currentPlayer.id });
            
            // Then end the game with the last player as winner
            endGame(room, roomCode, lastPlayerStanding);
            
            // Cancel the timeout since game is over
            clearTimeout(handle);
            charadeTimeouts.delete(roomCode);
            
            // Exit early since the game is over
            return;
          }
        } else {
          console.log(`[charade] Player ${currentPlayer.name} lost a life (${currentPlayer.lives} remaining)`);
        }
        
        // Reset for next turn
        gameState.gamePhase = 'category_selection';
        gameState.currentForfeit = null;
        gameState.charadeSolution = null;
        
        // First notify clients about the failure
        io.to(roomCode).emit('charade-failed', { gameState, playerId: currentPlayer.id });
        
        // Then advance the turn to the next player
        console.log(`[charade] Advancing turn after charade timeout`);
        nextTurn(room, roomCode);
      }
  }, CHARADE_DURATION_MS);
    charadeTimeouts.set(roomCode, handle);
  });

  // Forfeit: other players guess the charade word
  socket.on('guess-charade', (roomCode, playerId, guess) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'charade_guessing' || !gameState.charadeSolution) return;

    const normalized = String(guess || '').trim().toLowerCase();
    if (!normalized) return;
    const solution = gameState.charadeSolution.trim().toLowerCase();

    if (normalized === solution) {
      console.log(`[charade-solved] Correct guess by ${playerId}! Solution: ${solution}`);
      
      // Mark as solved and clear timeout
      gameState.charadeSolved = true;
      const t = charadeTimeouts.get(roomCode);
      if (t) clearTimeout(t);

      // Small reward for the actor for successfully conveying the word
      const actor = gameState.players[gameState.currentPlayerIndex];
      actor.score = (actor.score || 0) + 50;

      // Award an extra life to the solver
      const solver = gameState.players.find(p => p.id === playerId);
      if (solver && !solver.isEliminated) {
        solver.lives = (solver.lives || 0) + 1;
        console.log(`[charade-solved] Awarded extra life to ${solver.name} (now has ${solver.lives} lives)`);
      }

      // First notify clients that the charade was solved BEFORE changing game state
      // This way client can show the success animation/message
      io.to(roomCode).emit('charade-solved', { 
        gameState: {...gameState}, 
        solverId: playerId 
      });
      
      // Then reset state for next turn
      gameState.gamePhase = 'category_selection';
      gameState.currentForfeit = null;
      gameState.charadeSolution = null;
      
      // Force a game state update to ensure clients are in sync
      io.to(roomCode).emit('game-state-update', { gameState });
      
      // Finally advance to next turn
      console.log(`[charade-solved] Advancing turn after charade solved by ${playerId}`);
      setTimeout(() => {
        nextTurn(room, roomCode);
      }, 500); // Small delay to ensure state updates propagate
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Add reconnection support
  socket.on('reconnectAttempt', ({ persistentId, gameId, playerId, playerName }, callback) => {
    console.log('Reconnection attempt:', { persistentId, gameId, playerId });
    
    // Check if the game exists
    if (!gameId || !rooms.has(gameId)) {
      callback?.({ success: false, error: 'Game not found' });
      return;
    }
    
    const room = rooms.get(gameId);
    
    // Try to find the player in the game
    const existingPlayer = room.gameState.players.find(p => 
      (p.id === playerId) || (p.persistentId === persistentId)
    );
    
    if (existingPlayer) {
      // Existing player reconnecting
      socket.join(gameId);
      console.log(`Player ${playerId} reconnected to game ${gameId}`);
      
      callback?.({
        success: true,
        isHost: existingPlayer.isHost,
        playerId: existingPlayer.id,
        gameState: room.gameState,
        board: room.board
      });
      return;
    } else if (persistentId && playerName) {
      // Allow new player to join via reconnection if game is in waiting phase
      if (room.gameState.gamePhase === 'waiting') {
        const newPlayer = createPlayer(playerName, false);
        newPlayer.persistentId = persistentId;
        const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);
        
        room.gameState.players.push(assignedPlayer);
        socket.join(gameId);
        
        // Notify other players
        io.to(gameId).emit('player-joined', { gameState: room.gameState });
        
        console.log(`New player ${assignedPlayer.id} joined game ${gameId} via reconnection`);
        callback?.({
          success: true,
          isHost: false,
          playerId: assignedPlayer.id,
          gameState: room.gameState,
          board: room.board
        });
        return;
      }
    }
    
    callback?.({ success: false, error: 'Could not reconnect' });
  });
});

function nextTurn(room, roomCode) {
  // First, check if only one player remains (last player standing)
  const lastPlayerStanding = checkLastPlayerStanding(room);
  if (lastPlayerStanding) {
    console.log(`[nextTurn] Last player standing detected: ${lastPlayerStanding.name}`);
    endGame(room, roomCode, lastPlayerStanding);
    return; // Exit early, game is over
  }
  
  // Clear any lingering timeouts when advancing turns
  const q = questionTimeouts.get(roomCode);
  if (q) { clearTimeout(q); questionTimeouts.delete(roomCode); }
  const c = charadeTimeouts.get(roomCode);
  if (c) { clearTimeout(c); charadeTimeouts.delete(roomCode); }
  
  const players = room.gameState.players;
  const total = players.length;
  const oldIndex = room.gameState.currentPlayerIndex;
  
  // Log the current state before changing
  console.log(`[nextTurn] Before: room=${roomCode} playerCount=${total} currentIndex=${oldIndex} player=${players[oldIndex]?.id} phase=${room.gameState.gamePhase}`);
  
  // Count active players
  const activePlayers = players.filter(p => !p.isEliminated);
  console.log(`[nextTurn] Active players: ${activePlayers.length}/${total}`);
  
  // If all players are eliminated (should not happen due to last player standing check),
  // end the game with no winner
  if (activePlayers.length === 0) {
    console.log(`[nextTurn] All players eliminated, ending game with no winner`);
    endGame(room, roomCode, null);
    return;
  }
  
  // Find the next non-eliminated player
  let attempts = 0;
  do {
    room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % total;
    attempts++;
  } while (players[room.gameState.currentPlayerIndex]?.isEliminated && attempts < total);

  if (room.gameState.currentPlayerIndex === 0) {
    room.gameState.round++;
  }
  
  const newIndex = room.gameState.currentPlayerIndex;
  console.log(`[nextTurn] After: room=${roomCode} newIndex=${newIndex} newPlayer=${players[newIndex]?.id} attempts=${attempts}`);
  
  // Emit the turn change event with updated game state
  io.to(roomCode).emit('next-turn', { gameState: room.gameState });
}

// Function to check if only one player remains
function checkLastPlayerStanding(room) {
  const activePlayers = room.gameState.players.filter(p => !p.isEliminated);
  
  if (activePlayers.length === 1 && room.gameState.players.length > 1) {
    // Only one player remains, and we started with at least 2 players
    const lastPlayer = activePlayers[0];
    console.log(`[win-condition] Last player standing: ${lastPlayer.name} (${lastPlayer.id})`);
    return lastPlayer;
  }
  
  return null;
}

// Function to end the game and declare a winner
function endGame(room, roomCode, winner) {
  console.log(`[game-finished] Game ${roomCode} ending, winner: ${winner?.name || 'None'}`);
  
  room.gameState.gamePhase = 'finished';
  room.gameState.winner = winner;
  
  // Clear any lingering timeouts
  const q = questionTimeouts.get(roomCode);
  if (q) { clearTimeout(q); questionTimeouts.delete(roomCode); }
  
  const c = charadeTimeouts.get(roomCode);
  if (c) { clearTimeout(c); charadeTimeouts.delete(roomCode); }
  
  // Notify all clients of the game end
  io.to(roomCode).emit('game-finished', { gameState: room.gameState });
}

// Serve static files in production
app.use(express.static('dist'));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Game server running on port ${PORT}`);
});
