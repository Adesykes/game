import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { GameState, BoardSquare } from '../types/game';
import { 
  generateRoomCode, 
  createPlayer, 
  assignPlayerAppearance, 
  generateBoard,
  getRandomQuestion,
  rollDice,
  movePlayer,
  addPointsToPlayer,
  processChanceEvent,
  checkWinCondition,
  getNextPlayer,
  BOARD_SIZE,
  MAX_PLAYERS
} from '../utils/gameLogic';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface Room {
  id: string;
  gameState: GameState;
  board: BoardSquare[];
  usedQuestionIds: string[];
}

const rooms = new Map<string, Room>();

// Serve static files in production
app.use(express.static('dist'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (hostName: string, callback) => {
    const roomCode = generateRoomCode();
    const host = createPlayer(hostName, true);
    const assignedHost = assignPlayerAppearance(host, []);
    
    const gameState: GameState = {
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

    const room: Room = {
      id: roomCode,
      gameState,
      board: generateBoard(),
      usedQuestionIds: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    callback({ success: true, roomCode, gameState, board: room.board });
  });

  // Handle v2 events (with persistent ID)
  socket.on('create-room-v2', (data: { hostName: string; persistentId: string }, callback) => {
    console.log(`[server] create-room-v2 event received:`, data);
    const roomCode = generateRoomCode();
    const host = createPlayer(data.hostName, true);
    const assignedHost = assignPlayerAppearance(host, []);
    
    const gameState: GameState = {
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

    const room: Room = {
      id: roomCode,
      gameState,
      board: generateBoard(),
      usedQuestionIds: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    console.log(`[server] Room ${roomCode} created successfully with v2 event`);
    callback({ success: true, roomCode, gameState, board: room.board });
  });

  socket.on('join-room', (roomCode: string, playerName: string, callback) => {
    console.log(`[server] join-room event received: roomCode=${roomCode}, playerName=${playerName}`);

    const room = rooms.get(roomCode);
    console.log(`[server] Room lookup result:`, room ? 'found' : 'not found');

    if (!room) {
      console.log(`[server] Room ${roomCode} not found`);
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameState.players.length >= MAX_PLAYERS) {
      console.log(`[server] Room ${roomCode} is full (${room.gameState.players.length}/${MAX_PLAYERS})`);
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.gameState.gamePhase !== 'waiting') {
      console.log(`[server] Room ${roomCode} game already started (phase: ${room.gameState.gamePhase})`);
      callback({ success: false, error: 'Game already started' });
      return;
    }

    console.log(`[server] Creating new player: ${playerName}`);
    const newPlayer = createPlayer(playerName);
    const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);

    console.log(`[server] Adding player ${assignedPlayer.name} to room ${roomCode}`);
    room.gameState.players.push(assignedPlayer);
    socket.join(roomCode);

    console.log(`[server] Emitting player-joined event to room ${roomCode}`);
    io.to(roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });

    console.log(`[server] Sending success callback for player ${assignedPlayer.id}`);
    callback({ success: true, gameState: room.gameState, board: room.board, playerId: assignedPlayer.id });
  });

  // Handle v2 join-room event (with persistent ID)
  socket.on('join-room-v2', (data: { roomCode: string; playerName: string; persistentId: string }, callback) => {
    console.log(`[server] join-room-v2 event received:`, data);

    const room = rooms.get(data.roomCode);
    console.log(`[server] Room lookup result for ${data.roomCode}:`, room ? 'found' : 'not found');

    if (!room) {
      console.log(`[server] Room ${data.roomCode} not found`);
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameState.players.length >= MAX_PLAYERS) {
      console.log(`[server] Room ${data.roomCode} is full (${room.gameState.players.length}/${MAX_PLAYERS})`);
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.gameState.gamePhase !== 'waiting') {
      console.log(`[server] Room ${data.roomCode} game already started (phase: ${room.gameState.gamePhase})`);
      callback({ success: false, error: 'Game already started' });
      return;
    }

    console.log(`[server] Creating new player: ${data.playerName}`);
    const newPlayer = createPlayer(data.playerName);
    const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);

    console.log(`[server] Adding player ${assignedPlayer.name} to room ${data.roomCode}`);
    room.gameState.players.push(assignedPlayer);
    socket.join(data.roomCode);

    console.log(`[server] Emitting player-joined event to room ${data.roomCode}`);
    io.to(data.roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });

    console.log(`[server] Sending success callback for player ${assignedPlayer.id}`);
    callback({ success: true, gameState: room.gameState, board: room.board, playerId: assignedPlayer.id });
  });

  socket.on('start-game', (roomCode: string) => {
    const room = rooms.get(roomCode);
    if (!room || room.gameState.players.length < 2) return;

    room.gameState.gamePhase = 'playing';
    io.to(roomCode).emit('game-started', { gameState: room.gameState, board: room.board });
  });

  socket.on('roll-dice', (roomCode: string, playerId: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const diceRoll = rollDice();
    const newGameState = movePlayer(room.gameState, playerId, diceRoll);
    room.gameState = newGameState;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const boardSquare = room.board[player.position];
    
    io.to(roomCode).emit('dice-rolled', { 
      diceRoll, 
      gameState: room.gameState, 
      playerId,
      newPosition: player.position,
      squareType: boardSquare.type
    });

    // Handle different square types
    setTimeout(() => {
      if (boardSquare.type === 'question') {
        const question = getRandomQuestion(room.usedQuestionIds);
        room.usedQuestionIds.push(question.id);
        room.gameState.currentQuestion = question;
        room.gameState.gamePhase = 'question';
        
        io.to(roomCode).emit('question-presented', { 
          question, 
          gameState: room.gameState,
          playerId 
        });
      } else if (boardSquare.type === 'chance') {
        const { gameState: updatedGameState, event } = processChanceEvent(room.gameState, playerId);
        room.gameState = updatedGameState;
        
        io.to(roomCode).emit('chance-event', { 
          event, 
          gameState: room.gameState,
          playerId 
        });
        
        // Continue to next player after chance event
        setTimeout(() => {
          nextTurn(room, roomCode);
        }, 3000);
      } else {
        // Normal square or finish
        if (player.position >= BOARD_SIZE - 1) {
          // Player reached finish
          room.gameState.winner = player;
          room.gameState.gamePhase = 'finished';
          io.to(roomCode).emit('game-finished', { gameState: room.gameState });
        } else {
          nextTurn(room, roomCode);
        }
      }
    }, 1500);
  });

  socket.on('submit-answer', (roomCode: string, playerId: string, answerIndex: number) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
    const points = isCorrect ? 100 : 0;
    
    const newGameState = addPointsToPlayer(room.gameState, playerId, points);
    newGameState.currentQuestion = null;
    newGameState.gamePhase = 'playing';
    room.gameState = newGameState;

    io.to(roomCode).emit('answer-submitted', { 
      playerId,
      answerIndex,
      isCorrect,
      points,
      correctAnswer: room.gameState.currentQuestion?.correctAnswer,
      gameState: room.gameState
    });

    // Check win condition
    const winner = checkWinCondition(room.gameState);
    if (winner) {
      room.gameState.winner = winner;
      room.gameState.gamePhase = 'finished';
      io.to(roomCode).emit('game-finished', { gameState: room.gameState });
      return;
    }

    // Continue to next player
    setTimeout(() => {
      nextTurn(room, roomCode);
    }, 3000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function nextTurn(room: Room, roomCode: string) {
  room.gameState.currentPlayerIndex = getNextPlayer(room.gameState);
  
  // If we're back to player 0, increment round
  if (room.gameState.currentPlayerIndex === 0) {
    room.gameState.round++;
  }

  // Check if max rounds reached
  const winner = checkWinCondition(room.gameState);
  if (winner) {
    room.gameState.winner = winner;
    room.gameState.gamePhase = 'finished';
    io.to(roomCode).emit('game-finished', { gameState: room.gameState });
    return;
  }

  io.to(roomCode).emit('next-turn', { gameState: room.gameState });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});