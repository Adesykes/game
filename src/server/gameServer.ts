import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { GameState, Player } from '../types/game';
import { 
  generateRoomCode, 
  createPlayer, 
  assignPlayerAppearance, 
  getNextPlayer,
  MAX_PLAYERS,
  getRandomQuestion
} from '../utils/gameLogic';

// Simple win condition check - player needs 5 in each category
const checkWinCondition = (gameState: GameState): Player | null => {
  const questionCategories = ['History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology', 'Music', 'Food', 'Literature', 'Animals'];
  
  for (const player of gameState.players) {
    if (player.isEliminated) continue;
    
    const hasAllCategories = questionCategories.every(category => 
      (player.categoryScores[category] || 0) >= 5
    );
    
    if (hasAllCategories) {
      return player;
    }
  }
  
  return null;
};

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
      selectedCategory: null,
      gamePhase: 'waiting',
      winner: null,
      round: 1,
      maxRounds: 5,
      cyclesPerRound: 2,
      cycleInRound: 0,
      currentForfeit: null,
      charadeSolution: null,
      charadeSolved: false,
      pictionarySolution: null,
      pictionarySolved: false,
      drawingData: null,
      globalLockedCategories: [],
      globalRecentCategories: []
    };

    const room: Room = {
      id: roomCode,
      gameState,
      usedQuestionIds: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    callback({ success: true, roomCode, gameState });
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
      selectedCategory: null,
      gamePhase: 'waiting',
      winner: null,
      round: 1,
      maxRounds: 5,
      cyclesPerRound: 2,
      cycleInRound: 0,
      currentForfeit: null,
      charadeSolution: null,
      charadeSolved: false,
      pictionarySolution: null,
      pictionarySolved: false,
      drawingData: null,
      globalLockedCategories: [],
      globalRecentCategories: []
    };

    const room: Room = {
      id: roomCode,
      gameState,
      usedQuestionIds: []
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    console.log(`[server] Room ${roomCode} created successfully with v2 event`);
    callback({ success: true, roomCode, gameState });
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
    callback({ success: true, gameState: room.gameState, playerId: assignedPlayer.id });
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
    callback({ success: true, gameState: room.gameState, playerId: assignedPlayer.id });
  });

  socket.on('start-game', (roomCode: string) => {
    const room = rooms.get(roomCode);
    if (!room || room.gameState.players.length < 2) return;

    room.gameState.gamePhase = 'category_selection';
    io.to(roomCode).emit('game-started', { gameState: room.gameState });
  });

  // Start a head-to-head challenge (Round 2)
  socket.on('start-h2h', (roomCode: string, challengerId: string, opponentId: string, question: any) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    // Only allow during Round 2 and when it's challenger's turn
    if (room.gameState.round !== 2) return;
    // Only from category_selection or question phases; never during karaoke/forfeits/drawing
    if (!['category_selection', 'question'].includes(room.gameState.gamePhase)) return;
    if (['karaoke_break', 'karaoke_voting', 'forfeit', 'charade_guessing', 'pictionary_drawing', 'lightning_round', 'finished'].includes(room.gameState.gamePhase)) return;
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== challengerId) return;
    if (!room.gameState.players.find(p => p.id === opponentId && !p.isEliminated && p.id !== challengerId)) return;

    room.gameState.h2hActive = true;
    room.gameState.h2hChallengerId = challengerId;
    room.gameState.h2hOpponentId = opponentId;
    room.gameState.h2hStartAt = Date.now();
    room.gameState.h2hSubmissions = {};
    // Auto-pick a fresh random question from the pool
    try {
      const q = getRandomQuestion(room.usedQuestionIds);
      room.usedQuestionIds.push(q.id);
      room.gameState.currentQuestion = q as any;
    } catch (e) {
      // Fallback: if util fails for any reason, keep any provided question shape
      room.gameState.currentQuestion = question || null;
    }
    room.gameState.gamePhase = 'question';

    io.to(roomCode).emit('h2h-started', { gameState: room.gameState, challengerId, opponentId, deadline: room.gameState.h2hStartAt + 25000 });
  });

  socket.on('submit-answer', (roomCode: string, playerId: string, answerIndex: number) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.currentQuestion) return;

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    const isH2HActive = !!room.gameState.h2hActive;
    const allowedH2HPlayers = isH2HActive ? [room.gameState.h2hChallengerId, room.gameState.h2hOpponentId].filter(Boolean) as string[] : [];
    const isH2HParticipant = isH2HActive && allowedH2HPlayers.includes(playerId);
    // In H2H, allow both participants to submit regardless of turn; otherwise enforce current player's turn
    const isSudden = !!room.gameState.suddenDeathActive && !!room.gameState.suddenDeathCurrentPair;
    const allowedSuddenPlayers = isSudden ? room.gameState.suddenDeathCurrentPair as [string, string] : null;
    const isSuddenParticipant = isSudden && allowedSuddenPlayers ? (allowedSuddenPlayers[0] === playerId || allowedSuddenPlayers[1] === playerId) : false;
    if (!isH2HParticipant && !isSuddenParticipant && currentPlayer.id !== playerId) return;

  const isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
    const points = isCorrect ? 100 : 0;
    console.log(`[submit-answer] Answer ${answerIndex} is ${isCorrect ? 'correct' : 'incorrect'} (correct: ${room.gameState.currentQuestion.correctAnswer})`);
    
    // Update power bar for normal turns only; H2H players are updated in H2H branch below
  const isH2HActiveNow = !!room.gameState.h2hActive;
  const isSuddenNow = !!room.gameState.suddenDeathActive;
  if (!isH2HActiveNow && !isSuddenNow) {
      console.log(`[submit-answer] About to update power bar for player ${playerId}`);
      const playerIndex = room.gameState.players.findIndex(p => p.id === playerId);
      console.log(`[submit-answer] Found player at index ${playerIndex}`);
      if (playerIndex !== -1) {
        const currentPowerBar = room.gameState.players[playerIndex].powerBar || 50;
        const powerBarChange = isCorrect ? 10 : -10;
        const newPowerBar = Math.max(0, Math.min(100, currentPowerBar + powerBarChange));
        console.log(`[server] Power bar update: ${room.gameState.players[playerIndex].name} ${currentPowerBar}% -> ${newPowerBar}% (${isCorrect ? '+' : '-'}${Math.abs(powerBarChange)}%)`);
        room.gameState.players[playerIndex].powerBar = newPowerBar;
        
        // Check if player reached 100% and grant sabotage ability
        if (newPowerBar >= 100 && currentPowerBar < 100) {
          // Player just reached 100%, grant sabotage ability
          room.gameState.players[playerIndex].hasSabotage = true;
          console.log(`[server] Sabotage granted to ${room.gameState.players[playerIndex].name} (${playerId})`);
          io.to(roomCode).emit('sabotage-granted', { playerId, playerName: room.gameState.players[playerIndex].name, gameState: room.gameState });
        }
      }
    }
    
    // If head-to-head is active, record submission and apply effects once both have answered or timer expires
  if (room.gameState.h2hActive && (room.gameState.h2hChallengerId || room.gameState.h2hOpponentId)) {
      // Only accept answers from the two head-to-head players
      const allowed = [room.gameState.h2hChallengerId, room.gameState.h2hOpponentId].filter(Boolean) as string[];
      if (!allowed.includes(playerId)) return;
      if (!room.gameState.h2hSubmissions) room.gameState.h2hSubmissions = {};
      room.gameState.h2hSubmissions[playerId] = { answerIndex, timestamp: Date.now() };

      // Apply immediate effects for this player
      const pIdx = room.gameState.players.findIndex(p => p.id === playerId);
      if (pIdx !== -1) {
        const p = room.gameState.players[pIdx];
        // life and power bar adjustments
        if (isCorrect) {
          p.lives = Math.min(5, (p.lives || 3) + 1);
          const currentPowerBar = p.powerBar || 50;
          p.powerBar = Math.min(100, currentPowerBar + 10);
        } else {
          p.lives = Math.max(0, (p.lives || 3) - 1);
          const currentPowerBar = p.powerBar || 50;
          p.powerBar = Math.max(0, currentPowerBar - 10);
          if (p.lives <= 0) p.isEliminated = true;
        }
      }

      io.to(roomCode).emit('answer-submitted', { 
        playerId,
        answerIndex,
        isCorrect,
        points: isCorrect ? 100 : 0,
        correctAnswer: room.gameState.currentQuestion?.correctAnswer,
        gameState: room.gameState
      });

      const chId = room.gameState.h2hChallengerId as string | undefined;
      const opId = room.gameState.h2hOpponentId as string | undefined;
      const chSub = chId ? room.gameState.h2hSubmissions[chId] : undefined;
      const opSub = opId ? room.gameState.h2hSubmissions[opId] : undefined;
      const correctIdx = room.gameState.currentQuestion?.correctAnswer;
      const chCorrect = chSub && typeof correctIdx === 'number' ? chSub.answerIndex === correctIdx : false;
      const opCorrect = opSub && typeof correctIdx === 'number' ? opSub.answerIndex === correctIdx : false;
      const bothAnswered = !!(chSub && opSub);
      const someoneCorrect = !!(chCorrect || opCorrect);
      const timerExpired = (room.gameState.h2hStartAt || 0) > 0 && Date.now() - (room.gameState.h2hStartAt || 0) > 25000;

      if (bothAnswered || someoneCorrect || timerExpired) {
        // End H2H and proceed to next turn
        room.gameState.h2hActive = false;
        room.gameState.h2hChallengerId = null;
        room.gameState.h2hOpponentId = null;
        room.gameState.h2hStartAt = null;
        room.gameState.h2hSubmissions = {};
        room.gameState.currentQuestion = null;
        room.gameState.gamePhase = 'category_selection';
        io.to(roomCode).emit('h2h-complete', { gameState: room.gameState });
        setTimeout(() => nextTurn(room, roomCode), 2000);
      }
      return;
    }

    // Sudden death submission handling
    if (room.gameState.suddenDeathActive && room.gameState.suddenDeathCurrentPair) {
      const pair = room.gameState.suddenDeathCurrentPair;
      const allowed = [pair[0], pair[1]];
      if (!allowed.includes(playerId)) return;
      if (!room.gameState.h2hSubmissions) room.gameState.h2hSubmissions = {};
      room.gameState.h2hSubmissions[playerId] = { answerIndex, timestamp: Date.now() };

      io.to(roomCode).emit('answer-submitted', { 
        playerId,
        answerIndex,
        isCorrect,
        points: isCorrect ? 100 : 0,
        correctAnswer: room.gameState.currentQuestion?.correctAnswer,
        gameState: room.gameState
      });

      const bothAnswered = room.gameState.h2hSubmissions[pair[0]] && room.gameState.h2hSubmissions[pair[1]];
      const timerExpired = false; // client 15s timer; we can also enforce here if desired

      if (bothAnswered || timerExpired) {
        // Apply life changes: wrong loses 1 life; correct unchanged
        [pair[0], pair[1]].forEach(pid => {
          const sub = room.gameState.h2hSubmissions![pid];
          const correct = sub && sub.answerIndex === room.gameState.currentQuestion!.correctAnswer;
          const pIdx = room.gameState.players.findIndex(p => p.id === pid);
          if (pIdx !== -1) {
            const p = room.gameState.players[pIdx];
            if (!correct) {
              p.lives = Math.max(0, (p.lives || 3) - 1);
              if (p.lives <= 0) p.isEliminated = true;
            }
          }
        });

        // Clear question and submissions, move to next pair
        room.gameState.currentQuestion = null;
        room.gameState.h2hSubmissions = {};
        room.gameState.h2hActive = false;
        room.gameState.h2hChallengerId = null;
        room.gameState.h2hOpponentId = null;
        room.gameState.h2hStartAt = null;
        io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: 'Sudden death result processed' });
        setTimeout(() => advanceSuddenDeath(room, roomCode), 1000);
      }
      return;
    }

    const newGameState = { ...room.gameState };
    newGameState.currentQuestion = null;
    newGameState.gamePhase = 'category_selection';
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

  // --- Karaoke: voting ---
  socket.on('karaoke-vote', (roomCode: string, playerId: string, optionIndex: number) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'karaoke_voting') return;
    if (!Array.isArray(gs.karaokeVotingOptions) || optionIndex < 0 || optionIndex >= gs.karaokeVotingOptions.length) return;
    if (!gs.karaokeVotes) gs.karaokeVotes = {};

    const existing = Array.isArray(gs.karaokeVotes[playerId]) ? gs.karaokeVotes[playerId].slice() : [];
    const idx = existing.indexOf(optionIndex);
    if (idx >= 0) {
      // Toggle off
      existing.splice(idx, 1);
    } else {
      // Add, capping to two selections
      if (existing.length >= 2) existing.shift();
      existing.push(optionIndex);
    }
    gs.karaokeVotes[playerId] = existing;

    io.to(roomCode).emit('game-state-update', { gameState: gs });
  });

  // --- Karaoke: client requests a timing sync ---
  socket.on('request-karaoke-sync', (roomCode: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase === 'karaoke_break' && gs.karaokeStartAt) {
      const durationMs = (gs.karaokeSettings?.durationSec || 45) * 1000;
      io.to(roomCode).emit('karaoke-sync', { startAt: gs.karaokeStartAt, duration: durationMs });
    } else if (gs.gamePhase === 'karaoke_voting' && gs.karaokeVotingEndAt) {
      const startAt = gs.karaokeVotingEndAt - 30000; // assume 30s window by default
      io.to(roomCode).emit('karaoke-sync', { startAt, duration: 30000 });
    }
  });

  // --- Karaoke: host ends the karaoke break and resumes game ---
  socket.on('karaoke-end', (roomCode: string, playerId: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    const caller = gs.players.find(p => p.id === playerId);
    if (!caller || !caller.isHost) return;

    // Clear karaoke-specific fields and resume
    gs.currentKaraokeSong = null;
    gs.karaokeStartAt = undefined;
    gs.karaokeVotingOptions = undefined;
    gs.karaokeVotingEndAt = undefined;
    gs.karaokeVotes = {};
    gs.gamePhase = 'category_selection';

    io.to(roomCode).emit('karaoke-ended');
    io.to(roomCode).emit('game-state-update', { gameState: gs });
  });

  socket.on('sabotage-player', (roomCode: string, playerId: string, targetName: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player || !player.hasSabotage) return;

    const target = room.gameState.players.find(p => p.name === targetName);
    if (!target) return;

    // Reset target's power bar to 0 and remove sabotage ability
    target.powerBar = 0;
    target.hasSabotage = false;

    // Reset saboteur's power bar to 50% and remove sabotage ability
    player.powerBar = 50;
    player.hasSabotage = false;

    console.log(`[server] ${player.name} sabotaged ${target.name}, resetting target's power bar to 0 and saboteur's power bar to 50%`);

    io.to(roomCode).emit('player-sabotaged', { 
      saboteurId: playerId, 
      saboteurName: player.name,
      targetId: target.id,
      targetName: target.name,
      gameState: room.gameState 
    });
  });
});

function nextTurn(room: Room, roomCode: string) {
  room.gameState.currentPlayerIndex = getNextPlayer(room.gameState);
  
  // If we're back to player 0, increment cycle within the round
  if (room.gameState.currentPlayerIndex === 0) {
    const cyclesPerRound = room.gameState.cyclesPerRound ?? 1;
    const prevCycle = room.gameState.cycleInRound ?? 0;
    const nextCycle = prevCycle + 1;
    room.gameState.cycleInRound = nextCycle;

    if (nextCycle >= cyclesPerRound) {
      // Completed the configured number of cycles for this round; advance round
      room.gameState.round++;
      room.gameState.cycleInRound = 0;
      // Configure cycles per round dynamically
      switch (room.gameState.round) {
        case 1:
          room.gameState.cyclesPerRound = 2; // default
          break;
        case 2:
          room.gameState.cyclesPerRound = 2; // Head-to-Head round: twice around
          break;
        case 3:
          room.gameState.cyclesPerRound = 2; // Spin round: twice around
          break;
        case 4:
          room.gameState.cyclesPerRound = 4; // Round 4: four times around the table
          break;
        case 5:
          room.gameState.cyclesPerRound = 1; // Not used in sudden death, but set to 1
          break;
        default:
          room.gameState.cyclesPerRound = room.gameState.cyclesPerRound || 2;
      }

      // Announce new round to clients
      io.to(roomCode).emit('round-start', {
        gameState: room.gameState,
        round: room.gameState.round,
        cyclesPerRound: room.gameState.cyclesPerRound,
      });

      // Enter sudden death mode at Round 5
      if (room.gameState.round === 5) {
        startSuddenDeath(room, roomCode);
        return;
      }
    }
  }

  // Check if max rounds reached
  const winner = checkWinCondition(room.gameState);
  if (winner) {
    room.gameState.winner = winner;
    room.gameState.gamePhase = 'finished';
    io.to(roomCode).emit('game-finished', { gameState: room.gameState });
    return;
  }

  // End game gracefully if exceeded max rounds
  if (room.gameState.round > room.gameState.maxRounds) {
    room.gameState.gamePhase = 'finished';
    io.to(roomCode).emit('game-finished', { gameState: room.gameState });
    return;
  }

  io.to(roomCode).emit('next-turn', { gameState: room.gameState });
}

// Build round-robin pairs so everyone plays everyone once
function buildRoundRobinPairs(playerIds: string[]): Array<[string, string]> {
  const ids = playerIds.slice();
  const n = ids.length;
  const pairs: Array<[string, string]> = [];
  if (n < 2) return pairs;
  // Simple round-robin: for i<j, pair (i,j)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push([ids[i], ids[j]]);
    }
  }
  // Shuffle pairs to randomize order
  for (let k = pairs.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    const tmp = pairs[k]; pairs[k] = pairs[r]; pairs[r] = tmp;
  }
  return pairs;
}

function startSuddenDeath(room: Room, roomCode: string) {
  const active = room.gameState.players.filter(p => !p.isEliminated).map(p => p.id);
  room.gameState.suddenDeathActive = true;
  room.gameState.suddenDeathPairs = buildRoundRobinPairs(active);
  room.gameState.suddenDeathCurrentPair = null;
  room.gameState.gamePhase = 'question';
  // Immediately start first duel
  advanceSuddenDeath(room, roomCode);
}

function advanceSuddenDeath(room: Room, roomCode: string) {
  if (!room.gameState.suddenDeathActive) return;
  // Remove eliminated players from pending pairs
  const alive = new Set(room.gameState.players.filter(p => !p.isEliminated).map(p => p.id));
  room.gameState.suddenDeathPairs = (room.gameState.suddenDeathPairs || []).filter(([a, b]) => alive.has(a) && alive.has(b));

  // Win condition: only one player remains
  const survivors = Array.from(alive.values());
  if (survivors.length <= 1) {
    const winner = room.gameState.players.find(p => p.id === survivors[0]) || null;
    if (winner) room.gameState.winner = winner;
    room.gameState.gamePhase = 'finished';
    room.gameState.suddenDeathActive = false;
    room.gameState.suddenDeathCurrentPair = null;
    io.to(roomCode).emit('game-finished', { gameState: room.gameState });
    return;
  }

  // If no pairs left, rebuild pairs with remaining players for another pass to ensure everyone meets everyone
  if (!room.gameState.suddenDeathPairs || room.gameState.suddenDeathPairs.length === 0) {
    room.gameState.suddenDeathPairs = buildRoundRobinPairs(survivors);
  }

  // Pop next pair
  const pair = room.gameState.suddenDeathPairs!.shift()!;
  room.gameState.suddenDeathCurrentPair = pair;

  // Draw and emit a question visible to both
  const q = getRandomQuestion(room.usedQuestionIds);
  room.usedQuestionIds.push(q.id);
  room.gameState.currentQuestion = q as any;
  room.gameState.gamePhase = 'question';
  // Reuse H2H flags for UI gating
  room.gameState.h2hActive = true;
  room.gameState.h2hChallengerId = pair[0];
  room.gameState.h2hOpponentId = pair[1];
  room.gameState.h2hStartAt = Date.now();
  room.gameState.h2hSubmissions = {};
  const deadline = (room.gameState.h2hStartAt || Date.now()) + 15000;
  io.to(roomCode).emit('h2h-started', { gameState: room.gameState, challengerId: pair[0], opponentId: pair[1], deadline });

  // Watchdog: after 15s, treat missing answers as wrong and advance
  setTimeout(() => {
    if (!room.gameState.suddenDeathActive) return;
    const currentPair = room.gameState.suddenDeathCurrentPair;
    if (!currentPair || (currentPair[0] !== pair[0] || currentPair[1] !== pair[1])) return; // already moved on
    const submissions = room.gameState.h2hSubmissions || {};
    const haveA = !!submissions[currentPair[0]];
    const haveB = !!submissions[currentPair[1]];
    if (haveA && haveB) return; // both submitted on time

    // Apply life changes: any missing submission counts as wrong
    [currentPair[0], currentPair[1]].forEach(pid => {
      const sub = submissions[pid];
      const correct = sub && sub.answerIndex === room.gameState.currentQuestion!.correctAnswer;
      const pIdx = room.gameState.players.findIndex(p => p.id === pid);
      if (pIdx !== -1) {
        const p = room.gameState.players[pIdx];
        if (!correct) {
          p.lives = Math.max(0, (p.lives || 3) - 1);
          if (p.lives <= 0) p.isEliminated = true;
        }
      }
    });

    room.gameState.currentQuestion = null;
    room.gameState.h2hSubmissions = {};
    room.gameState.h2hActive = false;
    room.gameState.h2hChallengerId = null;
    room.gameState.h2hOpponentId = null;
    room.gameState.h2hStartAt = null;
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: 'Sudden death timeout' });
    setTimeout(() => advanceSuddenDeath(room, roomCode), 500);
  }, Math.max(0, deadline - Date.now() + 50));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});