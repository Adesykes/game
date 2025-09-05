import { Player, GameState, Question } from '../types/game';
import { allQuestions, questionCategories } from '../data/questions';
import { getRandomChanceEvent } from '../data/chanceEvents';

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
    score: 0,
    lives: 3, // Initialize with 3 lives
    isHost,
    isEliminated: false,
    categoryScores: {}, // Initialize empty category scores
    lockedCategories: [], // Initialize empty locked categories
    recentCategories: [] // Initialize empty recent categories
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

export const addPointsToPlayer = (gameState: GameState, playerId: string, points: number): GameState => {
  const newGameState = { ...gameState };
  const playerIndex = newGameState.players.findIndex(p => p.id === playerId);
  
  if (playerIndex !== -1) {
    newGameState.players[playerIndex] = {
      ...newGameState.players[playerIndex],
      score: Math.max(0, newGameState.players[playerIndex].score + points)
    };
  }
  
  return newGameState;
};

export const processChanceEvent = (gameState: GameState, playerId: string) => {
  const event = getRandomChanceEvent();
  let newGameState = { ...gameState };
  
  switch (event.type) {
    case 'move':
      // Since we don't have a board, we can convert 'move' to points
      newGameState = addPointsToPlayer(newGameState, playerId, event.value * 10);
      break;
    case 'points':
      newGameState = addPointsToPlayer(newGameState, playerId, event.value);
      break;
    case 'skip':
      // Skip logic would be handled in the main game loop
      break;
  }
  
  return { gameState: newGameState, event };
};

export const checkWinCondition = (gameState: GameState): Player | null => {
  // Win by max rounds reached - highest score wins
  if (gameState.round >= gameState.maxRounds) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    return sortedPlayers[0];
  }
  
  return null;
};

export const getNextPlayer = (gameState: GameState): number => {
  return (gameState.currentPlayerIndex + 1) % gameState.players.length;
};
