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
const pictionaryTimeouts = new Map(); // roomCode -> NodeJS.Timeout
// Charade duration hardcoded to 30 seconds
const CHARADE_DURATION_MS = 30000;
// Pictionary duration hardcoded to 45 seconds (longer for drawing)
const PICTIONARY_DURATION_MS = 45000;

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
    charadeCount: 0,
    needsCharadeForLife: false // Track if player got question wrong and needs to lose life on charade failure
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
        charadeSolved: false,
        pictionarySolution: null,
        pictionarySolved: false,
        drawingData: null,
        globalLockedCategories: [], // Global categories locked for all players
        globalRecentCategories: [] // Global recent categories for all players
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
    console.log(`[select-category] Current player: ${currentPlayer?.id} (${currentPlayer?.name}), Requesting player: ${playerId}`);
    console.log(`[select-category] Current player index: ${gameState.currentPlayerIndex}, Total players: ${gameState.players.length}`);
    console.log(`[select-category] All players:`, gameState.players.map(p => ({ id: p.id, name: p.name, eliminated: p.isEliminated })));
    
    if (currentPlayer.id !== playerId) {
      console.log(`[select-category] BLOCKED: Not the current player's turn. Current: ${currentPlayer.id}, Requesting: ${playerId}`);
      return;
    }

    // Check if category is locked globally
    if (!room.gameState.globalLockedCategories) room.gameState.globalLockedCategories = [];
    if (!room.gameState.globalRecentCategories) room.gameState.globalRecentCategories = [];
    
    if (room.gameState.globalLockedCategories.includes(category)) {
      console.log(`Category ${category} is locked globally`);
      socket.emit('category-locked', {
        category,
        message: `You cannot select ${category} yet. You must choose 3 different categories first.`,
        lockedCategories: room.gameState.globalLockedCategories,
        recentCategories: room.gameState.globalRecentCategories
      });
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
      // On incorrect answers, mark that player needs to do charade (but don't deduct life yet)
      // Life will only be deducted if they fail the charade
      currentPlayer.needsCharadeForLife = true; // Track that this player got question wrong
      console.log(`[submit-answer] Player ${currentPlayer.name} answered incorrectly - will do charade`);
    } else {
      // On correct answers, reset the flag
      currentPlayer.needsCharadeForLife = false;
    }

    // Update category progress on correct answers (use categoryScores)
    if (isCorrect && currentQ && currentQ.category) {
      const cat = currentQ.category;
      const current = currentPlayer.categoryScores?.[cat] || 0;
      if (!currentPlayer.categoryScores) currentPlayer.categoryScores = {};
      currentPlayer.categoryScores[cat] = current + 1;
      
      // Initialize global arrays if they don't exist
      if (!room.gameState.globalLockedCategories) room.gameState.globalLockedCategories = [];
      if (!room.gameState.globalRecentCategories) room.gameState.globalRecentCategories = [];
      
      // Add category to global recent categories if not already there
      if (!room.gameState.globalRecentCategories.includes(cat)) {
        room.gameState.globalRecentCategories.push(cat);
        
        // Keep only the last 3 categories in recent categories for tracking progress
        if (room.gameState.globalRecentCategories.length > 3) {
          room.gameState.globalRecentCategories = room.gameState.globalRecentCategories.slice(-3);
        }
      }
      
      // Always lock this category globally when answered correctly
      if (!room.gameState.globalLockedCategories.includes(cat)) {
        // If already have 3 locked categories, unlock the oldest one first
        if (room.gameState.globalLockedCategories.length >= 3) {
          const unlockedCategory = room.gameState.globalLockedCategories.shift(); // Remove oldest
          console.log(`[submit-answer] Unlocked oldest category ${unlockedCategory} globally to maintain max 3 locked categories`);
        }
        
        // Lock the new category globally
        room.gameState.globalLockedCategories.push(cat);
        console.log(`[submit-answer] Locked category ${cat} globally (${room.gameState.globalLockedCategories.length}/3 locked)`);
      }
    }
    
    room.gameState.currentQuestion = null;
    
    if (isCorrect) {
      room.gameState.gamePhase = 'category_selection';
      console.log(`[submit-answer] Set gamePhase to 'category_selection' for correct answer by ${currentPlayer.name}`);
    } else {
      // If answer is incorrect, move to forfeit phase
      room.gameState.gamePhase = 'forfeit';
      const forfeit = require('./server_data/forfeits.cjs').getRandomForfeit(currentPlayer);
      room.gameState.currentForfeit = forfeit;
      console.log(`[submit-answer] Set gamePhase to 'forfeit' for incorrect answer by ${currentPlayer.name}`);
    }

    // Clear any pending question timeout since the answer arrived
    const existing = questionTimeouts.get(roomCode);
    if (existing) clearTimeout(existing);
    questionTimeouts.delete(roomCode);

    // Check win condition: 5 correct in each category
    const hasAll = CATEGORIES.every(cat => (currentPlayer.categoryScores?.[cat] || 0) >= REQUIRED_PER_CATEGORY);
    console.log(`[submit-answer] Win condition check: hasAll=${hasAll}, categoryScores=${JSON.stringify(currentPlayer.categoryScores)}`);
    if (hasAll) {
      console.log(`[submit-answer] Player ${currentPlayer.name} has won by completing all categories!`);
      endGame(room, roomCode, currentPlayer);
      return;
    }
    
    // Also check for last player standing (in case this was the only player who wasn't eliminated)
    const lastPlayerStanding = checkLastPlayerStanding(room);
    console.log(`[submit-answer] Last player check: lastPlayerStanding=${lastPlayerStanding?.name || 'none'}`);
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
      gameState: room.gameState,
      categoryLocked: isCorrect && currentQ ? currentQ.category : null,
      lockedCategories: room.gameState.globalLockedCategories || [],
      recentCategories: room.gameState.globalRecentCategories || [],
      categoryLockMessage: isCorrect && currentQ ? 
        `Category "${currentQ.category}" is now locked for ALL players! Select 3 different categories to unlock it.` : null
    });

    // For correct answers only, add a small delay before changing turn
    // This ensures client UI has time to show the correct answer
    console.log(`[submit-answer] Turn advancement check: isCorrect=${isCorrect}, gamePhase=${room.gameState.gamePhase}, currentPlayer=${currentPlayer.id}`);
    if (isCorrect && room.gameState.gamePhase === 'category_selection') {
      console.log(`[submit-answer] CALLING nextTurn for correct answer by ${playerId}`);
      nextTurn(room, roomCode);
    } else {
      console.log(`[submit-answer] NOT calling nextTurn: isCorrect=${isCorrect}, gamePhase=${room.gameState.gamePhase}`);
    }
  });

  // Forfeit: start the charade or pictionary timer and reveal the word to audience (as needed)
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
      
      // Reset the charade life flag since shot forfeits don't involve charades
      currentPlayer.needsCharadeForLife = false;
      
      gameState.gamePhase = 'category_selection';
      gameState.currentForfeit = null;
      
      // Notify clients about the shot forfeit
      io.to(roomCode).emit('forfeit-completed', { gameState, forfeitType: 'shot' });
      
      // Move to next turn after a short delay
      setTimeout(() => nextTurn(room, roomCode), 5000);
      return;
    }
    
    // For charade or pictionary forfeits, increment the player's charade count
    if (!currentPlayer.charadeCount) currentPlayer.charadeCount = 0;
    currentPlayer.charadeCount++;
    
    console.log(`[${gameState.currentForfeit.type}] ${currentPlayer.name} has now done ${currentPlayer.charadeCount} forfeits`);

    if (gameState.currentForfeit.type === 'charade') {
      // Transition to charade guessing phase
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
          handleForfeitFailure(room, roomCode, currentPlayer, 'charade');
        }
      }, CHARADE_DURATION_MS);
      charadeTimeouts.set(roomCode, handle);
    } else if (gameState.currentForfeit.type === 'pictionary') {
      // Transition to pictionary drawing phase
      gameState.gamePhase = 'pictionary_drawing';
      gameState.pictionarySolution = gameState.currentForfeit.wordToAct;
      gameState.pictionarySolved = false;
      gameState.drawingData = null;
      const startedAt = Date.now();
      const endsAt = startedAt + PICTIONARY_DURATION_MS;
      console.log(`[pictionary] start: room=${roomCode} player=${currentPlayer.id} durationMs=${PICTIONARY_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
      io.to(roomCode).emit('pictionary-started', { gameState, deadline: endsAt });

      // Start a 45s countdown
      const prev = pictionaryTimeouts.get(roomCode);
      if (prev) clearTimeout(prev);
      const handle = setTimeout(() => {
        if (!gameState.pictionarySolved) {
          handleForfeitFailure(room, roomCode, currentPlayer, 'pictionary');
        }
      }, PICTIONARY_DURATION_MS);
      pictionaryTimeouts.set(roomCode, handle);
    }
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
      
      // Reset the charade life flag since they succeeded
      actor.needsCharadeForLife = false;

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

  // Forfeit: handle pictionary drawing updates
  socket.on('update-drawing', (roomCode, playerId, drawingData) => {
    console.log(`Received update-drawing for room ${roomCode} from player ${playerId}`);
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'pictionary_drawing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    // Update the drawing data and broadcast to all players
    gameState.drawingData = drawingData;
    io.to(roomCode).emit('drawing-update', { gameState });
  });

  // Forfeit: other players guess the pictionary word
  socket.on('guess-pictionary', (roomCode, playerId, guess) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'pictionary_drawing' || !gameState.pictionarySolution) return;

    const normalized = String(guess || '').trim().toLowerCase();
    if (!normalized) return;
    const solution = gameState.pictionarySolution.trim().toLowerCase();

    if (normalized === solution) {
      console.log(`[pictionary-solved] Correct guess by ${playerId}! Solution: ${solution}`);
      
      // Mark as solved and clear timeout
      gameState.pictionarySolved = true;
      const t = pictionaryTimeouts.get(roomCode);
      if (t) clearTimeout(t);

      // Small reward for the drawer for successfully conveying the word
      const drawer = gameState.players[gameState.currentPlayerIndex];
      drawer.score = (drawer.score || 0) + 50;
      
      // Reset the charade life flag since they succeeded
      drawer.needsCharadeForLife = false;

      // Award an extra life to the solver
      const solver = gameState.players.find(p => p.id === playerId);
      if (solver && !solver.isEliminated) {
        solver.lives = (solver.lives || 0) + 1;
        console.log(`[pictionary-solved] Awarded extra life to ${solver.name} (now has ${solver.lives} lives)`);
      }

      // First notify clients that the pictionary was solved BEFORE changing game state
      io.to(roomCode).emit('pictionary-solved', { 
        gameState: {...gameState}, 
        solverId: playerId 
      });
      
      // Then reset state for next turn
      gameState.gamePhase = 'category_selection';
      gameState.currentForfeit = null;
      gameState.pictionarySolution = null;
      gameState.drawingData = null;
      
      // Force a game state update to ensure clients are in sync
      io.to(roomCode).emit('game-state-update', { gameState });
      
      // Finally advance to next turn
      console.log(`[pictionary-solved] Advancing turn after pictionary solved by ${playerId}`);
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

function handleForfeitFailure(room, roomCode, currentPlayer, forfeitType) {
  const gameState = room.gameState;
  
  // Fail: only deduct a life if the player got the question wrong
  if (currentPlayer.needsCharadeForLife) {
    currentPlayer.lives = Math.max(0, (currentPlayer.lives || 0) - 1);
    console.log(`[${forfeitType}] Player ${currentPlayer.name} failed ${forfeitType} after wrong answer - lost a life (${currentPlayer.lives} remaining)`);
    
    if (currentPlayer.lives === 0) {
      currentPlayer.isEliminated = true;
      console.log(`[${forfeitType}] Player ${currentPlayer.name} eliminated (no lives left)`);
      
      // Check if this was the second-to-last player (leaving only one player)
      const lastPlayerStanding = checkLastPlayerStanding(room);
      if (lastPlayerStanding) {
        console.log(`[${forfeitType}] Last player standing detected: ${lastPlayerStanding.name}`);
        
        // First notify clients about the failure
        io.to(roomCode).emit(`${forfeitType}-failed`, { gameState, playerId: currentPlayer.id });
        
        // Then end the game with the last player as winner
        endGame(room, roomCode, lastPlayerStanding);
        
        // Exit early since the game is over
        return;
      }
    }
  } else {
    console.log(`[${forfeitType}] Player ${currentPlayer.name} failed ${forfeitType} but keeps life (got question correct)`);
  }
  
  // Reset the flag
  currentPlayer.needsCharadeForLife = false;
  
  // Reset for next turn
  gameState.gamePhase = 'category_selection';
  gameState.currentForfeit = null;
  
  if (forfeitType === 'charade') {
    gameState.charadeSolution = null;
  } else if (forfeitType === 'pictionary') {
    gameState.pictionarySolution = null;
    gameState.drawingData = null;
  }
  
  // First notify clients about the failure
  io.to(roomCode).emit(`${forfeitType}-failed`, { gameState, playerId: currentPlayer.id });
  
  // Then advance the turn to the next player
  console.log(`[${forfeitType}] Advancing turn after ${forfeitType} timeout`);
  nextTurn(room, roomCode);
}

function nextTurn(room, roomCode) {
  console.log(`[nextTurn] STARTING: room=${roomCode}`);
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
    console.log(`[nextTurn] Attempt ${attempts}: newIndex=${room.gameState.currentPlayerIndex}, player=${players[room.gameState.currentPlayerIndex]?.id}, eliminated=${players[room.gameState.currentPlayerIndex]?.isEliminated}`);
  } while (players[room.gameState.currentPlayerIndex]?.isEliminated && attempts < total);

  if (room.gameState.currentPlayerIndex === 0) {
    room.gameState.round++;
  }
  
  const newIndex = room.gameState.currentPlayerIndex;
  console.log(`[nextTurn] After: room=${roomCode} newIndex=${newIndex} newPlayer=${players[newIndex]?.id} attempts=${attempts}`);
  
  // Reset game phase to 'playing' for the new player's turn
  // This ensures the new player can roll dice and start their turn properly
  // BUT keep 'category_selection' phase if that's what the game requires
  if (room.gameState.gamePhase === 'category_selection') {
    // Keep category_selection phase for the next player to choose a category
    console.log(`[nextTurn] Keeping gamePhase as 'category_selection' for new player ${players[newIndex]?.id} to select category`);
  } else if (room.gameState.gamePhase !== 'forfeit' && room.gameState.gamePhase !== 'charade_guessing') {
    // Only reset to 'playing' for other phases
    room.gameState.gamePhase = 'playing';
    console.log(`[nextTurn] Reset gamePhase to 'playing' for new player ${players[newIndex]?.id}`);
  }
  
  // Emit the turn change event with updated game state
  console.log(`[nextTurn] Emitting next-turn: gamePhase=${room.gameState.gamePhase}, currentPlayerIndex=${room.gameState.currentPlayerIndex}, currentPlayer=${players[newIndex]?.name} (${players[newIndex]?.id})`);
  io.to(roomCode).emit('next-turn', { gameState: room.gameState });
  console.log(`[nextTurn] COMPLETED: room=${roomCode}`);
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
