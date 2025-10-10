export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  lives: number; // Players start with 3 lives
  isHost: boolean;
  isEliminated: boolean; // True when player has lost all lives
  categoryScores: Record<string, number>; // Points per category
  charadeCount?: number; // Tracks how many charades the player has performed
  lockedCategories: string[]; // Categories locked until player selects 3 different categories
  recentCategories: string[]; // Last 3 categories selected by this player
  isReady?: boolean; // Player has pressed Ready on pre-game screen
  // Dynamic difficulty scaling fields
  currentStreak?: number; // Current correct answers in a row
  bestStreak?: number; // Best streak achieved
  totalAnswers?: number; // Total questions answered
  correctAnswers?: number; // Total correct answers
  difficultyAccuracy?: Record<'easy' | 'medium' | 'hard', { correct: number; total: number }>; // Performance by difficulty
  categoryAccuracy?: Record<string, { correct: number; total: number }>; // Performance by category
  categoryMastery?: Record<string, 'novice' | 'intermediate' | 'expert'>; // Mastery level per category
  lifelines: {
    fiftyFifty: number;
    passToRandom: number;
  };
  powerUps: {
    swap_question: number;
    steal_category: number;
  };
  powerBar: number; // 0-100, starts at 50, affects sabotage availability
  hasSabotage?: boolean; // Whether player has sabotage ability available
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
  gamePhase: 'waiting' | 'ready_check' | 'category_selection' | 'question' | 'forfeit' | 'charade_guessing' | 'pictionary_drawing' | 'karaoke_voting' | 'karaoke_break' | 'lightning_round' | 'finished';
  // During server-scheduled turn transitions, categories should be hidden until this timestamp (ms since epoch)
  turnCooldownUntil?: number;
  allReady?: boolean; // Flag when all players pressed ready
  winner: Player | null;
  round: number;
  maxRounds: number; // Maximum number of rounds before game ends
  currentForfeit: Forfeit | null;
  charadeSolution: string | null; // The word/phrase being acted out
  charadeSolved: boolean;
  pictionarySolution: string | null; // The word/phrase being drawn
  pictionarySolved: boolean;
  drawingData: string | null; // Base64 encoded drawing data
  tongueTwisterDeadline?: number | null; // When the current tongue twister forfeit ends
  globalLockedCategories: string[]; // Categories locked globally for all players
  globalRecentCategories: string[]; // Last 3 categories selected globally
  currentKaraokeSong?: KaraokeSong | null; // Active karaoke selection
  karaokeBreakCount?: number; // Number of karaoke breaks triggered
  karaokeSettings?: KaraokeSettings; // Host-adjustable settings
  karaokeStartAt?: number; // Server timestamp when current karaoke break started
  karaokeVotingOptions?: KaraokeSong[]; // 6 song options for voting
  karaokeVotes?: { [playerId: string]: number[] }; // Player votes (indices of two chosen songs)
  karaokeVotingEndAt?: number; // When voting ends
  // Lightning round fields
  lightningActive?: boolean;
  lightningQuestion?: Question | null;
  lightningEndAt?: number | null;
  lightningWinnerId?: string | null;
  lightningMode?: 'normal' | 'sudden_death'; // Mode for lightning round
  lightningAnsweredPlayers?: string[]; // Players who have already answered this round
  lightningQuestionId?: string | null; // Unique ID for current lightning question
  lightningAcceptingAnswers?: boolean; // Whether server is currently accepting answers
  lightningSubmissions?: Record<string, { answerIndex: number; timestamp: number }>; // Track submissions per player
  turnsPlayed?: number; // global turn counter
}

// No longer using board squares or chance events
export interface CategorySelection {
  playerId: string;
  category: string;
}

export interface Forfeit {
  id: string;
  type: 'charade' | 'pictionary' | 'shot' | 'tongue_twister';
  description: string;
  wordToAct: string | null; // The word or phrase to act out or draw (null for non-charade forfeits)
  tongueTwister?: string | null; // The tongue twister to recite (for tongue_twister forfeits)
}

export interface KaraokeSong {
  title: string;
  artist?: string;
  alexaPhrase: string; // Phrase to speak for Alexa ("<title> by <artist>")
  difficulty?: 'easy' | 'medium' | 'hard';
  durationHintSec?: number; // Suggested sing time
}

export interface KaraokeSettings {
  probability: number; // 0-1 probability after eligible events
  durationSec: number; // Duration of karaoke break
  cooldownSec: number; // Minimum seconds between karaoke breaks
  lastTriggeredAt?: number; // server timestamp last triggered
}

export interface AnswerResult {
  playerId: string;
  answerIndex: number;
  isCorrect: boolean;
  correctAnswer: number;
  categoryLocked?: string; // Category that was locked after correct answer
  lockedCategories?: string[]; // All categories currently locked for this player
  recentCategories?: string[]; // Categories recently selected by this player
  categoryLockMessage?: string; // Message explaining category locking rules
}