import { Player, GameState, BoardSquare, Question } from '../types/game';
import { allQuestions, questionCategories } from '../data/questions';
import { getRandomChanceEvent } from '../data/chanceEvents';

export const BOARD_SIZE = 40; // Monopoly-style board has 40 squares
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

// Function to get category for a specific position
export const getCategoryForPosition = (position: number): string => {
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
export const getColorForCategory = (category: string): string => {
  const index = questionCategories.indexOf(category);
  if (index !== -1) {
    return categoryColors[index];
  }
  return '#FFFFFF'; // Default white
};

export const generateBoard = (): BoardSquare[] => {
  const board: BoardSquare[] = [];
  
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
    position: 0,
    isHost,
    categoryProgress: {} // Initialize empty category progress tracking
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

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const movePlayer = (gameState: GameState, playerId: string, spaces: number): GameState => {
  const newGameState = { ...gameState };
  const playerIndex = newGameState.players.findIndex(p => p.id === playerId);
  
  if (playerIndex !== -1) {
    const newPosition = Math.max(0, Math.min(BOARD_SIZE - 1, newGameState.players[playerIndex].position + spaces));
    newGameState.players[playerIndex] = {
      ...newGameState.players[playerIndex],
      position: newPosition
    };
  }
  
  return newGameState;
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
      newGameState = movePlayer(newGameState, playerId, event.value);
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
  // Win by reaching the end
  const finishedPlayer = gameState.players.find(p => p.position >= BOARD_SIZE - 1);
  if (finishedPlayer) return finishedPlayer;
  
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