export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  position: number; // Player's position on the board
  lives: number; // Players start with 3 lives
  isHost: boolean;
  isEliminated: boolean; // True when player has lost all lives
  categoryScores: Record<string, number>; // Points per category
  charadeCount?: number; // Tracks how many charades the player has performed
  lockedCategories: string[]; // Categories locked until player selects 3 different categories
  recentCategories: string[]; // Last 3 categories selected by this player
}

export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  currentQuestion: Question | null;
  selectedCategory: string | null; // Currently selected category
  gamePhase: 'waiting' | 'category_selection' | 'question' | 'forfeit' | 'charade_guessing' | 'pictionary_drawing' | 'finished';
  winner: Player | null;
  round: number;
  maxRounds: number; // Maximum number of rounds before game ends
  currentForfeit: Forfeit | null;
  charadeSolution: string | null; // The word/phrase being acted out
  charadeSolved: boolean;
  pictionarySolution: string | null; // The word/phrase being drawn
  pictionarySolved: boolean;
  drawingData: string | null; // Base64 encoded drawing data
  globalLockedCategories: string[]; // Categories locked globally for all players
  globalRecentCategories: string[]; // Last 3 categories selected globally
}

// No longer using board squares or chance events
export interface CategorySelection {
  playerId: string;
  category: string;
}

export interface Forfeit {
  id: string;
  type: 'charade' | 'pictionary' | 'shot';
  description: string;
  wordToAct: string | null; // The word or phrase to act out or draw (null for non-charade forfeits)
}

export interface AnswerResult {
  playerId: string;
  answerIndex: number;
  isCorrect: boolean;
  points: number;
  correctAnswer: number;
  categoryLocked?: string; // Category that was locked after correct answer
  lockedCategories?: string[]; // All categories currently locked for this player
  recentCategories?: string[]; // Categories recently selected by this player
  categoryLockMessage?: string; // Message explaining category locking rules
}