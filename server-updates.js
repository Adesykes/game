// Add this event handler to the socket.io connection handler in server.cjs

socket.on('select-category', (roomCode, playerId, category) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  const gameState = room.gameState;
  if (gameState.gamePhase !== 'category_selection') return;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return;

  // Get a random question from the selected category
  const categoryQuestions = allQuestions.filter(q => 
    q.category.toLowerCase() === category.toLowerCase() && 
    !room.usedQuestionIds.includes(q.id)
  );
  
  let question;
  if (categoryQuestions.length > 0) {
    question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
  } else {
    // If all questions from category are exhausted, pick any question from that category
    const allCategoryQuestions = allQuestions.filter(q => 
      q.category.toLowerCase() === category.toLowerCase()
    );
    question = allCategoryQuestions[Math.floor(Math.random() * allCategoryQuestions.length)];
  }
  
  // Mark question as used to avoid repeats
  if (question) {
    room.usedQuestionIds.push(question.id);
  }
  
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
      gameState.gamePhase = 'forfeit';
      
      // Get a random forfeit
      const forfeit = getRandomForfeit();
      gameState.currentForfeit = forfeit;
      
      io.to(roomCode).emit('answer-submitted', {
        playerId: currentPlayer.id,
        isCorrect: false,
        correctAnswer,
        gameState
      });
    }
  }, timeoutMs);
  
  questionTimeouts.set(roomCode, handle);
});

// Function to get a random forfeit
function getRandomForfeit() {
  const forfeits = require('./server_data/forfeits.cjs').forfeits;
  return forfeits[Math.floor(Math.random() * forfeits.length)];
}
