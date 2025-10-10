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
const lightningTimeouts = new Map(); // roomCode -> NodeJS.Timeout
const charadeTimeouts = new Map(); // roomCode -> NodeJS.Timeout
const pictionaryTimeouts = new Map(); // roomCode -> NodeJS.Timeout
// Charade duration hardcoded to 30 seconds
const CHARADE_DURATION_MS = 30000;
// Pictionary duration hardcoded to 60 seconds (longer for drawing)
const PICTIONARY_DURATION_MS = 60000;

// Game state management
const rooms = new Map();

// ---- Randomization Utilities & Pools ----
function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initRoomRandomPools(room) {
  // Global shuffled list of all question IDs
  room._allQuestionIds = shuffleArray(allQuestions.map(q => q.id));
  room._allIndex = 0;
  // Per-category pools
  room._categoryPools = {};
  room._categoryIndices = {};
  room._recentlyUsed = {}; // Track recently used questions per category
  room._usedByCategory = {}; // Track used questions per category for the entire game
  for (const q of allQuestions) {
    const key = q.category.toLowerCase();
    if (!room._categoryPools[key]) room._categoryPools[key] = [];
    room._categoryPools[key].push(q.id);
    if (!room._recentlyUsed[key]) room._recentlyUsed[key] = [];
    if (!room._usedByCategory[key]) room._usedByCategory[key] = new Set();
  }
  for (const key of Object.keys(room._categoryPools)) {
    room._categoryPools[key] = shuffleArray(room._categoryPools[key]);
    room._categoryIndices[key] = 0;
  }
  // Forfeits (lazy init)
  room._forfeitPool = [];
  room._forfeitIndex = 0;
}

function drawQuestionFromPools(room, category) {
  const key = category.toLowerCase();
  if (room._categoryPools && room._categoryPools[key]) {
    // Ensure used set exists
    if (!room._usedByCategory) room._usedByCategory = {};
    if (!room._usedByCategory[key]) room._usedByCategory[key] = new Set();
    const usedSet = room._usedByCategory[key];

    // Enhanced adaptive difficulty weighting with streaks and mastery
    const gs = room.gameState;
    const currentPlayer = gs?.players?.[gs.currentPlayerIndex];
    let targetDifficulty = null;
    let difficultyBonus = 0;
    
    if (currentPlayer) {
      // Base accuracy calculation
      const total = currentPlayer.totalAnswers || 0;
      const correct = currentPlayer.correctAnswers || 0;
      const overallAccuracy = total > 0 ? correct / total : 0.5;
      
      // Streak bonus: players on hot streaks get harder questions
      const currentStreak = currentPlayer.currentStreak || 0;
      if (currentStreak >= 3) difficultyBonus += 1; // 3+ streak = harder questions
      if (currentStreak >= 5) difficultyBonus += 1; // 5+ streak = even harder
      
      // Category mastery bonus: experts in this category get harder questions
      const categoryMastery = currentPlayer.categoryMastery?.[category] || 'novice';
      const masteryBonus = categoryMastery === 'expert' ? 2 : categoryMastery === 'intermediate' ? 1 : 0;
      difficultyBonus += masteryBonus;
      
      // Calculate target difficulty with bonuses
      let baseDifficulty;
      if (overallAccuracy < 0.4) baseDifficulty = 0; // easy
      else if (overallAccuracy < 0.65) baseDifficulty = 1; // medium  
      else baseDifficulty = 2; // hard
      
      const finalDifficulty = Math.min(2, Math.max(0, baseDifficulty + difficultyBonus));
      targetDifficulty = ['easy', 'medium', 'hard'][finalDifficulty];
      
      console.log(`[drawQuestion] Player ${currentPlayer.name}: accuracy=${(overallAccuracy*100).toFixed(1)}%, streak=${currentStreak}, mastery=${categoryMastery}, target=${targetDifficulty}`);
    }
    // If we've used almost all questions in this category, reset used set and reshuffle to avoid repeats across games
    const poolSize = room._categoryPools[key].length;
    if (usedSet.size >= poolSize - 1) {
      room._categoryPools[key] = shuffleArray(room._categoryPools[key]);
      room._categoryIndices[key] = 0;
      usedSet.clear();
    }

    // Gather candidate IDs scanning the pool, skipping used questions
    const maxScan = Math.min(poolSize, 32); // scan up to 32 positions for diversity
    const desiredCandidates = 8;
    let collected = [];
    let localIdx = room._categoryIndices[key] % poolSize;
    const recentlyUsed = room._recentlyUsed[key] || [];
    for (let i = 0; i < maxScan && collected.length < desiredCandidates; i++) {
      const idx = (localIdx + i) % poolSize;
      const questionId = room._categoryPools[key][idx];
      if (!usedSet.has(questionId) && !recentlyUsed.includes(questionId)) {
        collected.push(questionId);
      }
    }
    // Fallback: if nothing collected due to filtering, allow any not-used; if still empty, allow any
    if (collected.length === 0) {
      for (let i = 0; i < poolSize && collected.length < desiredCandidates; i++) {
        const qid = room._categoryPools[key][i];
        if (!usedSet.has(qid)) collected.push(qid);
      }
      if (collected.length === 0) {
        collected = [room._categoryPools[key][room._categoryIndices[key] % poolSize]];
      }
    }
    // Choose best match by difficulty
    let chosenId = collected[0];
    if (targetDifficulty) {
      const byDiff = collected
        .map(id => allQuestions.find(q => q.id === id))
        .filter(Boolean);
      const exact = byDiff.find(q => q.difficulty === targetDifficulty);
      if (exact) {
        chosenId = exact.id;
      } else {
        // fallback priority order near target
        const priority = targetDifficulty === 'easy' ? ['easy','medium','hard'] : targetDifficulty === 'medium' ? ['medium','easy','hard'] : ['hard','medium','easy'];
        for (const diff of priority) {
          const alt = byDiff.find(q => q.difficulty === diff);
          if (alt) {
            chosenId = alt.id;
            break;
          }
        }
      }
    }
    // Mark as used for this game and advance index modestly
    usedSet.add(chosenId);
    const advanceAmount = poolSize < 50 ? 2 : 1;
    room._categoryIndices[key] = (room._categoryIndices[key] + advanceAmount) % poolSize;
    // Update recently used (keep last 5 per category)
    recentlyUsed.push(chosenId);
    if (recentlyUsed.length > 5) recentlyUsed.shift();
    return allQuestions.find(q => q.id === chosenId);
  }
  // fallback global
    if (room._allIndex >= room._allQuestionIds.length) {
      room._allQuestionIds = shuffleArray(room._allQuestionIds);
      room._allIndex = 0;
    }
    const globalId = room._allQuestionIds[room._allIndex++];
    return allQuestions.find(q => q.id === globalId);
}

function ensureForfeitPool(room) {
  if (room._forfeitPool.length === 0 || room._forfeitIndex >= room._forfeitPool.length) {
    try {
      const fm = require('./server_data/forfeits.cjs');
      if (fm.getAllForfeits) {
        const allF = fm.getAllForfeits();
        // Randomize order each cycle
        room._forfeitPool = shuffleArray(allF);
        room._forfeitIndex = 0;
      } else {
        // fallback single random provider
        room._forfeitPool = [];
        room._forfeitIndex = 0;
      }
    } catch (e) {
      room._forfeitPool = [];
      room._forfeitIndex = 0;
    }
  }
}

function drawForfeitFromPool(room, currentPlayer) {
  try {
    const fm = require('./server_data/forfeits.cjs');
    if (fm.getAllForfeits) {
      ensureForfeitPool(room);
      const f = room._forfeitPool[room._forfeitIndex++];
      return { ...f };
    }
    return fm.getRandomForfeit(currentPlayer);
  } catch (e) {
    return { type: 'shot', description: 'Take a shot!', wordToAct: null };
  }
}

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
  // score removed (no longer used), rely on per-category progress only
    lives: 3,
    isHost,
    isEliminated: false,
    categoryScores,
    charadeCount: 0,
  needsCharadeForLife: false, // Track if player got question wrong and needs to lose life on charade failure
  correctAnswers: 0,
  totalAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  difficultyAccuracy: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
  categoryAccuracy: {},
  categoryMastery: {},
  // Give each player an initial set of power-ups. Steal starts at 1 so feature can be exercised.
  powerUps: { swap_question: 1, steal_category: 1 },
  lifelines: { fiftyFifty: 2, passToRandom: 2 }
  };
};

// Ensure all players have lifelines (for backward compatibility)
const ensurePlayerHasLifelines = (player) => {
  if (!player.lifelines) {
    player.lifelines = { fiftyFifty: 2, passToRandom: 2 };
  }
  if (!player.powerUps) {
    player.powerUps = { swap_question: 1, steal_category: 1 };
  }
  return player;
};

const playerColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const playerAvatars = ['🦊', '🐻', '🐱', '🐸', '🦁', '🐼'];
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

// Questions pool (server-side) - Using expanded question set with additional categories

// Centralized next-turn scheduler to avoid race conditions and enforce a delay
const nextTurnTimers = new Map(); // roomCode -> timeout handle

function scheduleNextTurn(room, roomCode, reason = 'default', delayMs = 3000) {
  try {
    const existing = nextTurnTimers.get(roomCode);
    if (existing) clearTimeout(existing);
  } catch {}
  console.log(`[scheduleNextTurn] room=${roomCode} in ${delayMs}ms reason=${reason}`);
  // Mark a short cooldown so clients hide categories during the delay
  try {
    room.gameState.turnCooldownUntil = Date.now() + delayMs;
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: `Turn cooldown (${reason})` });
  } catch (e) {
    console.warn('[scheduleNextTurn] Failed to set cooldown flag', e);
  }
  const handle = setTimeout(() => {
    nextTurnTimers.delete(roomCode);
    try {
      nextTurn(room, roomCode);
      // Ensure clients have the latest state after advancing turn
      // Clear cooldown flag now that the turn has advanced
      if (room.gameState.turnCooldownUntil) delete room.gameState.turnCooldownUntil;
      io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: `Turn advanced (${reason})` });
    } catch (e) {
      console.error('[scheduleNextTurn] Error advancing turn', e);
    }
  }, delayMs);
  nextTurnTimers.set(roomCode, handle);
}

// ---------------- Fuzzy matching helpers for charade/pictionary guesses ----------------
function stripDiacritics(str) {
  try { return str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch { return str; }
}

function normalizeForComparison(input) {
  const s = stripDiacritics(String(input || '').toLowerCase());
  // Remove punctuation, keep alphanumerics and spaces, collapse spaces
  return s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,        // deletion
        dp[j - 1] + 1,    // insertion
        prev + cost       // substitution
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function isCloseMatch(guess, answer) {
  if (!guess || !answer) return false;
  if (guess === answer) return true;
  // Allow minor typos based on length
  const len = Math.max(guess.length, answer.length);
  const dist = levenshtein(guess, answer);
  if (len <= 4) return dist === 0;         // very short words must match exactly
  if (len <= 6) return dist <= 1;          // allow 1 typo
  if (len <= 10) return dist <= 2;         // allow 2 typos
  // For longer phrases, allow up to 20% of length as edits (cap at 4)
  const allowed = Math.min(4, Math.ceil(len * 0.2));
  return dist <= allowed;
}
const { allQuestions } = require('./server_data/expanded_questions.cjs');
// Log question inventory on startup
try {
  const totalQuestions = Array.isArray(allQuestions) ? allQuestions.length : 0;
  const byCategory = {};
  for (const q of allQuestions || []) {
    const cat = q.category || 'Unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  const categoryCount = Object.keys(byCategory).length;
  console.log(`[questions] Loaded ${totalQuestions} questions across ${categoryCount} categories`);
  // Print a compact per-category summary (sorted by name)
  const summary = Object.entries(byCategory)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([k,v]) => `${k}:${v}`)
    .join(', ');
  console.log(`[questions] Per-category counts: ${summary}`);
} catch (e) {
  console.log('[questions] Failed to compute question inventory', e);
}

// Select a random question avoiding repeats until pool is exhausted
const getRandomQuestion = (usedQuestionIds = []) => {
  const available = allQuestions.filter(q => !usedQuestionIds.includes(q.id));
  if (available.length === 0) {
    // reset used list to allow reuse if completely exhausted
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
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
      room.gameState.players.forEach(player => ensurePlayerHasLifelines(player));
      
      callback?.({ success: true, gameState: room.gameState, playerId });
      // Also emit a one-off state-sync event to this socket (optional)
      io.to(socket.id).emit('state-sync', { gameState: room.gameState });
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
      ensurePlayerHasLifelines(assignedHost);
      
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
            globalRecentCategories: [], // Global recent categories for all players
            currentKaraokeSong: null,
            karaokeBreakCount: 0,
            karaokeSettings: {
              probability: 0.4,
              durationSec: 45,
              cooldownSec: 180,
              lastTriggeredAt: 0
            }
      };

      const room = {
        id: roomCode,
        gameState,
        usedQuestionIds: [],
        _allQuestionIds: [],
        _allIndex: 0,
        _categoryPools: {},
        _categoryIndices: {},
        _forfeitPool: [],
        _forfeitIndex: 0
      };
      initRoomRandomPools(room);

      rooms.set(roomCode, room);
      socket.join(roomCode);
      
      console.log('Room created successfully:', roomCode);
      console.log('Callback function exists:', typeof callback === 'function');
      if (typeof callback === 'function') {
        console.log('Calling callback with success response');
        // Ensure all players have lifelines and powerUps before sending
        gameState.players.forEach(player => ensurePlayerHasLifelines(player));
        
        callback({ success: true, roomCode, gameState });
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
    ensurePlayerHasLifelines(assignedPlayer);
    
    room.gameState.players.push(assignedPlayer);
    socket.join(roomCode);
    
    room.gameState.players.forEach(player => ensurePlayerHasLifelines(player));
    
    io.to(roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });
    // Ensure all players have lifelines and powerUps before sending
    room.gameState.players.forEach(player => ensurePlayerHasLifelines(player));
    
    callback({ success: true, gameState: room.gameState, playerId: assignedPlayer.id });
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
    // Initialize ready flags
    room.gameState.players.forEach(p => { p.isReady = false; });
    room.gameState.gamePhase = 'ready_check';
    room.gameState.allReady = false;
    console.log('Entering ready_check phase before starting categories');
    io.to(roomCode).emit('game-started', { gameState: room.gameState, message: 'Ready check started' });
  // Notify clients to begin lobby track (fresh start at 0)
  io.to(roomCode).emit('lobby-music-start', { startAt: Date.now() });
  });

  // ---- Karaoke Settings & Manual Control ----
  socket.on('karaoke-settings-update', (roomCode, playerId, settings) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const host = room.gameState.players.find(p => p.id === playerId && p.isHost);
    if (!host) return; // only host
    const gs = room.gameState;
    if (!gs.karaokeSettings) gs.karaokeSettings = { probability: 0.4, durationSec: 45, cooldownSec: 180, lastTriggeredAt: 0 };
    if (typeof settings.probability === 'number') gs.karaokeSettings.probability = Math.min(1, Math.max(0, settings.probability));
    if (typeof settings.durationSec === 'number') gs.karaokeSettings.durationSec = Math.max(15, Math.min(180, settings.durationSec));
    if (typeof settings.cooldownSec === 'number') gs.karaokeSettings.cooldownSec = Math.max(30, Math.min(900, settings.cooldownSec));
  // Broadcast specialized event for components directly listening
  io.to(roomCode).emit('karaoke-settings-updated', { karaokeSettings: gs.karaokeSettings, gameState: gs });
  // ALSO broadcast a generic game-state-update so global state in clients updates (fixes Save button seeming ineffective)
  io.to(roomCode).emit('game-state-update', { gameState: gs, message: 'Karaoke settings updated' });
  console.log(`[karaoke] Settings updated room=${roomCode} prob=${gs.karaokeSettings.probability} dur=${gs.karaokeSettings.durationSec}s cooldown=${gs.karaokeSettings.cooldownSec}s`);
  });

  socket.on('karaoke-start-manual', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const host = room.gameState.players.find(p => p.id === playerId && p.isHost);
    if (!host) return;
    // Only allow manual start if not already in karaoke and not on finished
    if (room.gameState.gamePhase === 'karaoke_break' || room.gameState.gamePhase === 'karaoke_voting') return;
    triggerKaraoke(room, roomCode, true, false); // manual=true, skipVoting=false
  });

  socket.on('karaoke-vote', (roomCode, playerId, songIndex) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'karaoke_voting') return;
    const player = gs.players.find(p => p.id === playerId);
    if (!player) return;
    if (songIndex < 0 || songIndex >= (gs.karaokeVotingOptions?.length || 0)) return;
    // Allow up to two distinct votes per player
    if (!Array.isArray(gs.karaokeVotes[playerId])) gs.karaokeVotes[playerId] = [];
    const arr = gs.karaokeVotes[playerId];
    if (!arr.includes(songIndex)) {
      if (arr.length < 2) {
        arr.push(songIndex);
      } else {
        // If already has two, replace the oldest to honor latest intent
        arr.shift();
        arr.push(songIndex);
      }
    }
  });

  // Host emits periodic karaoke-sync while in karaoke_break
  socket.on('request-karaoke-sync', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    const host = gs.players.find(p => p.id === playerId && p.isHost);
    if (!host) return;
    if (gs.gamePhase === 'karaoke_break' && gs.karaokeStartAt) {
      io.to(roomCode).emit('karaoke-sync', { startAt: gs.karaokeStartAt, duration: gs.karaokeSettings?.durationSec || 45 });
    }
  });

  socket.on('karaoke-end', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const host = room.gameState.players.find(p => p.id === playerId && p.isHost);
    if (!host) return;
    if (room.gameState.gamePhase !== 'karaoke_break') return;
    room.gameState.currentKaraokeSong = null;
    room.gameState.gamePhase = 'category_selection';
    const endedAt = Date.now();
    io.to(roomCode).emit('karaoke-ended', { endedAt });
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: 'Karaoke ended (manual)' });
  // Advance using centralized scheduler
  scheduleNextTurn(room, roomCode, 'karaoke manual end', 3000);
  });

  // Host: manually start a lightning round
  socket.on('start-lightning', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    // Validate host
    const host = gs.players.find(p => p.id === playerId && p.isHost);
    if (!host) return;
    // Avoid starting during incompatible phases or if already active
    if (gs.gamePhase === 'lightning_round' || gs.lightningActive) return;
    if (gs.gamePhase === 'karaoke_break' || gs.gamePhase === 'karaoke_voting') return;
    try {
      triggerLightning(room, roomCode);
    } catch (e) {
      console.error('[start-lightning] Failed to start lightning:', e);
    }
  });

  // Player presses Ready
  socket.on('player-ready', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.gameState.gamePhase !== 'ready_check') return;
    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player) return;
    if (player.isReady) return; // already ready
    player.isReady = true;
    const allReady = room.gameState.players.every(p => p.isReady);
    room.gameState.allReady = allReady;
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: `Player ${player.name} is ready` });
    if (allReady) {
      // Small delay for dramatic effect then start game proper
      setTimeout(() => {
        room.gameState.gamePhase = 'category_selection';
  io.to(roomCode).emit('lobby-music-stop');
    // Ensure all players have lifelines and powerUps before sending
    room.gameState.players.forEach(player => ensurePlayerHasLifelines(player));
    
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: 'All players ready. Game starting!' });
      }, 1200);
    }
  });

  // Host override to force start even if not all ready
  socket.on('host-force-start', (roomCode, hostPlayerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.gameState.gamePhase !== 'ready_check') return;
    const host = room.gameState.players.find(p => p.id === hostPlayerId && p.isHost);
    if (!host) return;
    console.log(`[host-force-start] Host ${host.name} is forcing game start in room ${roomCode}`);
    room.gameState.gamePhase = 'category_selection';
    room.gameState.allReady = false; // indicate override
  io.to(roomCode).emit('lobby-music-stop');
    io.to(roomCode).emit('game-state-update', { gameState: room.gameState, message: 'Host forced game start' });
  });

  // Host emits periodic music time sync
  socket.on('lobby-music-time', (roomCode, currentTimeSec) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    // Only allow host to broadcast sync
    const host = room.gameState.players.find(p => p.isHost);
    if (!host) return;
    const hostSocketIds = [...io.sockets.sockets.keys()];
    // Broadcast to everyone else
    socket.to(roomCode).emit('lobby-music-sync', { t: currentTimeSec, ts: Date.now() });
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

  // Draw question from shuffled pools (no immediate repeats until cycle completed)
  const question = drawQuestionFromPools(room, category);
    
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
        
        // Determine the player dynamically at execution time
        const currentPlayerAtTimeout = gameState.players[gameState.currentPlayerIndex];
        
        // Mark that player needs to do charade (but don't deduct life yet)
        currentPlayerAtTimeout.needsCharadeForLife = true;
        console.log(`[question-timeout] Player ${currentPlayerAtTimeout.name} timed out - will do charade`);
        
        gameState.gamePhase = 'forfeit';
        
        // Create the forfeit for the dynamically determined player
        gameState.currentForfeit = drawForfeitFromPool(room, currentPlayerAtTimeout);
        
        // Auto-start forfeit based on type
        if (gameState.currentForfeit.type === 'shot') {
          // For shot forfeits, complete immediately
          console.log(`[auto-forfeit-timeout] Auto-completing shot forfeit for ${currentPlayerAtTimeout.name}`);
          currentPlayerAtTimeout.needsCharadeForLife = false;
          gameState.gamePhase = 'category_selection';
          gameState.currentForfeit = null;
          io.to(roomCode).emit('forfeit-completed', { gameState: gameState, forfeitType: 'shot' });
          // Attempt karaoke break
          try {
            maybeTriggerKaraoke(room, roomCode);
          } catch (err) {
            console.error('[karaoke] maybeTriggerKaraoke error after auto shot forfeit timeout', err);
          }
          if (gameState.gamePhase === 'karaoke_break') {
            console.log('[karaoke] Karaoke break triggered after auto shot forfeit timeout; skipping scheduled nextTurn');
          } else {
            scheduleNextTurn(room, roomCode, 'after auto shot forfeit timeout', 3000);
          }
        } else if (gameState.currentForfeit.type === 'charade' || gameState.currentForfeit.type === 'pictionary') {
          // Auto-start charade or pictionary forfeit
          console.log(`[auto-forfeit-timeout] Auto-starting ${gameState.currentForfeit.type} forfeit for ${currentPlayerAtTimeout.name}`);
          // Simulate the start-charade event for the current player
          setTimeout(() => {
            // This will trigger the existing start-charade handler logic
            const startCharadeHandler = (roomCode, playerId) => {
              const room = rooms.get(roomCode);
              if (!room) return;
              const gameState = room.gameState;
              if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;

              const currentPlayer = gameState.players[gameState.currentPlayerIndex];
              if (currentPlayer.id !== playerId) return;
              
              console.log(`[auto-start-charade-timeout] Starting forfeit type: ${gameState.currentForfeit.type} for player ${currentPlayer.name}`);
              
              // Handle different forfeit types
              if (gameState.currentForfeit.type === 'shot') {
                // This shouldn't happen in auto-start, but handle it just in case
                console.log(`[forfeit-timeout] Shot forfeit for ${currentPlayer.name}`);
                currentPlayer.needsCharadeForLife = false;
                gameState.gamePhase = 'category_selection';
                gameState.currentForfeit = null;
                io.to(roomCode).emit('forfeit-completed', { gameState, forfeitType: 'shot' });
                try {
                  maybeTriggerKaraoke(room, roomCode);
                } catch (err) {
                  console.error('[karaoke] maybeTriggerKaraoke error after shot forfeit timeout', err);
                }
                if (gameState.gamePhase === 'karaoke_break') {
                  console.log('[karaoke] Karaoke break triggered after shot forfeit timeout; skipping scheduled nextTurn');
                  return;
                }
                scheduleNextTurn(room, roomCode, 'after shot forfeit timeout', 3000);
                return;
              }
              
              // For charade or pictionary forfeits
              if (!currentPlayer.charadeCount) currentPlayer.charadeCount = 0;
              currentPlayer.charadeCount++;
              
              console.log(`[${gameState.currentForfeit.type}] ${currentPlayer.name} has now done ${currentPlayer.charadeCount} forfeits`);

              if (gameState.currentForfeit.type === 'charade') {
                gameState.gamePhase = 'charade_guessing';
                gameState.charadeSolution = gameState.currentForfeit.wordToAct;
                gameState.charadeSolved = false;
                const startedAt = Date.now();
                const endsAt = startedAt + CHARADE_DURATION_MS;
                console.log(`[charade] auto-start-timeout: room=${roomCode} player=${currentPlayer.id} durationMs=${CHARADE_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
                io.to(roomCode).emit('charade-started', { gameState, deadline: endsAt });
                console.log(`[charade] emitted charade-started to room ${roomCode}`);

                const prev = charadeTimeouts.get(roomCode);
                if (prev) clearTimeout(prev);
                const handle = setTimeout(() => {
                  const currentRoom = rooms.get(roomCode);
                  if (!currentRoom) return;
                  if (!currentRoom.gameState.charadeSolved) {
                    handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'charade');
                  }
                }, CHARADE_DURATION_MS);
                charadeTimeouts.set(roomCode, handle);
              } else if (gameState.currentForfeit.type === 'pictionary') {
                gameState.gamePhase = 'pictionary_drawing';
                gameState.pictionarySolution = gameState.currentForfeit.wordToAct;
                gameState.pictionarySolved = false;
                gameState.drawingData = null;
                const startedAt = Date.now();
                const endsAt = startedAt + PICTIONARY_DURATION_MS;
                console.log(`[pictionary] auto-start-timeout: room=${roomCode} player=${currentPlayer.id} durationMs=${PICTIONARY_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
                io.to(roomCode).emit('pictionary-started', { gameState, deadline: endsAt });

                const prev = pictionaryTimeouts.get(roomCode);
                if (prev) clearTimeout(prev);
                const handle = setTimeout(() => {
                  const currentRoom = rooms.get(roomCode);
                  if (!currentRoom) return;
                  if (!currentRoom.gameState.pictionarySolved) {
                    handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'pictionary');
                  }
                }, PICTIONARY_DURATION_MS);
                pictionaryTimeouts.set(roomCode, handle);
              }
            };
            startCharadeHandler(roomCode, currentPlayerAtTimeout.id);
          }, 1000); // Small delay to allow UI to update
        }
        
        // Emit answer-submitted with the correct playerId
        io.to(roomCode).emit('answer-submitted', {
          playerId: currentPlayerAtTimeout.id,
          isCorrect: false,
          correctAnswer,
          gameState
        });
      }
    }, timeoutMs);
    
    questionTimeouts.set(roomCode, handle);
  });

  socket.on('submit-answer', (roomCode, playerId, answerIndex) => {
    console.log(`[submit-answer] Received answer submission: room=${roomCode}, player=${playerId}, answer=${answerIndex}`);
    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`[submit-answer] Room ${roomCode} not found`);
      return;
    }
    if (!room.gameState.currentQuestion) {
      console.log(`[submit-answer] No current question in room ${roomCode}`);
      return;
    }
    if (room.gameState.gamePhase === 'karaoke_voting' || room.gameState.gamePhase === 'karaoke_break') {
      console.log(`[submit-answer] Ignoring answer during karaoke phase: ${room.gameState.gamePhase}`);
      return;
    }

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      console.log(`[submit-answer] Player ID mismatch: expected ${currentPlayer.id}, got ${playerId}`);
      return;
    }

    console.log(`[submit-answer] Processing answer ${answerIndex} from player ${playerId} (${currentPlayer.name})`);
    let isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
    const questionDifficulty = room.gameState.currentQuestion.difficulty || 'easy';

    // Update power bar: +10% for correct, -10% for incorrect (minimum 0%)
    console.log(`[submit-answer] Answer ${answerIndex} is ${isCorrect ? 'correct' : 'incorrect'} (correct: ${room.gameState.currentQuestion.correctAnswer})`);
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
      
      // Also grant sabotage if player already has 100% but doesn't have sabotage ability (for existing games)
      if (newPowerBar >= 100 && !room.gameState.players[playerIndex].hasSabotage) {
        room.gameState.players[playerIndex].hasSabotage = true;
        console.log(`[server] Sabotage granted to existing 100% player ${room.gameState.players[playerIndex].name} (${playerId})`);
        io.to(roomCode).emit('sabotage-granted', { playerId, playerName: room.gameState.players[playerIndex].name, gameState: room.gameState });
      }
    }

    // Reset per-question consumption flag on resolution
    if (currentPlayer._doubleChanceConsumed) delete currentPlayer._doubleChanceConsumed;
  // Points/score removed; only category progress matters
    const currentQ = room.gameState.currentQuestion;
    const correctAnswer = currentQ.correctAnswer;
    
    // Update adaptive stats
    currentPlayer.totalAnswers = (currentPlayer.totalAnswers || 0) + 1;
    if (!currentPlayer.difficultyAccuracy) currentPlayer.difficultyAccuracy = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    currentPlayer.difficultyAccuracy[questionDifficulty].total += 1;
    if (!currentPlayer.categoryAccuracy) currentPlayer.categoryAccuracy = {};
    const qCat = room.gameState.currentQuestion.category;
    if (!currentPlayer.categoryAccuracy[qCat]) currentPlayer.categoryAccuracy[qCat] = { correct: 0, total: 0 };
    currentPlayer.categoryAccuracy[qCat].total += 1;
    
    // Update streak tracking
    if (!currentPlayer.currentStreak) currentPlayer.currentStreak = 0;
    if (!currentPlayer.bestStreak) currentPlayer.bestStreak = 0;
    
    if (isCorrect) {
      currentPlayer.correctAnswers = (currentPlayer.correctAnswers || 0) + 1;
      currentPlayer.difficultyAccuracy[questionDifficulty].correct += 1;
      currentPlayer.categoryAccuracy[qCat].correct += 1;
      
      // Update streak
      currentPlayer.currentStreak += 1;
      if (currentPlayer.currentStreak > currentPlayer.bestStreak) {
        currentPlayer.bestStreak = currentPlayer.currentStreak;
      }
      
      // Streak bonuses: reward players for hot streaks
      if (currentPlayer.currentStreak === 3) {
        // 3 in a row: gain a lifeline
        if (!currentPlayer.lifelines) currentPlayer.lifelines = { fiftyFifty: 0, passToRandom: 0 };
        currentPlayer.lifelines.fiftyFifty += 1;
        console.log(`[streak-bonus] ${currentPlayer.name} reached 3-streak! Gained 50/50 lifeline`);
      } else if (currentPlayer.currentStreak === 5) {
        // 5 in a row: gain a power-up
        if (!currentPlayer.powerUps) currentPlayer.powerUps = { swap_question: 0, steal_category: 0 };
        currentPlayer.powerUps.swap_question += 1;
        console.log(`[streak-bonus] ${currentPlayer.name} reached 5-streak! Gained swap question power-up`);
      } else if (currentPlayer.currentStreak >= 7 && currentPlayer.currentStreak % 2 === 1) {
        // Every 2 streaks after 7: gain random bonus
        const bonuses = ['fiftyFifty', 'passToRandom', 'swap_question'];
        const randomBonus = bonuses[Math.floor(Math.random() * bonuses.length)];
        if (randomBonus === 'fiftyFifty' || randomBonus === 'passToRandom') {
          if (!currentPlayer.lifelines) currentPlayer.lifelines = { fiftyFifty: 0, passToRandom: 0 };
          currentPlayer.lifelines[randomBonus] += 1;
        } else {
          if (!currentPlayer.powerUps) currentPlayer.powerUps = { swap_question: 0, steal_category: 0 };
          currentPlayer.powerUps[randomBonus] += 1;
        }
        console.log(`[streak-bonus] ${currentPlayer.name} reached ${currentPlayer.currentStreak}-streak! Gained random bonus: ${randomBonus}`);
      }
    } else {
      // Reset streak on wrong answer
      currentPlayer.currentStreak = 0;
    }
    
    // Update category mastery
    if (!currentPlayer.categoryMastery) currentPlayer.categoryMastery = {};
    const catStats = currentPlayer.categoryAccuracy[qCat];
    if (catStats && catStats.total >= 5) { // Need at least 5 questions in category
      const accuracy = catStats.correct / catStats.total;
      if (accuracy >= 0.8) {
        currentPlayer.categoryMastery[qCat] = 'expert';
      } else if (accuracy >= 0.6) {
        currentPlayer.categoryMastery[qCat] = 'intermediate';
      } else {
        currentPlayer.categoryMastery[qCat] = 'novice';
      }
    }

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
  room.gameState.currentForfeit = drawForfeitFromPool(room, currentPlayer);
      console.log(`[submit-answer] Set gamePhase to 'forfeit' for incorrect answer by ${currentPlayer.name}`);
      
      // Auto-start forfeit based on type
      if (room.gameState.currentForfeit.type === 'shot') {
        // For shot forfeits, complete immediately
        console.log(`[auto-forfeit] Auto-completing shot forfeit for ${currentPlayer.name}`);
        currentPlayer.needsCharadeForLife = false;
        room.gameState.gamePhase = 'category_selection';
        room.gameState.currentForfeit = null;
        io.to(roomCode).emit('forfeit-completed', { gameState: room.gameState, forfeitType: 'shot' });
        // Attempt karaoke break
        try {
          maybeTriggerKaraoke(room, roomCode);
        } catch (err) {
          console.error('[karaoke] maybeTriggerKaraoke error after auto shot forfeit', err);
        }
        if (room.gameState.gamePhase === 'karaoke_break') {
          console.log('[karaoke] Karaoke break triggered after auto shot forfeit; skipping scheduled nextTurn');
        } else {
          scheduleNextTurn(room, roomCode, 'after auto shot forfeit', 3000);
        }
      } else if (room.gameState.currentForfeit.type === 'tongue_twister') {
        // Auto-start tongue twister forfeit
        console.log(`[auto-forfeit] Auto-starting tongue twister forfeit for ${currentPlayer.name}: "${room.gameState.currentForfeit.tongueTwister}"`);
        // Start 20-second timer for tongue twister
        const endsAt = Date.now() + 20000; // 20 seconds from now
        room.gameState.tongueTwisterDeadline = endsAt;
        setTimeout(() => {
          const currentRoom = rooms.get(roomCode);
          if (!currentRoom || currentRoom.gameState.gamePhase !== 'forfeit') return;
          
          console.log(`[tongue-twister] Auto-completed tongue twister for ${currentPlayer.name}`);
          
          // Reset the charade life flag since tongue twister forfeits don't involve charades
          // Note: No lives are lost or gained during tongue twister forfeits
          currentPlayer.needsCharadeForLife = false;
          
          currentRoom.gameState.gamePhase = 'category_selection';
          currentRoom.gameState.currentForfeit = null;
          currentRoom.gameState.tongueTwisterDeadline = null;
          
          // Notify clients about the completed forfeit
          io.to(roomCode).emit('forfeit-completed', { gameState: currentRoom.gameState, forfeitType: 'tongue_twister' });
          
          // Attempt an automatic karaoke break
          try {
            maybeTriggerKaraoke(currentRoom, roomCode);
          } catch (err) {
            console.error('[karaoke] maybeTriggerKaraoke error after tongue twister', err);
          }
          if (currentRoom.gameState.gamePhase === 'karaoke_break') {
            console.log('[karaoke] Karaoke break triggered after tongue twister; skipping scheduled nextTurn');
          } else {
            scheduleNextTurn(currentRoom, roomCode, 'after auto tongue twister', 3000);
          }
        }, 20000); // 20 seconds for tongue twister
      } else if (room.gameState.currentForfeit.type === 'charade' || room.gameState.currentForfeit.type === 'pictionary') {
        // Auto-start charade or pictionary forfeit
        console.log(`[auto-forfeit] Auto-starting ${room.gameState.currentForfeit.type} forfeit for ${currentPlayer.name}`);
        // Simulate the start-charade event for the current player
        setTimeout(() => {
          // This will trigger the existing start-charade handler logic
          const fakeSocket = { id: currentPlayer.id };
          const fakeStartCharadeEvent = [roomCode, currentPlayer.id];
          // Call the start-charade handler directly
          const startCharadeHandler = (roomCode, playerId) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            const gameState = room.gameState;
            if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;

            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            if (currentPlayer.id !== playerId) return;
            
            console.log(`[auto-start-charade] Starting forfeit type: ${gameState.currentForfeit.type} for player ${currentPlayer.name}`);
            
            // Handle different forfeit types
            if (gameState.currentForfeit.type === 'shot') {
              // This shouldn't happen in auto-start, but handle it just in case
              console.log(`[forfeit] Shot forfeit for ${currentPlayer.name}`);
              currentPlayer.needsCharadeForLife = false;
              gameState.gamePhase = 'category_selection';
              gameState.currentForfeit = null;
              io.to(roomCode).emit('forfeit-completed', { gameState, forfeitType: 'shot' });
              try {
                maybeTriggerKaraoke(room, roomCode);
              } catch (err) {
                console.error('[karaoke] maybeTriggerKaraoke error after shot forfeit', err);
              }
              if (gameState.gamePhase === 'karaoke_break') {
                console.log('[karaoke] Karaoke break triggered after shot forfeit; skipping scheduled nextTurn');
                return;
              }
              scheduleNextTurn(room, roomCode, 'after shot forfeit', 3000);
              return;
            }
            
            // For charade or pictionary forfeits
            if (!currentPlayer.charadeCount) currentPlayer.charadeCount = 0;
            currentPlayer.charadeCount++;
            
            console.log(`[${gameState.currentForfeit.type}] ${currentPlayer.name} has now done ${currentPlayer.charadeCount} forfeits`);

            if (gameState.currentForfeit.type === 'charade') {
              gameState.gamePhase = 'charade_guessing';
              gameState.charadeSolution = gameState.currentForfeit.wordToAct;
              gameState.charadeSolved = false;
              const startedAt = Date.now();
              const endsAt = startedAt + CHARADE_DURATION_MS;
              console.log(`[charade] auto-start: room=${roomCode} player=${currentPlayer.id} durationMs=${CHARADE_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
              io.to(roomCode).emit('charade-started', { gameState, deadline: endsAt });
              console.log(`[charade] emitted charade-started to room ${roomCode}`);

              const prev = charadeTimeouts.get(roomCode);
              if (prev) clearTimeout(prev);
              const handle = setTimeout(() => {
                const currentRoom = rooms.get(roomCode);
                if (!currentRoom) return;
                if (!currentRoom.gameState.charadeSolved) {
                  handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'charade');
                }
              }, CHARADE_DURATION_MS);
              charadeTimeouts.set(roomCode, handle);
            } else if (gameState.currentForfeit.type === 'pictionary') {
              gameState.gamePhase = 'pictionary_drawing';
              gameState.pictionarySolution = gameState.currentForfeit.wordToAct;
              gameState.pictionarySolved = false;
              gameState.drawingData = null;
              const startedAt = Date.now();
              const endsAt = startedAt + PICTIONARY_DURATION_MS;
              console.log(`[pictionary] auto-start: room=${roomCode} player=${currentPlayer.id} durationMs=${PICTIONARY_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
              io.to(roomCode).emit('pictionary-started', { gameState, deadline: endsAt });

              const prev = pictionaryTimeouts.get(roomCode);
              if (prev) clearTimeout(prev);
              const handle = setTimeout(() => {
                const currentRoom = rooms.get(roomCode);
                if (!currentRoom) return;
                if (!currentRoom.gameState.pictionarySolved) {
                  handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'pictionary');
                }
              }, PICTIONARY_DURATION_MS);
              pictionaryTimeouts.set(roomCode, handle);
            }
          };
          startCharadeHandler(roomCode, currentPlayer.id);
        }, 1000); // Small delay to allow UI to update
      }
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
    gameState: JSON.parse(JSON.stringify(room.gameState)),
      categoryLocked: isCorrect && currentQ ? currentQ.category : null,
      lockedCategories: room.gameState.globalLockedCategories || [],
      recentCategories: room.gameState.globalRecentCategories || [],
      categoryLockMessage: isCorrect && currentQ ? 
        `Category "${currentQ.category}" is now locked for ALL players! Select 3 different categories to unlock it.` : null
    });

    // For correct answers only, add a small delay before changing turn
    // This ensures client UI has time to show the correct answer
    console.log(`[submit-answer] Turn advancement check: isCorrect=${isCorrect}, gamePhase=${room.gameState.gamePhase}, currentPlayer=${currentPlayer.id}`);
    if (isCorrect) {
      console.log(`[submit-answer] CALLING nextTurn for correct answer by ${playerId}`);
      // Use setTimeout to ensure the answer-submitted event is processed first
      // Schedule with centralized 3s delay (overrides earlier 500ms)
      scheduleNextTurn(room, roomCode, 'after correct answer', 3000);

      // Watchdog: if for some reason turn did not advance (missed event), force it once
      const previousIndex = room.gameState.currentPlayerIndex;
      setTimeout(() => {
        try {
          if (room.gameState.players.length > 1 && room.gameState.currentPlayerIndex === previousIndex) {
            console.warn('[watchdog] Detected stalled turn after correct answer; forcing nextTurn');
            scheduleNextTurn(room, roomCode, 'watchdog after correct answer', 3000);
          }
        } catch (e) {
          console.error('[watchdog] Error attempting forced advancement', e);
        }
      }, 1800);
    } else {
      console.log(`[submit-answer] NOT calling nextTurn: isCorrect=${isCorrect}, gamePhase=${room.gameState.gamePhase}`);
    }
  });

  // Power-up: swap_question (host or current player triggers) – rerolls current question once per power-up unit
  socket.on('powerup-swap-question', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'question' || !gs.currentQuestion) return;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return; // only active player
    if (!currentPlayer.powerUps || !currentPlayer.powerUps.swap_question) return;
    
    // Draw another question from same category using adaptive draw
    let newQ;
    let attempts = 0;
    do {
      newQ = drawQuestionFromPools(room, gs.currentQuestion.category);
      attempts++;
      if (attempts > 10) {
        console.log(`[server] swap question: failed to draw from same category ${gs.currentQuestion.category}, trying any category`);
        // If we can't find a question in the same category, try any category
        const allCategories = [...new Set(allQuestions.map(q => q.category))];
        for (const category of allCategories) {
          if (category !== gs.currentQuestion.category) {
            newQ = drawQuestionFromPools(room, category);
            if (newQ) {
              console.log(`[server] swap question: found question in category ${category}`);
              break;
            }
          }
        }
        break;
      }
    } while (newQ && newQ.id === gs.currentQuestion.id);
    
    // Only proceed if we got a valid new question different from the current one
    if (!newQ || newQ.id === gs.currentQuestion.id) {
      console.log(`[server] swap question: failed to draw different question for category ${gs.currentQuestion.category}`);
      return; // Don't consume powerup if we can't swap
    }
    
    currentPlayer.powerUps.swap_question -= 1;
    gs.currentQuestion = newQ;
    io.to(roomCode).emit('question-swapped', { gameState: gs, question: newQ, playerId });
  });

  // Power-up: steal_category – active player steals one progress point from a target player's category
  // Constraints: only during their own category_selection phase (before picking a category)
  // Does NOT affect global lock arrays; does count toward win condition.
  socket.on('powerup-steal-category', (roomCode, playerId, targetPlayerId, category) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'category_selection') return;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return; // must be your turn
    if (!currentPlayer.powerUps || !currentPlayer.powerUps.steal_category) return;
    const target = gs.players.find(p => p.id === targetPlayerId);
    if (!target || target.id === currentPlayer.id) return;
    if (!CATEGORIES.includes(category)) return;
    if (!target.categoryScores) target.categoryScores = {};
    if (!currentPlayer.categoryScores) currentPlayer.categoryScores = {};
    const targetScore = target.categoryScores[category] || 0;
    if (targetScore <= 0) return; // nothing to steal
    // Apply steal
    target.categoryScores[category] = targetScore - 1;
    currentPlayer.categoryScores[category] = (currentPlayer.categoryScores[category] || 0) + 1;
    currentPlayer.powerUps.steal_category -= 1;

    // Check win condition for thief after steal
    const hasAll = CATEGORIES.every(cat => (currentPlayer.categoryScores?.[cat] || 0) >= REQUIRED_PER_CATEGORY);
    io.to(roomCode).emit('powerup-steal-category-result', {
      gameState: gs,
      thiefId: currentPlayer.id,
      targetId: target.id,
      category,
      amount: 1
    });
    if (hasAll) {
      endGame(room, roomCode, currentPlayer);
    } else {
      // Emit general game state update so clients refresh inventory counts
      io.to(roomCode).emit('game-state-update', { gameState: gs, message: `${currentPlayer.name} stole progress in ${category}` });
    }
  });

  // Lifeline: fifty-fifty - removes two wrong answers, leaving correct + one wrong
  socket.on('use-lifeline-fifty-fifty', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'question' || !gs.currentQuestion) return;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return; // only active player
    if (!currentPlayer.lifelines || currentPlayer.lifelines.fiftyFifty <= 0) return;
    
    currentPlayer.lifelines.fiftyFifty -= 1;
    
    // Get wrong answer indices
    const wrongIndices = [];
    for (let i = 0; i < gs.currentQuestion.options.length; i++) {
      if (i !== gs.currentQuestion.correctAnswer) {
        wrongIndices.push(i);
      }
    }
    
    // Shuffle and keep 1 wrong answer
    shuffleArray(wrongIndices);
    const keptWrongIndex = wrongIndices[0];
    
    // Create new options array with correct answer and one wrong answer
    const newOptions = [
      gs.currentQuestion.options[gs.currentQuestion.correctAnswer],
      gs.currentQuestion.options[keptWrongIndex]
    ];
    
    // Update correct answer index (will be 0 since correct is first)
    const originalCorrectIndex = gs.currentQuestion.correctAnswer;
    gs.currentQuestion.correctAnswer = 0;
    gs.currentQuestion.options = newOptions;
    
    io.to(roomCode).emit('lifeline-fifty-fifty-used', { 
      gameState: gs, 
      playerId,
      removedIndices: wrongIndices.slice(1) // indices that were removed
    });
  });

  // Lifeline: pass to random player - passes question to another random player
  socket.on('use-lifeline-pass-to-random', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.gamePhase !== 'question' || !gs.currentQuestion) return;
    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return; // only active player
    if (!currentPlayer.lifelines || currentPlayer.lifelines.passToRandom <= 0) return;
    
    currentPlayer.lifelines.passToRandom -= 1;
    
    // Get eligible players (not eliminated, not current player)
    const eligiblePlayers = gs.players.filter(p => !p.isEliminated && p.id !== playerId);
    if (eligiblePlayers.length === 0) return; // no one to pass to
    
    // Select random player
    const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    const newPlayerIndex = gs.players.findIndex(p => p.id === randomPlayer.id);
    
    // Change current player
    gs.currentPlayerIndex = newPlayerIndex;
    
    // Clear existing question timeout and start fresh 30s timer for new player
    const existingTimeout = questionTimeouts.get(roomCode);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      questionTimeouts.delete(roomCode);
    }
    
    // Start fresh 30s timer for the new current player
    const timeoutMs = 30000; // 30s to answer
    const handle = setTimeout(() => {
      // If still on question phase when time expires, auto-resolve as incorrect
      if (gs.gamePhase === 'question' && gs.currentQuestion) {
        const correctAnswer = gs.currentQuestion.correctAnswer;
        
        // Determine the player dynamically at execution time
        const currentPlayerAtTimeout = gs.players[gs.currentPlayerIndex];
        
        // Mark that player needs to do charade (but don't deduct life yet)
        currentPlayerAtTimeout.needsCharadeForLife = true;
        console.log(`[question-timeout-passed] Player ${currentPlayerAtTimeout.name} timed out after question was passed - will do charade`);
        
        gs.gamePhase = 'forfeit';
        
        // Create the forfeit for the dynamically determined player
        gs.currentForfeit = drawForfeitFromPool(room, currentPlayerAtTimeout);
        
        // Auto-start forfeit based on type
        if (gs.currentForfeit.type === 'shot') {
          // For shot forfeits, complete immediately
          console.log(`[auto-forfeit-timeout-passed] Auto-completing shot forfeit for ${currentPlayerAtTimeout.name}`);
          currentPlayerAtTimeout.needsCharadeForLife = false;
          gs.gamePhase = 'category_selection';
          gs.currentForfeit = null;
          io.to(roomCode).emit('forfeit-completed', { gameState: gs, forfeitType: 'shot' });
          // Attempt karaoke break
          try {
            maybeTriggerKaraoke(room, roomCode);
          } catch (err) {
            console.error('[karaoke] maybeTriggerKaraoke error after auto shot forfeit timeout passed', err);
          }
          if (gs.gamePhase === 'karaoke_break') {
            console.log('[karaoke] Karaoke break triggered after auto shot forfeit timeout passed; skipping scheduled nextTurn');
          } else {
            scheduleNextTurn(room, roomCode, 'after auto shot forfeit timeout passed', 3000);
          }
        } else if (gs.currentForfeit.type === 'charade' || gs.currentForfeit.type === 'pictionary') {
          // Auto-start charade or pictionary forfeit
          console.log(`[auto-forfeit-timeout-passed] Auto-starting ${gs.currentForfeit.type} forfeit for ${currentPlayerAtTimeout.name}`);
          // Simulate the start-charade event for the current player
          setTimeout(() => {
            // This will trigger the existing start-charade handler logic
            const startCharadeHandler = (roomCode, playerId) => {
              const room = rooms.get(roomCode);
              if (!room) return;
              const gameState = room.gameState;
              if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;

              const currentPlayer = gameState.players[gameState.currentPlayerIndex];
              if (currentPlayer.id !== playerId) return;
              
              console.log(`[auto-start-charade-timeout-passed] Starting forfeit type: ${gameState.currentForfeit.type} for player ${currentPlayer.name}`);
              
              // Handle different forfeit types
              if (gameState.currentForfeit.type === 'shot') {
                // This shouldn't happen in auto-start, but handle it just in case
                console.log(`[forfeit-timeout-passed] Shot forfeit for ${currentPlayer.name}`);
                currentPlayer.needsCharadeForLife = false;
                gameState.gamePhase = 'category_selection';
                gameState.currentForfeit = null;
                io.to(roomCode).emit('forfeit-completed', { gameState, forfeitType: 'shot' });
                try {
                  maybeTriggerKaraoke(room, roomCode);
                } catch (err) {
                  console.error('[karaoke] maybeTriggerKaraoke error after shot forfeit timeout passed', err);
                }
                if (gameState.gamePhase === 'karaoke_break') {
                  console.log('[karaoke] Karaoke break triggered after shot forfeit timeout passed; skipping scheduled nextTurn');
                  return;
                }
                scheduleNextTurn(room, roomCode, 'after shot forfeit timeout passed', 3000);
                return;
              }
              
              // For charade or pictionary forfeits
              if (!currentPlayer.charadeCount) currentPlayer.charadeCount = 0;
              currentPlayer.charadeCount++;
              
              console.log(`[${gameState.currentForfeit.type}] ${currentPlayer.name} has now done ${currentPlayer.charadeCount} forfeits`);

              if (gameState.currentForfeit.type === 'charade') {
                gameState.gamePhase = 'charade_guessing';
                gameState.charadeSolution = gameState.currentForfeit.wordToAct;
                gameState.charadeSolved = false;
                const startedAt = Date.now();
                const endsAt = startedAt + CHARADE_DURATION_MS;
                console.log(`[charade] auto-start-timeout-passed: room=${roomCode} player=${currentPlayer.id} durationMs=${CHARADE_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
                io.to(roomCode).emit('charade-started', { gameState, deadline: endsAt });
                console.log(`[charade] emitted charade-started to room ${roomCode}`);

                const prev = charadeTimeouts.get(roomCode);
                if (prev) clearTimeout(prev);
                const handle = setTimeout(() => {
                  const currentRoom = rooms.get(roomCode);
                  if (!currentRoom) return;
                  if (!currentRoom.gameState.charadeSolved) {
                    handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'charade');
                  }
                }, CHARADE_DURATION_MS);
                charadeTimeouts.set(roomCode, handle);
              } else if (gameState.currentForfeit.type === 'pictionary') {
                gameState.gamePhase = 'pictionary_drawing';
                gameState.pictionarySolution = gameState.currentForfeit.wordToAct;
                gameState.pictionarySolved = false;
                gameState.drawingData = null;
                const startedAt = Date.now();
                const endsAt = startedAt + PICTIONARY_DURATION_MS;
                console.log(`[pictionary] auto-start-timeout-passed: room=${roomCode} player=${currentPlayer.id} durationMs=${PICTIONARY_DURATION_MS} endsAt=${new Date(endsAt).toISOString()}`);
                io.to(roomCode).emit('pictionary-started', { gameState, deadline: endsAt });

                const prev = pictionaryTimeouts.get(roomCode);
                if (prev) clearTimeout(prev);
                const handle = setTimeout(() => {
                  const currentRoom = rooms.get(roomCode);
                  if (!currentRoom) return;
                  if (!currentRoom.gameState.pictionarySolved) {
                    handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'pictionary');
                  }
                }, PICTIONARY_DURATION_MS);
                pictionaryTimeouts.set(roomCode, handle);
              }
            };
            startCharadeHandler(roomCode, currentPlayerAtTimeout.id);
          }, 1000); // Small delay to allow UI to update
        }
        
        // Emit answer-submitted with the correct playerId
        io.to(roomCode).emit('answer-submitted', {
          playerId: currentPlayerAtTimeout.id,
          isCorrect: false,
          correctAnswer,
          gameState: gs
        });
      }
    }, timeoutMs);
    questionTimeouts.set(roomCode, handle);
    
    io.to(roomCode).emit('lifeline-pass-to-random-used', { 
      gameState: gs, 
      fromPlayerId: playerId,
      toPlayerId: randomPlayer.id
    });
  });

  // Forfeit: start the charade or pictionary timer and reveal the word to audience (as needed)
  socket.on('start-charade', (roomCode, playerId) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'forfeit' || !gameState.currentForfeit) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;
    
    console.log(`[start-charade] Starting forfeit type: ${gameState.currentForfeit.type} for player ${currentPlayer.name}`);
    
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
      // Attempt an automatic karaoke break based on probability settings
      const beforePhase = gameState.gamePhase;
      try {
        maybeTriggerKaraoke(room, roomCode);
      } catch (err) {
        console.error('[karaoke] maybeTriggerKaraoke error after shot forfeit', err);
      }
      const afterPhase = gameState.gamePhase;
      if (afterPhase === 'karaoke_break') {
        console.log('[karaoke] Karaoke break triggered after shot forfeit; skipping scheduled nextTurn until karaoke ends');
        return; // Karaoke flow will reset phase & progression afterward
      }
      // If karaoke did not trigger, move to next turn after a short delay
  console.log(`[forfeit] No karaoke break (phase stayed ${beforePhase} -> ${afterPhase}); scheduling nextTurn in 3s`);
  scheduleNextTurn(room, roomCode, 'after shot forfeit', 3000);
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
      console.log(`[charade] emitted charade-started to room ${roomCode}`);

      // Start a 30s countdown
      const prev = charadeTimeouts.get(roomCode);
      if (prev) clearTimeout(prev);
      const handle = setTimeout(() => {
        // Get the CURRENT room and state at timeout execution time
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom) return;
        if (!currentRoom.gameState.charadeSolved) {
          handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'charade');
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
        // Get the CURRENT room and state at timeout execution time
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom) return;
        if (!currentRoom.gameState.pictionarySolved) {
          handleForfeitFailure(currentRoom, roomCode, currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex], 'pictionary');
        }
      }, PICTIONARY_DURATION_MS);
      pictionaryTimeouts.set(roomCode, handle);
    } else if (gameState.currentForfeit.type === 'tongue_twister') {
      // For tongue twister forfeits, display it for 20 seconds then move on
      console.log(`[tongue-twister] Starting tongue twister for ${currentPlayer.name}: "${gameState.currentForfeit.tongueTwister}"`);
      
      // Set deadline for client-side timer display
      const endsAt = Date.now() + 20000; // 20 seconds from now
      gameState.tongueTwisterDeadline = endsAt;
      
      // Stay in forfeit phase but mark it as started
      // After 20 seconds, automatically complete the forfeit
      setTimeout(() => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom || currentRoom.gameState.gamePhase !== 'forfeit') return;
        
        console.log(`[tongue-twister] Completed tongue twister for ${currentPlayer.name}`);
        
        // Reset the charade life flag since tongue twister forfeits don't involve charades
        // Note: No lives are lost or gained during tongue twister forfeits
        currentPlayer.needsCharadeForLife = false;
        
        currentRoom.gameState.gamePhase = 'category_selection';
        currentRoom.gameState.currentForfeit = null;
        currentRoom.gameState.tongueTwisterDeadline = null;
        
        // Notify clients about the completed forfeit
        io.to(roomCode).emit('forfeit-completed', { gameState: currentRoom.gameState, forfeitType: 'tongue_twister' });
        
        // Attempt an automatic karaoke break
        const beforePhase = currentRoom.gameState.gamePhase;
        try {
          maybeTriggerKaraoke(currentRoom, roomCode);
        } catch (err) {
          console.error('[karaoke] maybeTriggerKaraoke error after tongue twister', err);
        }
        const afterPhase = currentRoom.gameState.gamePhase;
        if (afterPhase === 'karaoke_break') {
          console.log('[karaoke] Karaoke break triggered after tongue twister; skipping scheduled nextTurn until karaoke ends');
          return;
        }
        
        // Move to next turn after a short delay
        console.log(`[tongue-twister] No karaoke break; scheduling nextTurn in 3s`);
        scheduleNextTurn(currentRoom, roomCode, 'after tongue twister', 3000);
      }, 15000); // 15 seconds for tongue twister (no lives lost or gained)
    }
  });

  // Forfeit: other players guess the charade word
  socket.on('guess-charade', (roomCode, playerId, guess) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gameState = room.gameState;
    if (gameState.gamePhase !== 'charade_guessing' || !gameState.charadeSolution) return;

  const normalized = normalizeForComparison(guess);
  if (!normalized) return;
  const solution = normalizeForComparison(gameState.charadeSolution);

  if (normalized === solution || isCloseMatch(normalized, solution)) {
      console.log(`[charade-solved] Correct guess by ${playerId}! Solution: ${solution}`);
      
      // Mark as solved and clear timeout
      gameState.charadeSolved = true;
      const t = charadeTimeouts.get(roomCode);
      if (t) clearTimeout(t);

      // Small reward for the actor for successfully conveying the word
      const actor = gameState.players[gameState.currentPlayerIndex];
  // Removed score bonus for actor; no scoring system
      
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
      
      // Finally advance to next turn with centralized scheduler
      console.log(`[charade-solved] Scheduling next turn after charade solved by ${playerId}`);
      scheduleNextTurn(room, roomCode, 'charade solved', 3000);
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

  const normalized = normalizeForComparison(guess);
  if (!normalized) return;
  const solution = normalizeForComparison(gameState.pictionarySolution);

  if (normalized === solution || isCloseMatch(normalized, solution)) {
      console.log(`[pictionary-solved] Correct guess by ${playerId}! Solution: ${solution}`);
      
      // Mark as solved and clear timeout
      gameState.pictionarySolved = true;
      const t = pictionaryTimeouts.get(roomCode);
      if (t) clearTimeout(t);

      // Small reward for the drawer for successfully conveying the word
      const drawer = gameState.players[gameState.currentPlayerIndex];
  // Removed score bonus for drawer; no scoring system
      
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
      
      // Finally advance to next turn with centralized scheduler
      console.log(`[pictionary-solved] Scheduling next turn after pictionary solved by ${playerId}`);
      scheduleNextTurn(room, roomCode, 'pictionary solved', 3000);
    }
  });

  // Lightning round: buzz-in with an answer index
  socket.on('lightning-buzz', (roomCode, playerId, answerIndex, questionId, submissionId) => {
    console.log(`[lightning-buzz] room=${roomCode} player=${playerId} idx=${answerIndex} qId=${questionId} subId=${submissionId}`);
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    
    // Validate lightning round is active and accepting answers
    if (!gs.lightningActive || gs.gamePhase !== 'lightning_round' || !gs.lightningQuestion || !gs.lightningAcceptingAnswers) {
      console.log('[lightning-buzz] Ignored: not active, wrong phase, or not accepting answers');
      return;
    }
    
    // Validate question ID matches current question
    if (!questionId || questionId !== gs.lightningQuestionId) {
      console.log(`[lightning-buzz] Ignored: question ID mismatch. Expected: ${gs.lightningQuestionId}, Got: ${questionId}`);
      return;
    }
    
    // Validate answer index is valid
    if (answerIndex === null || answerIndex === undefined || answerIndex < 0 || answerIndex >= gs.lightningQuestion.options.length) {
      console.log(`[lightning-buzz] Ignored: invalid answer index ${answerIndex}`);
      return;
    }
    
    // Check for winner already decided
    if (gs.lightningWinnerId) {
      console.log('[lightning-buzz] Ignored: winner already decided');
      return;
    }
    
    const player = gs.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) {
      console.log('[lightning-buzz] Ignored: invalid or eliminated player');
      return;
    }
    
    // Initialize submissions tracking if not exists
    if (!gs.lightningSubmissions) {
      gs.lightningSubmissions = {};
    }
    
    // Check for duplicate submission from this player for this question
    if (gs.lightningSubmissions[playerId]) {
      console.log(`[lightning-buzz] ${player.name} already submitted for this question, ignoring`);
      return;
    }
    
    // Record the submission
    gs.lightningSubmissions[playerId] = {
      answerIndex,
      submissionId: submissionId || Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    
    // Initialize answered players array if not exists
    if (!gs.lightningAnsweredPlayers) {
      gs.lightningAnsweredPlayers = [];
    }
    
    // Check if player has already answered this round (legacy check)
    if (gs.lightningAnsweredPlayers.includes(playerId)) {
      console.log(`[lightning-buzz] ${player.name} already answered this round, ignoring`);
      return;
    }
    
    const correct = answerIndex === gs.lightningQuestion.correctAnswer;
    
    // Mark player as having answered
    gs.lightningAnsweredPlayers.push(playerId);
    
    if (gs.lightningMode === 'sudden_death') {
      // In sudden death mode: one answer per player, wrong answers freeze them out (no lives lost)
      if (!correct) {
        console.log(`[lightning-buzz] SUDDEN DEATH: ${player.name} got wrong answer - frozen out for this round`);
        // Player is frozen out but not eliminated, no lives lost
        // Continue waiting for other players or correct answer
        return;
      } else {
        // Correct answer - this player wins!
        gs.lightningWinnerId = playerId;
        console.log(`[lightning-buzz] SUDDEN DEATH: ${player.name} got it right and wins!`);
        io.to(roomCode).emit('lightning-winner', { gameState: gs, winnerId: playerId });
        io.to(roomCode).emit('lightning-reward-choice', { winnerId: playerId, options: ['extra_life', 'lifeline'] });
        endLightning(room, roomCode, 'winner');
        return;
      }
    } else {
      // Original normal mode: only first correct wins
      if (!correct) {
        console.log('[lightning-buzz] Wrong answer; waiting for a correct buzz');
        return; // only first correct wins
      }
      gs.lightningWinnerId = playerId;
      io.to(roomCode).emit('lightning-winner', { gameState: gs, winnerId: playerId });
      // Prompt winner to choose reward
      io.to(roomCode).emit('lightning-reward-choice', { winnerId: playerId, options: ['extra_life', 'lifeline'] });
      // Stop the round countdown
      endLightning(room, roomCode, 'winner');
    }
  });

  // Lightning reward chosen by winner
  socket.on('choose-lightning-reward', (roomCode, playerId, reward) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const gs = room.gameState;
    if (gs.lightningWinnerId !== playerId) return;
    const player = gs.players.find(p => p.id === playerId);
    if (!player) return;
    if (reward === 'extra_life') {
      player.lives = (player.lives || 0) + 1;
    } else if (reward === 'lifeline') {
      // Grant one 50/50 by default
      if (!player.lifelines) player.lifelines = { fiftyFifty: 0, passToRandom: 0 };
      player.lifelines.fiftyFifty += 1;
    }
    io.to(roomCode).emit('lightning-reward-applied', { gameState: gs, playerId, reward });
    // After reward, proceed to next normal turn with 3s delay
    scheduleNextTurn(room, roomCode, 'after lightning reward', 3000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Sabotage: reset another player's power bar to 0% and set saboteur to 50%
  socket.on('sabotage-player', (roomCode, saboteurId, targetId) => {
    console.log(`[sabotage] Attempt: room=${roomCode} saboteur=${saboteurId} target=${targetId}`);
    const room = rooms.get(roomCode);
    if (!room) {
      console.log('[sabotage] Failed: room not found');
      return;
    }
    const gs = room.gameState;
    // Only allow sabotage during normal gameplay (category_selection or question)
    const allowedPhases = ['category_selection', 'question'];
    if (!allowedPhases.includes(gs.gamePhase)) {
      console.log(`[sabotage] Rejected: not allowed during phase '${gs.gamePhase}'`);
      return;
    }
    
    // Find saboteur and target players
    const saboteur = gs.players.find(p => p.id === saboteurId);
    const target = gs.players.find(p => p.id === targetId);
    
    if (!saboteur || !target) {
      console.log('[sabotage] Failed: player not found');
      return;
    }
    
    // Validate saboteur has sabotage ability
    if (!saboteur.hasSabotage) {
      console.log('[sabotage] Failed: saboteur does not have sabotage ability');
      return;
    }
    
    // Validate target is not eliminated
    if (target.isEliminated) {
      console.log('[sabotage] Failed: target is eliminated');
      return;
    }
    
    // Validate target is not the saboteur
    if (saboteurId === targetId) {
      console.log('[sabotage] Failed: cannot sabotage self');
      return;
    }
    
    // Perform sabotage
    console.log(`[sabotage] Executing: ${saboteur.name} sabotages ${target.name}`);
    
    // Reset target's power bar to 0%
    target.powerBar = 0;
    
    // Set saboteur's power bar to 50%
    saboteur.powerBar = 50;
    
    // Remove sabotage ability from saboteur
    saboteur.hasSabotage = false;

    // Deduct a life from the sabotaged player
    const prevLives = target.lives || 0;
    target.lives = Math.max(0, prevLives - 1);
    console.log(`[sabotage] ${target.name} loses a life: ${prevLives} -> ${target.lives}`);
    
    // If target runs out of lives, eliminate them
    if (target.lives === 0) {
      target.isEliminated = true;
      console.log(`[sabotage] ${target.name} eliminated due to sabotage (no lives left)`);
    }
    
    // Emit sabotage event to all clients
    io.to(roomCode).emit('player-sabotaged', {
      gameState: gs,
      saboteurId,
      targetId,
      saboteurName: saboteur.name,
      targetName: target.name
    });
    
    console.log(`[sabotage] Completed: ${target.name} power bar reset to 0%, ${saboteur.name} set to 50%`);

    // If elimination happened, check last-player-standing and/or advance turn if needed
    if (target.isEliminated) {
      const lastPlayerStanding = checkLastPlayerStanding(room);
      if (lastPlayerStanding) {
        console.log(`[sabotage] Last player standing detected after elimination: ${lastPlayerStanding.name}`);
        endGame(room, roomCode, lastPlayerStanding);
        return;
      }
      // If the eliminated player was the current player, move to the next turn
      if (gs.players[gs.currentPlayerIndex]?.id === targetId) {
        scheduleNextTurn(room, roomCode, 'after sabotage elimination', 1000);
      }
    }
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
      ensurePlayerHasLifelines(existingPlayer);
      socket.join(gameId);
      console.log(`Player ${playerId} reconnected to game ${gameId}`);
      
      callback?.({
        success: true,
        isHost: existingPlayer.isHost,
        playerId: existingPlayer.id,
        gameState: room.gameState
      });
      return;
    } else if (persistentId && playerName) {
      // Allow new player to join via reconnection if game is in waiting phase
      if (room.gameState.gamePhase === 'waiting') {
        const newPlayer = createPlayer(playerName, false);
        newPlayer.persistentId = persistentId;
        const assignedPlayer = assignPlayerAppearance(newPlayer, room.gameState.players);
        ensurePlayerHasLifelines(assignedPlayer);
        
        room.gameState.players.push(assignedPlayer);
        socket.join(gameId);
        
        // Notify other players
        io.to(gameId).emit('player-joined', { gameState: room.gameState });
        
        console.log(`New player ${assignedPlayer.id} joined game ${gameId} via reconnection`);
        // Ensure all players have lifelines and powerUps before sending
        room.gameState.players.forEach(player => ensurePlayerHasLifelines(player));
        
        callback?.({
          success: true,
          isHost: false,
          playerId: assignedPlayer.id,
          gameState: room.gameState
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
  console.log(`[${forfeitType}] Scheduling next turn after ${forfeitType} timeout`);
  scheduleNextTurn(room, roomCode, `${forfeitType} timeout`, 3000);
}

// ---- Karaoke Feature (auto + manual) ----
const KARAOKE_SONGS = [
  { title: 'Sweet Caroline', artist: 'Neil Diamond', alexaPhrase: 'Sweet Caroline by Neil Diamond', difficulty: 'easy', durationHintSec: 45 },
  { title: "Don't Stop Believin'", artist: 'Journey', alexaPhrase: "Don't Stop Believin' by Journey", difficulty: 'medium', durationHintSec: 50 },
  { title: 'Bohemian Rhapsody', artist: 'Queen', alexaPhrase: 'Bohemian Rhapsody by Queen', difficulty: 'hard', durationHintSec: 60 },
  { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', alexaPhrase: "Livin' on a Prayer by Bon Jovi", difficulty: 'medium', durationHintSec: 55 },
  { title: 'Wonderwall', artist: 'Oasis', alexaPhrase: 'Wonderwall by Oasis', difficulty: 'easy', durationHintSec: 45 },
  { title: 'I Want It That Way', artist: 'Backstreet Boys', alexaPhrase: 'I Want It That Way by Backstreet Boys', difficulty: 'easy', durationHintSec: 45 },
  { title: 'Angels', artist: 'Robbie Williams', alexaPhrase: 'Angels by Robbie Williams', difficulty: 'easy', durationHintSec: 50 },
  { title: 'Flowers', artist: 'Miley Cyrus', alexaPhrase: 'Flowers by Miley Cyrus', difficulty: 'easy', durationHintSec: 45 },
  { title: "It's Raining Men", artist: 'The Weather Girls', alexaPhrase: "It's Raining Men by The Weather Girls", difficulty: 'easy', durationHintSec: 50 },
  { title: 'Poison', artist: 'Alice Cooper', alexaPhrase: 'Poison by Alice Cooper', difficulty: 'medium', durationHintSec: 55 },
  { title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', alexaPhrase: 'Total Eclipse of the Heart by Bonnie Tyler', difficulty: 'hard', durationHintSec: 60 },
  { title: 'I Will Survive', artist: 'Gloria Gaynor', alexaPhrase: 'I Will Survive by Gloria Gaynor', difficulty: 'medium', durationHintSec: 55 },
  { title: 'Creep', artist: 'Radiohead', alexaPhrase: 'Creep by Radiohead', difficulty: 'medium', durationHintSec: 55 },
  { title: 'Purple Rain', artist: 'Prince', alexaPhrase: 'Purple Rain by Prince', difficulty: 'hard', durationHintSec: 65 },
  { title: 'A Million Dreams', artist: 'The Greatest Showman Cast', alexaPhrase: 'A Million Dreams from The Greatest Showman soundtrack', difficulty: 'medium', durationHintSec: 55 },
  { title: 'Mamma Mia', artist: 'ABBA', alexaPhrase: 'Mamma Mia by ABBA', difficulty: 'easy', durationHintSec: 45 },
  { title: 'Torn', artist: 'Natalie Imbruglia', alexaPhrase: 'Torn by Natalie Imbruglia', difficulty: 'easy', durationHintSec: 45 },
  { title: 'Wannabe', artist: 'Spice Girls', alexaPhrase: 'Wannabe by Spice Girls', difficulty: 'easy', durationHintSec: 45 }
];

function pickKaraokeOptions() {
  const shuffled = [...KARAOKE_SONGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
}

function triggerKaraoke(room, roomCode, manual=false, skipVoting=false) {
  const gs = room.gameState;
  if (gs.gamePhase === 'karaoke_break' || gs.gamePhase === 'karaoke_voting') return;
  if (!gs.karaokeSettings) gs.karaokeSettings = { probability: 0.4, durationSec: 45, cooldownSec: 180, lastTriggeredAt: 0 };
  const now = Date.now();
  const since = now - (gs.karaokeSettings.lastTriggeredAt || 0);
  if (!manual && since < gs.karaokeSettings.cooldownSec * 1000) return;
  gs.karaokeSettings.lastTriggeredAt = now;
  
  if (skipVoting) {
    // Skip voting - pick random song directly
    gs.currentKaraokeSong = { ...KARAOKE_SONGS[Math.floor(Math.random() * KARAOKE_SONGS.length)], durationHintSec: gs.karaokeSettings.durationSec };
    gs.karaokeBreakCount = (gs.karaokeBreakCount || 0) + 1;
    gs.karaokeStartAt = now;
    gs.gamePhase = 'karaoke_break';
    io.to(roomCode).emit('game-state-update', { gameState: gs, message: manual ? 'Manual karaoke break!' : 'Karaoke break!' });
    io.to(roomCode).emit('karaoke-sync', { startAt: gs.karaokeStartAt, duration: gs.karaokeSettings.durationSec });
    setTimeout(() => {
      if (gs.gamePhase === 'karaoke_break') {
        gs.currentKaraokeSong = null;
        gs.gamePhase = 'category_selection';
        const endedAt = Date.now();
        io.to(roomCode).emit('karaoke-ended', { endedAt });
        io.to(roomCode).emit('game-state-update', { gameState: gs, message: 'Karaoke ended (auto)' });
        scheduleNextTurn(room, roomCode, 'karaoke auto end (skip voting)', 3000);
      }
    }, gs.karaokeSettings.durationSec * 1000);
  } else {
    // Start voting phase for automatic triggers
  gs.karaokeVotingOptions = pickKaraokeOptions();
  gs.karaokeVotes = {};
    gs.karaokeBreakCount = (gs.karaokeBreakCount || 0) + 1;
    gs.karaokeVotingEndAt = now + 30000; // 30 seconds for voting
    gs.gamePhase = 'karaoke_voting';
    io.to(roomCode).emit('game-state-update', { gameState: gs, message: 'Karaoke voting!' });
    // Start voting timer
    setTimeout(() => {
      if (gs.gamePhase === 'karaoke_voting') {
        endKaraokeVoting(room, roomCode);
      }
    }, 30000);
  }
}

function endKaraokeVoting(room, roomCode) {
  const gs = room.gameState;
  if (gs.gamePhase !== 'karaoke_voting') return;
  
  // Count votes (each player can have up to two selections)
  const voteCounts = {};
  for (const playerId in gs.karaokeVotes) {
    const votes = gs.karaokeVotes[playerId];
    if (Array.isArray(votes)) {
      votes.forEach((vi) => {
        if (vi >= 0 && vi < gs.karaokeVotingOptions.length) {
          voteCounts[vi] = (voteCounts[vi] || 0) + 1;
        }
      });
    } else {
      // Backward compatibility: single index stored
      const vi = votes;
      if (vi >= 0 && vi < gs.karaokeVotingOptions.length) {
        voteCounts[vi] = (voteCounts[vi] || 0) + 1;
      }
    }
  }
  
  // Find the song with most votes (first one wins ties)
  let maxVotes = -1;
  let winningIndex = 0;
  for (let i = 0; i < gs.karaokeVotingOptions.length; i++) {
    const votes = voteCounts[i] || 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      winningIndex = i;
    }
  }
  
  // Start karaoke with winning song
  gs.currentKaraokeSong = { ...gs.karaokeVotingOptions[winningIndex], durationHintSec: gs.karaokeSettings.durationSec };
  gs.karaokeStartAt = Date.now();
  gs.gamePhase = 'karaoke_break';
  // Clear voting data
  delete gs.karaokeVotingOptions;
  delete gs.karaokeVotes;
  delete gs.karaokeVotingEndAt;
  
  io.to(roomCode).emit('game-state-update', { gameState: gs, message: `Karaoke: ${gs.currentKaraokeSong.title} by ${gs.currentKaraokeSong.artist}!` });
  io.to(roomCode).emit('karaoke-sync', { startAt: gs.karaokeStartAt, duration: gs.karaokeSettings.durationSec });
  setTimeout(() => {
    if (gs.gamePhase === 'karaoke_break') {
      gs.currentKaraokeSong = null;
      gs.gamePhase = 'category_selection';
      const endedAt = Date.now();
      io.to(roomCode).emit('karaoke-ended', { endedAt });
      io.to(roomCode).emit('game-state-update', { gameState: gs, message: 'Karaoke ended (auto)' });
      scheduleNextTurn(room, roomCode, 'karaoke auto end (after voting)', 3000);
    }
  }, gs.karaokeSettings.durationSec * 1000);
}

function maybeTriggerKaraoke(room, roomCode) {
  const gs = room.gameState;
  if (!gs.karaokeSettings) gs.karaokeSettings = { probability: 0.4, durationSec: 45, cooldownSec: 180, lastTriggeredAt: 0 };
  const rnd = Math.random();
  if (rnd <= gs.karaokeSettings.probability) {
    triggerKaraoke(room, roomCode, false);
  }
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
  const p = pictionaryTimeouts.get(roomCode);
  if (p) { clearTimeout(p); pictionaryTimeouts.delete(roomCode); }
  const l = lightningTimeouts.get(roomCode);
  if (l) { clearTimeout(l); lightningTimeouts.delete(roomCode); }
  
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
  // Increment global turn counter and check for lightning round trigger
  room.gameState.turnsPlayed = (room.gameState.turnsPlayed || 0) + 1;
  const shouldLightning = room.gameState.turnsPlayed % 10 === 0;
  
  // Always set the game phase to 'category_selection' for the next player
  // This ensures that after a correct answer, the next player sees the category selection screen
  if (room.gameState.gamePhase !== 'forfeit' && room.gameState.gamePhase !== 'charade_guessing' && room.gameState.gamePhase !== 'pictionary_drawing' && room.gameState.gamePhase !== 'karaoke_voting' && room.gameState.gamePhase !== 'karaoke_break') {
    room.gameState.gamePhase = 'category_selection';
    console.log(`[nextTurn] Set gamePhase to 'category_selection' for new player ${players[newIndex]?.id} to select category`);
  } else {
    console.log(`[nextTurn] Keeping gamePhase as '${room.gameState.gamePhase}' since we're in a forfeit or charade`);
  }
  
  // If it's a lightning turn, trigger lightning round instead of normal flow
  if (shouldLightning) {
    console.log(`[lightning] Triggering lightning round on turn ${room.gameState.turnsPlayed}`);
    try {
      triggerLightning(room, roomCode);
    } catch (e) {
      console.error('[lightning] Failed to trigger lightning', e);
    }
    // Do not emit next-turn here; lightning handlers will emit state updates
    console.log('[nextTurn] COMPLETED with lightning trigger');
    return;
  }
  
  // Emit the turn change event with updated game state
  console.log(`[nextTurn] Emitting next-turn: gamePhase=${room.gameState.gamePhase}, currentPlayerIndex=${room.gameState.currentPlayerIndex}, currentPlayer=${players[newIndex]?.name} (${players[newIndex]?.id})`);
  console.log(`[nextTurn] Player order: ${players.map(p => p.name).join(' -> ')}`);
  console.log(`[nextTurn] Player IDs: ${players.map(p => p.id).join(', ')}`);
  io.to(roomCode).emit('next-turn', { gameState: JSON.parse(JSON.stringify(room.gameState)) });
  
  // Log the state after emitting the event
  console.log(`[nextTurn] COMPLETED: room=${roomCode}, final gamePhase=${room.gameState.gamePhase}, final currentPlayerIndex=${room.gameState.currentPlayerIndex}`);
  console.log(`[nextTurn] Final current player: ${players[room.gameState.currentPlayerIndex]?.name} (${players[room.gameState.currentPlayerIndex]?.id})`);
}

function endLightning(room, roomCode, reason = 'timeout') {
  const gs = room.gameState;
  const t = lightningTimeouts.get(roomCode);
  if (t) { clearTimeout(t); lightningTimeouts.delete(roomCode); }
  gs.lightningActive = false;
  gs.lightningQuestion = null;
  gs.lightningEndAt = null;
  gs.lightningAnsweredPlayers = []; // Reset answered players
  gs.lightningMode = null; // Reset lightning mode
  gs.lightningAcceptingAnswers = false; // Reset accepting answers flag
  gs.lightningQuestionId = null; // Reset question ID
  gs.lightningSubmissions = {}; // Reset submissions tracking
  if (gs.gamePhase === 'lightning_round') {
    gs.gamePhase = 'category_selection';
  }
  io.to(roomCode).emit('lightning-ended', { gameState: gs, reason });
  io.to(roomCode).emit('game-state-update', { gameState: gs, message: 'Lightning ended' });
  // Stop dramatic music
  io.to(roomCode).emit('dramatic-music-stop');
  // Auto-advance to next turn after lightning timeout
  if (reason === 'timeout') {
    scheduleNextTurn(room, roomCode, 'lightning timeout', 3000);
  } else if (reason === 'winner') {
    // Add fallback watchdog: if winner doesn't choose reward within 12 seconds, auto-advance
    setTimeout(() => {
      if (gs.gamePhase === 'category_selection' && gs.lightningWinnerId) {
        console.log(`[lightning-winner-watchdog] Winner ${gs.lightningWinnerId} didn't choose reward, auto-advancing`);
        // Clear the winner ID to prevent further reward choices
        gs.lightningWinnerId = null;
        scheduleNextTurn(room, roomCode, 'lightning winner watchdog', 3000);
      }
    }, 12000); // 12 seconds should be enough time to choose a reward
  }
}

function triggerLightning(room, roomCode) {
  const gs = room.gameState;
  if (gs.gamePhase === 'karaoke_break' || gs.gamePhase === 'karaoke_voting') return;
  const q = getRandomQuestion([]);
  gs.lightningActive = true;
  gs.lightningQuestion = q;
  gs.lightningWinnerId = null;
  gs.lightningAnsweredPlayers = []; // Reset answered players for new round
  gs.lightningMode = 'sudden_death'; // Enable sudden death mode
  gs.lightningEndAt = Date.now() + 15000; // 15 seconds
  gs.lightningAcceptingAnswers = false; // Start with answers not accepted
  gs.lightningQuestionId = Math.random().toString(36).substring(2, 9); // Unique ID for this question
  gs.lightningSubmissions = {}; // Track submissions for this question
  gs.gamePhase = 'lightning_round';
  // Emit countdown event with 5-second delay before starting
  const countdownEndAt = Date.now() + 5000; // 5 seconds from now
  io.to(roomCode).emit('lightning-countdown', { countdownEndAt });
  // Start dramatic music immediately
  io.to(roomCode).emit('dramatic-music-start');
  setTimeout(() => {
    gs.lightningAcceptingAnswers = true; // Now accept answers
    io.to(roomCode).emit('lightning-start', { gameState: gs, question: q, deadline: gs.lightningEndAt, questionId: gs.lightningQuestionId });
  }, 5000);
  const handle = setTimeout(() => {
    gs.lightningAcceptingAnswers = false; // Stop accepting answers
    if (gs.gamePhase === 'lightning_round') {
      endLightning(room, roomCode, 'timeout');
    }
  }, 20000); // 5s countdown + 15s round = 20s total
  lightningTimeouts.set(roomCode, handle);
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
  
  const p = pictionaryTimeouts.get(roomCode);
  if (p) { clearTimeout(p); pictionaryTimeouts.delete(roomCode); }
  
  const l = lightningTimeouts.get(roomCode);
  if (l) { clearTimeout(l); lightningTimeouts.delete(roomCode); }
  
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
