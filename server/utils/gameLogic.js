"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextPlayer = exports.getRandomQuestion = exports.assignPlayerAppearance = exports.createPlayer = exports.generateRoomCode = exports.playerAvatars = exports.playerColors = exports.categoryColors = exports.MAX_PLAYERS = void 0;
const module_1 = require("module");
const require = (0, module_1.createRequire)(import.meta.url);
// Import comprehensive question set from server_data
const questionsModule = require('../../server_data/expanded_questions.cjs');
const allQuestions = questionsModule.allQuestions;
exports.MAX_PLAYERS = 6;
exports.categoryColors = [
    '#EF4444', // History - Red
    '#3B82F6', // Science - Blue
    '#10B981', // Sports - Green
    '#F59E0B', // Entertainment - Yellow
    '#8B5CF6', // Geography - Purple
    '#EC4899', // Technology - Pink
];
exports.playerColors = [
    '#EF5555', // Red
    '#4B92FF', // Blue  
    '#20C991', // Green
    '#F5AE1B', // Yellow
    '#9B6CF6', // Purple
    '#FC59A9' // Pink
];
exports.playerAvatars = ['🦊', '🐻', '🐱', '🐸', '🦁', '🐼'];
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};
exports.generateRoomCode = generateRoomCode;
const createPlayer = (name, isHost = false) => {
    return {
        id: Math.random().toString(36).substring(2, 9),
        name,
        color: '',
        avatar: '',
        lives: 3, // Initialize with 3 lives
        isHost,
        isEliminated: false,
        categoryScores: {}, // Initialize empty category scores
        lockedCategories: [], // Initialize empty locked categories
        recentCategories: [], // Initialize empty recent categories
        lifelines: {
            fiftyFifty: 3,
            passToRandom: 3
        },
        powerUps: {
            swap_question: 1,
            steal_category: 1
        },
        powerBar: 50 // Initialize at 50%
    };
};
exports.createPlayer = createPlayer;
const assignPlayerAppearance = (player, existingPlayers) => {
    const usedColors = existingPlayers.map(p => p.color);
    const usedAvatars = existingPlayers.map(p => p.avatar);
    const availableColors = exports.playerColors.filter(color => !usedColors.includes(color));
    const availableAvatars = exports.playerAvatars.filter(avatar => !usedAvatars.includes(avatar));
    return {
        ...player,
        color: availableColors[0] || exports.playerColors[0],
        avatar: availableAvatars[0] || exports.playerAvatars[0]
    };
};
exports.assignPlayerAppearance = assignPlayerAppearance;
const getRandomQuestion = (usedQuestionIds = []) => {
    const availableQuestions = allQuestions.filter(q => !usedQuestionIds.includes(q.id));
    if (availableQuestions.length === 0) {
        // If all questions used, reset and use all questions
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};
exports.getRandomQuestion = getRandomQuestion;
// addPointsToPlayer removed – scoring no longer used
// processChanceEvent deprecated (scoring & board removed)
// checkWinCondition deprecated – server handles win by category completion or elimination
const getNextPlayer = (gameState) => {
    return (gameState.currentPlayerIndex + 1) % gameState.players.length;
};
exports.getNextPlayer = getNextPlayer;
