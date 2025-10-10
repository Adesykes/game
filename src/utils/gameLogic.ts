import { Player, GameState, Question } from '../types/game';
// Import comprehensive question set from server_data
const questionsModule = require('../../server_data/expanded_questions.cjs');
const allQuestions: Question[] = questionsModule.allQuestions;

export const MAX_PLAYERS = 6;

export const categoryColors = [
  '#EF4444', // History - Red
  '#3B82F6', // Science - Blue
  '#10B981', // Sports - Green
  '#F59E0B', // Entertainment - Yellow
  '#8B5CF6', // Geography - Purple
  '#EC4899', // Technology - Pink
];

export const playerColors = [
  '#EF5555', // Red
  '#4B92FF', // Blue  
  '#20C991', // Green
  '#F5AE1B', // Yellow
  '#9B6CF6', // Purple
  '#FC59A9'  // Pink
];

export const playerAvatars = ['🦊', '🐻', '🐱', '🐸', '🦁', '🐼'];

export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createPlayer = (name: string, isHost: boolean = false): Player => {
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

export const assignPlayerAppearance = (player: Player, existingPlayers: Player[]): Player => {
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

export const getRandomQuestion = (usedQuestionIds: string[] = []): Question => {
  const availableQuestions = allQuestions.filter(q => !usedQuestionIds.includes(q.id));
  
  if (availableQuestions.length === 0) {
    // If all questions used, reset and use all questions
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

// addPointsToPlayer removed – scoring no longer used

// processChanceEvent deprecated (scoring & board removed)

// checkWinCondition deprecated – server handles win by category completion or elimination

export const getNextPlayer = (gameState: GameState): number => {
  return (gameState.currentPlayerIndex + 1) % gameState.players.length;
};
