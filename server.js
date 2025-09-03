const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Load question data
const questionsPath = path.join(__dirname, 'dist', 'assets', 'questions.json');
const allQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state management
const rooms = new Map();

// Utility functions
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createPlayer = (name, isHost = false) => {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name,
    color: '',
    avatar: '',
    score: 0,
    position: 0,
    isHost,
    categoryProgress: {} // Initialize empty category progress tracking
  };
};

const playerColors = ['#EF5555', '#4B92FF', '#20C991', '#F5AE1B', '#9B6CF6', '#FC59A9'];
const playerAvatars = ['🦊', '🐻', '🐱', '🐸', '🦁', '🐼'];
const MAX_PLAYERS = 6;
const BOARD_SIZE = 40; // Monopoly-style board has 40 squares

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

// Define the categories and their colors
const questionCategories = ['History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology'];

const categoryColors = [
  '#EF4444', // History - Red
  '#3B82F6', // Science - Blue
  '#10B981', // Sports - Green
  '#F59E0B', // Entertainment - Yellow
  '#8B5CF6', // Geography - Purple
  '#EC4899', // Technology - Pink
];

// Function to get category for a specific position
const getCategoryForPosition = (position) => {
  if (position === 0) {
    return 'Start';
  }
  
  // Every 8th position is a chance square
  if (position % 8 === 0) {
    return 'Chance';
  }
  
  // Calculate which category this belongs to (excluding chance squares)
  const categoryIndex = (position - 1) % 6;
  return questionCategories[categoryIndex];
};

// Function to get color for a category
const getColorForCategory = (category) => {
  const index = questionCategories.indexOf(category);
  if (index !== -1) {
    return categoryColors[index];
  }
  return '#FFFFFF'; // Default white
};

const generateBoard = () => {
  const board = [];
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Start square is special
    if (i === 0) {
      board.push({ 
        id: i, 
        type: 'start',
        category: 'Start',
        color: '#22C55E', // Green
        ownedBy: null,
      });
      continue;
    }
    
    // Every 8th position (8, 16, 24, 32) is a chance square
    if (i % 8 === 0) {
      board.push({ 
        id: i, 
        type: 'chance', 
        category: 'Chance',
        color: '#FB923C', // Orange
        ownedBy: null,
      });
      continue;
    }
    
    // All other squares are category questions
    const category = getCategoryForPosition(i);
    const color = getColorForCategory(category);
    
    board.push({ 
      id: i, 
      type: 'question', 
      category, 
      color,
      ownedBy: null,
    });
  }
  
  return board;
};

// Sample questions (in production, this would be a larger database)
const sampleQuestions = [
  {
    id: '1',
    category: 'History',
    question: 'Who was the first President of the United States?',
    options: ['George Washington', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '2',
    category: 'Science',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    difficulty: 'easy'
  }
];

const getRandomQuestion = (usedQuestionIds = [], category = null) => {
  let availableQuestions;
  
  if (category) {
    // Get questions for a specific category
    availableQuestions = allQuestions.filter(
      q => q.category === category && !usedQuestionIds.includes(q.id)
    );
    
    // If no unused questions in this category, get any question from the category
    if (availableQuestions.length === 0) {
      availableQuestions = allQuestions.filter(q => q.category === category);
    }
  } else {
    // Get any available question
    availableQuestions = allQuestions.filter(q => !usedQuestionIds.includes(q.id));
  }
  
  // If we still don't have questions, use any question
  if (availableQuestions.length === 0) {
    availableQuestions = allQuestions;
  }
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
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
  console.log('User connected:', socket.id);

  socket.on('create-room', (hostName, callback) => {
    const roomCode = generateRoomCode();
    const host = createPlayer(hostName, true);
    const assignedHost = assignPlayerAppearance(host, []);
    
    const gameState = {
      id: roomCode,
      players: [assignedHost],
      currentPlayerIndex: 0,
      currentQuestion: null,
      boardSize: BOARD_SIZE,
      gamePhase: 'waiting',
      winner: null,
      round: 1,
      maxRounds: 10
    };

    const room = {
      id: roomCode,
      gameState,
      board: generateBoard(),
      usedQuestionIds: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    callback({ success: true, roomCode, gameState, board: room.board });
  });

  socket.on('join-room', (roomCode, playerName, callback) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
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
    const room = rooms.get(roomCode);
    if (!room || room.gameState.players.length < 2) return;

    room.gameState.gamePhase = 'playing';
    io.to(roomCode).emit('game-started', { gameState: room.gameState, board: room.board });
  });

  socket.on('roll-dice', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const diceRoll = rollDice();
    const player = room.gameState.players.find(p => p.id === playerId);
    const newPosition = Math.max(0, Math.min(BOARD_SIZE - 1, player.position + diceRoll));
    
    player.position = newPosition;
    const boardSquare = room.board[newPosition];
    
    io.to(roomCode).emit('dice-rolled', { 
      diceRoll, 
      gameState: room.gameState, 
      playerId,
      newPosition,
      squareType: boardSquare.type,
      category: boardSquare.category
    });

    setTimeout(() => {
      if (boardSquare.type === 'question') {
        // Get unused questions for this category
        let unusedCategoryQuestions = allQuestions.filter(q => q.category === boardSquare.category && !room.usedQuestionIds.includes(q.id));
        let question;
        if (unusedCategoryQuestions.length > 0) {
          question = unusedCategoryQuestions[Math.floor(Math.random() * unusedCategoryQuestions.length)];
        } else {
          // If all used, reset usedQuestionIds for this category only
          const allCategoryQuestions = allQuestions.filter(q => q.category === boardSquare.category);
          question = allCategoryQuestions[Math.floor(Math.random() * allCategoryQuestions.length)];
          // Reset used questions for this category
          room.usedQuestionIds = room.usedQuestionIds.filter(id => {
            const q = allQuestions.find(q => q.id === id);
            return q && q.category !== boardSquare.category;
          });
        }
        room.usedQuestionIds.push(question.id);
        room.gameState.currentQuestion = question;
        room.gameState.gamePhase = 'question';
        io.to(roomCode).emit('question-presented', {
          question,
          gameState: room.gameState,
          playerId,
          currentSquare: boardSquare
        });
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
          playerId,
          board: room.board
        });
        setTimeout(() => nextTurn(room, roomCode), 3000);
      } else if (boardSquare.type === 'start') {
        // When landing on start, give bonus points
        player.score += 50;
        io.to(roomCode).emit('start-landed', {
          gameState: room.gameState,
          playerId,
          message: `${player.name} landed on Start and got 50 bonus points!`
        });
        setTimeout(() => nextTurn(room, roomCode), 2000);
      } else {
        nextTurn(room, roomCode);
      }
    }, 1500);
  });

  socket.on('submit-answer', (roomCode, playerId, answerIndex) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
    const points = isCorrect ? 100 : 0;
    
    currentPlayer.score += points;
    const correctAnswer = room.gameState.currentQuestion.correctAnswer;
    
    // If correct answer and on a question square, claim the square for this player (only if not already owned)
    const playerPosition = currentPlayer.position;
    const currentSquare = room.board[playerPosition];
    if (
      isCorrect &&
      currentSquare.type === 'question' &&
      !currentSquare.ownedBy // Only claim if not already owned
    ) {
      currentSquare.ownedBy = playerId;
      // Set the square color to its category color (already set on creation, but can be reinforced here)
      // Track progress in this category
      if (!currentPlayer.categoryProgress) {
        currentPlayer.categoryProgress = {};
      }
      const category = currentSquare.category;
      if (!currentPlayer.categoryProgress[category]) {
        currentPlayer.categoryProgress[category] = 0;
      }
      currentPlayer.categoryProgress[category]++;
    }
    
    room.gameState.currentQuestion = null;
    room.gameState.gamePhase = 'playing';

    io.to(roomCode).emit('answer-submitted', { 
      playerId,
      answerIndex,
      isCorrect,
      points,
      correctAnswer,
      gameState: room.gameState,
      board: room.board
    });

    setTimeout(() => nextTurn(room, roomCode), 3000);
  });

  // Handle legacy rejoin requests
  socket.on('rejoin-room', (roomCode, playerId, callback) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    // If it's the host rejoining
    if (!playerId) {
      const hostPlayer = room.gameState.players.find(p => p.isHost);
      if (hostPlayer) {
        socket.join(roomCode);
        callback({
          success: true,
          gameState: room.gameState,
          board: room.board
        });
        return;
      }
    }
    
    // If it's a player rejoining
    const player = room.gameState.players.find(p => p.id === playerId);
    if (player) {
      socket.join(roomCode);
      callback({
        success: true,
        gameState: room.gameState,
        board: room.board
      });
      return;
    }
    
    callback({ success: false, error: 'Player not found' });
  });

  socket.on('reconnectAttempt', ({ persistentId, gameId, playerId, playerName }, callback) => {
    console.log('Reconnection attempt:', { persistentId, gameId, playerId });
    const room = rooms.get(gameId);
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    // Check if the player is in the game
    const playerIndex = room.gameState.players.findIndex(p => p.id === playerId);
    let isHost = false;
    
    // Player exists in this game
    if (playerIndex >= 0) {
      socket.join(gameId);
      isHost = room.gameState.players[playerIndex].isHost;
      console.log(`Player ${playerId} reconnected to game ${gameId}`);
      
      callback({
        success: true,
        isHost,
        gameState: room.gameState, 
        board: room.board,
        playerId
      });
      return;
    }
    
    // If it's a new connection but the game has already started, can't join
    if (room.gameState.gamePhase !== 'waiting') {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }
    
    // If it's a valid connection but player needs to be created
    if (playerName && room.gameState.players.length < MAX_PLAYERS) {
      const newPlayer = createPlayer(playerName);
      const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);
      
      room.gameState.players.push(assignedPlayer);
      socket.join(gameId);
      
      console.log(`New player ${assignedPlayer.id} joined game ${gameId} via reconnection`);
      
      io.to(gameId).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });
      callback({ 
        success: true, 
        isHost: false,
        gameState: room.gameState, 
        board: room.board, 
        playerId: assignedPlayer.id 
      });
      return;
    }
    
    callback({ success: false, error: 'Could not reconnect' });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function nextTurn(room, roomCode) {
  room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
  
  if (room.gameState.currentPlayerIndex === 0) {
    room.gameState.round++;
  }

  if (room.gameState.round > room.gameState.maxRounds) {
    const winner = [...room.gameState.players].sort((a, b) => b.score - a.score)[0];
    room.gameState.winner = winner;
    room.gameState.gamePhase = 'finished';
    io.to(roomCode).emit('game-finished', { gameState: room.gameState });
    return;
  }

  io.to(roomCode).emit('next-turn', { gameState: room.gameState });
}

// Serve static files in production
app.use(express.static('dist'));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});