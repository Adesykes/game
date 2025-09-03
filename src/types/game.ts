export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  lives: number; // Players start with 3 lives
  isHost: boolean;
  isEliminated: boolean; // True when player has lost all lives
  categoryScores: Record<string, number>; // Points per category
  charadeCount?: number; // Tracks how many charades the player has performed
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
  gamePhase: 'waiting' | 'category_selection' | 'question' | 'forfeit' | 'charade_guessing' | 'finished';
  winner: Player | null;
  round: number;
  currentForfeit: Forfeit | null;
  charadeSolution: string | null; // The word/phrase being acted out
  charadeSolved: boolean;
}

// No longer using board squares or chance events
export interface CategorySelection {
  playerId: string;
  category: string;
}

export interface Forfeit {
  id: string;
  type: 'charade' | 'shot';
  description: string;
  wordToAct: string | null; // The word or phrase to act out (null for non-charade forfeits)
}

export interface AnswerResult {
  playerId: string;
  answerIndex: number;
  isCorrect: boolean;
  points: number;
  correctAnswer: number;
}