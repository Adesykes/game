import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';

export const useGameEvents = (
  socket: Socket | null,
  setGameState: (gameState: GameState | null) => void
) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [charadeDeadline, setCharadeDeadline] = useState<number | null>(null);
  const [pictionaryDeadline, setPictionaryDeadline] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onPlayerJoined = ({ gameState }: { gameState: GameState }) => setGameState(gameState);
    const onGameStarted = ({ gameState }: { gameState: GameState }) => {
      setGameState(gameState);
    };

    // Added explicit handler for game state updates
    const onGameStateUpdate = ({ gameState, message }: { gameState: GameState, message?: string }) => {
      console.log(`[client] game-state-update received: ${message || 'No message'}`);
      setGameState(gameState);
      setCharadeDeadline(null); // Reset charade deadline on state updates
      setPictionaryDeadline(null); // Reset pictionary deadline on state updates
    };

    const onNextTurn = ({ gameState }: { gameState: GameState }) => {
      console.log('[client] next-turn received, updating game state');
      console.log(`[client] next-turn: gamePhase=${gameState.gamePhase}, currentPlayerIndex=${gameState.currentPlayerIndex}, currentPlayer=${gameState.players[gameState.currentPlayerIndex]?.name} (${gameState.players[gameState.currentPlayerIndex]?.id})`);
      console.log(`[client] My socket ID: ${socket.id}`);
      setGameState(gameState);
      setCurrentQuestion(null);
      setAnswerResult(null);
      setCharadeDeadline(null);
      setPictionaryDeadline(null);
    };

    const onCategorySelected = ({ question, gameState }: { question: Question; gameState: GameState }) => {
      setGameState(gameState);
      setCurrentQuestion(question);
    };

    const onAnswerSubmitted = ({ 
      gameState, 
      isCorrect,
      playerId,
      correctAnswer,
      categoryLocked,
      lockedCategories,
      recentCategories,
      categoryLockMessage
    }: { 
      gameState: GameState;
      isCorrect: boolean;
      playerId: string;
      correctAnswer: number;
      categoryLocked?: string;
      lockedCategories?: string[];
      recentCategories?: string[];
      categoryLockMessage?: string;
    }) => {
      console.log(`[client] answer-submitted by ${playerId}, isCorrect: ${isCorrect}`);
      
      // Update game state first
      setGameState(gameState);
      
      // Set answer result for feedback with category locking info
      setAnswerResult({ 
        playerId, 
        answerIndex: -1, // Not needed for this implementation
        isCorrect, 
        correctAnswer: correctAnswer ?? currentQuestion?.correctAnswer ?? 0, 
        points: isCorrect ? 100 : 0,
        categoryLocked,
        lockedCategories: lockedCategories || [],
        recentCategories: recentCategories || [],
        categoryLockMessage
      });
      
      // Only reset current question for incorrect answers initially
      // For correct answers, we'll clear it on next-turn or game-state-update
      if (!isCorrect) {
        setCurrentQuestion(null);
      } else {
        console.log('[client] Correct answer - waiting for turn advancement');
        // Add a backup timer to clear the question if we don't get a turn update
        setTimeout(() => {
          setCurrentQuestion(null);
        }, 2000);
      }
    };
    
    const onCharadeStarted = ({ gameState, deadline }: { gameState: GameState, deadline?: number }) => {
      console.log('[client] charade-started deadline:', deadline);
      setGameState(gameState);
      setCharadeDeadline(typeof deadline === 'number' ? deadline : null);
    };
    
    const onCharadeSolved = ({ gameState, solverId }: { gameState: GameState, solverId: string }) => {
      console.log('[client] charade-solved by:', solverId);
      setGameState(gameState);
      setCharadeDeadline(null);
    };
    
    const onCharadeFailed = ({ gameState, playerId }: { gameState: GameState, playerId: string }) => {
      console.log('[client] charade-failed by:', playerId);
      setGameState(gameState);
      setCharadeDeadline(null);
    };

    const onPictionaryStarted = ({ gameState, deadline }: { gameState: GameState, deadline?: number }) => {
      console.log('[client] pictionary-started deadline:', deadline);
      setGameState(gameState);
      setPictionaryDeadline(typeof deadline === 'number' ? deadline : null);
    };
    
    const onPictionarySolved = ({ gameState, solverId }: { gameState: GameState, solverId: string }) => {
      console.log('[client] pictionary-solved by:', solverId);
      setGameState(gameState);
      setPictionaryDeadline(null);
    };
    
    const onPictionaryFailed = ({ gameState, playerId }: { gameState: GameState, playerId: string }) => {
      console.log('[client] pictionary-failed by:', playerId);
      setGameState(gameState);
      setPictionaryDeadline(null);
    };

    const onDrawingUpdate = ({ gameState }: { gameState: GameState }) => {
      setGameState(gameState);
    };

    const onGameFinished = ({ gameState }: { gameState: GameState }) => {
      setGameState(gameState);
      setCharadeDeadline(null);
      setPictionaryDeadline(null);
    };
    
    const onForfeitCompleted = ({ gameState, forfeitType }: { gameState: GameState, forfeitType: string }) => {
      console.log(`[client] forfeit-completed of type: ${forfeitType}`);
      setGameState(gameState);
      setCharadeDeadline(null);
      setPictionaryDeadline(null);
    };

    const onCategoryLocked = ({ 
      category, 
      message, 
      lockedCategories, 
      recentCategories 
    }: { 
      category: string;
      message: string;
      lockedCategories: string[];
      recentCategories: string[];
    }) => {
      console.log(`[client] category-locked: ${category}`);
      // Show an alert to the user with detailed information
      const detailedMessage = `${message}\n\nLocked categories: ${lockedCategories.join(', ')}\nRecent categories: ${recentCategories.join(', ')} (${recentCategories.length}/3)`;
      alert(detailedMessage);
    };

    // Register event listeners
    socket.on('player-joined', onPlayerJoined);
    socket.on('game-started', (data) => {
      console.log('Game started event received:', data);
      onGameStarted(data);
    });
    socket.on('next-turn', onNextTurn);
    socket.on('category-selected', (data) => {
      console.log('Category selected event received:', data);
      onCategorySelected(data);
    });
    socket.on('answer-submitted', onAnswerSubmitted);
    socket.on('charade-started', onCharadeStarted);
    socket.on('charade-solved', onCharadeSolved);
    socket.on('charade-failed', onCharadeFailed);
    socket.on('pictionary-started', onPictionaryStarted);
    socket.on('pictionary-solved', onPictionarySolved);
    socket.on('pictionary-failed', onPictionaryFailed);
    socket.on('drawing-update', onDrawingUpdate);
    socket.on('forfeit-completed', onForfeitCompleted);
    socket.on('game-finished', onGameFinished);
    socket.on('game-state-update', onGameStateUpdate);
    socket.on('category-locked', onCategoryLocked);

    // Clean up
    return () => {
      socket.off('player-joined', onPlayerJoined);
      socket.off('game-started', onGameStarted);
      socket.off('next-turn', onNextTurn);
      socket.off('category-selected', onCategorySelected);
      socket.off('answer-submitted', onAnswerSubmitted);
      socket.off('charade-started', onCharadeStarted);
      socket.off('charade-solved', onCharadeSolved);
      socket.off('charade-failed', onCharadeFailed);
      socket.off('pictionary-started', onPictionaryStarted);
      socket.off('pictionary-solved', onPictionarySolved);
      socket.off('pictionary-failed', onPictionaryFailed);
      socket.off('drawing-update', onDrawingUpdate);
      socket.off('forfeit-completed', onForfeitCompleted);
      socket.off('game-finished', onGameFinished);
      socket.off('game-state-update', onGameStateUpdate);
      socket.off('category-locked', onCategoryLocked);
    };
  }, [socket, setGameState, currentQuestion]);

  return { currentQuestion, answerResult, charadeDeadline, pictionaryDeadline };
};
