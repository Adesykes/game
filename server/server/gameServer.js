"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const gameLogic_1 = require("../utils/gameLogic");
// Simple win condition check - player needs 5 in each category
const checkWinCondition = (gameState) => {
    const questionCategories = ['History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology', 'Music', 'Food', 'Literature', 'Animals'];
    for (const player of gameState.players) {
        if (player.isEliminated)
            continue;
        const hasAllCategories = questionCategories.every(category => (player.categoryScores[category] || 0) >= 5);
        if (hasAllCategories) {
            return player;
        }
    }
    return null;
};
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const rooms = new Map();
// Serve static files in production
app.use(express_1.default.static('dist'));
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('create-room', (hostName, callback) => {
        const roomCode = (0, gameLogic_1.generateRoomCode)();
        const host = (0, gameLogic_1.createPlayer)(hostName, true);
        const assignedHost = (0, gameLogic_1.assignPlayerAppearance)(host, []);
        const gameState = {
            id: roomCode,
            players: [assignedHost],
            currentPlayerIndex: 0,
            currentQuestion: null,
            selectedCategory: null,
            gamePhase: 'waiting',
            winner: null,
            round: 1,
            maxRounds: 10,
            currentForfeit: null,
            charadeSolution: null,
            charadeSolved: false,
            pictionarySolution: null,
            pictionarySolved: false,
            drawingData: null,
            globalLockedCategories: [],
            globalRecentCategories: []
        };
        const room = {
            id: roomCode,
            gameState,
            usedQuestionIds: []
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        callback({ success: true, roomCode, gameState });
    });
    // Handle v2 events (with persistent ID)
    socket.on('create-room-v2', (data, callback) => {
        console.log(`[server] create-room-v2 event received:`, data);
        const roomCode = (0, gameLogic_1.generateRoomCode)();
        const host = (0, gameLogic_1.createPlayer)(data.hostName, true);
        const assignedHost = (0, gameLogic_1.assignPlayerAppearance)(host, []);
        const gameState = {
            id: roomCode,
            players: [assignedHost],
            currentPlayerIndex: 0,
            currentQuestion: null,
            selectedCategory: null,
            gamePhase: 'waiting',
            winner: null,
            round: 1,
            maxRounds: 10,
            currentForfeit: null,
            charadeSolution: null,
            charadeSolved: false,
            pictionarySolution: null,
            pictionarySolved: false,
            drawingData: null,
            globalLockedCategories: [],
            globalRecentCategories: []
        };
        const room = {
            id: roomCode,
            gameState,
            usedQuestionIds: []
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        console.log(`[server] Room ${roomCode} created successfully with v2 event`);
        callback({ success: true, roomCode, gameState });
    });
    socket.on('join-room', (roomCode, playerName, callback) => {
        console.log(`[server] join-room event received: roomCode=${roomCode}, playerName=${playerName}`);
        const room = rooms.get(roomCode);
        console.log(`[server] Room lookup result:`, room ? 'found' : 'not found');
        if (!room) {
            console.log(`[server] Room ${roomCode} not found`);
            callback({ success: false, error: 'Room not found' });
            return;
        }
        if (room.gameState.players.length >= gameLogic_1.MAX_PLAYERS) {
            console.log(`[server] Room ${roomCode} is full (${room.gameState.players.length}/${gameLogic_1.MAX_PLAYERS})`);
            callback({ success: false, error: 'Room is full' });
            return;
        }
        if (room.gameState.gamePhase !== 'waiting') {
            console.log(`[server] Room ${roomCode} game already started (phase: ${room.gameState.gamePhase})`);
            callback({ success: false, error: 'Game already started' });
            return;
        }
        console.log(`[server] Creating new player: ${playerName}`);
        const newPlayer = (0, gameLogic_1.createPlayer)(playerName);
        const assignedPlayer = (0, gameLogic_1.assignPlayerAppearance)(newPlayer, room.gameState.players);
        console.log(`[server] Adding player ${assignedPlayer.name} to room ${roomCode}`);
        room.gameState.players.push(assignedPlayer);
        socket.join(roomCode);
        console.log(`[server] Emitting player-joined event to room ${roomCode}`);
        io.to(roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });
        console.log(`[server] Sending success callback for player ${assignedPlayer.id}`);
        callback({ success: true, gameState: room.gameState, playerId: assignedPlayer.id });
    });
    // Handle v2 join-room event (with persistent ID)
    socket.on('join-room-v2', (data, callback) => {
        console.log(`[server] join-room-v2 event received:`, data);
        const room = rooms.get(data.roomCode);
        console.log(`[server] Room lookup result for ${data.roomCode}:`, room ? 'found' : 'not found');
        if (!room) {
            console.log(`[server] Room ${data.roomCode} not found`);
            callback({ success: false, error: 'Room not found' });
            return;
        }
        if (room.gameState.players.length >= gameLogic_1.MAX_PLAYERS) {
            console.log(`[server] Room ${data.roomCode} is full (${room.gameState.players.length}/${gameLogic_1.MAX_PLAYERS})`);
            callback({ success: false, error: 'Room is full' });
            return;
        }
        if (room.gameState.gamePhase !== 'waiting') {
            console.log(`[server] Room ${data.roomCode} game already started (phase: ${room.gameState.gamePhase})`);
            callback({ success: false, error: 'Game already started' });
            return;
        }
        console.log(`[server] Creating new player: ${data.playerName}`);
        const newPlayer = (0, gameLogic_1.createPlayer)(data.playerName);
        const assignedPlayer = (0, gameLogic_1.assignPlayerAppearance)(newPlayer, room.gameState.players);
        console.log(`[server] Adding player ${assignedPlayer.name} to room ${data.roomCode}`);
        room.gameState.players.push(assignedPlayer);
        socket.join(data.roomCode);
        console.log(`[server] Emitting player-joined event to room ${data.roomCode}`);
        io.to(data.roomCode).emit('player-joined', { gameState: room.gameState, player: assignedPlayer });
        console.log(`[server] Sending success callback for player ${assignedPlayer.id}`);
        callback({ success: true, gameState: room.gameState, playerId: assignedPlayer.id });
    });
    socket.on('start-game', (roomCode) => {
        const room = rooms.get(roomCode);
        if (!room || room.gameState.players.length < 2)
            return;
        room.gameState.gamePhase = 'category_selection';
        io.to(roomCode).emit('game-started', { gameState: room.gameState });
    });
    socket.on('submit-answer', (roomCode, playerId, answerIndex) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState.currentQuestion)
            return;
        const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId)
            return;
        const isCorrect = answerIndex === room.gameState.currentQuestion.correctAnswer;
        const points = isCorrect ? 100 : 0;
        console.log(`[submit-answer] Answer ${answerIndex} is ${isCorrect ? 'correct' : 'incorrect'} (correct: ${room.gameState.currentQuestion.correctAnswer})`);
        // Update power bar: +10% for correct, -10% for incorrect (minimum 0%)
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
    socket.on('sabotage-player', (roomCode, playerId, targetName) => {
        const room = rooms.get(roomCode);
        if (!room)
            return;
        const player = room.gameState.players.find(p => p.id === playerId);
        if (!player || !player.hasSabotage)
            return;
        const target = room.gameState.players.find(p => p.name === targetName);
        if (!target)
            return;
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
function nextTurn(room, roomCode) {
    room.gameState.currentPlayerIndex = (0, gameLogic_1.getNextPlayer)(room.gameState);
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
