import React from 'react';
import { Question } from '../types/game';
import { Socket } from 'socket.io-client';

interface QuestionOverlayProps {
  question: Question;
  isMyTurn: boolean;
  onSubmit: (answerIndex: number) => void;
  socket: Socket;
}

const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, isMyTurn, onSubmit, socket }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showSecondChance, setShowSecondChance] = React.useState(false);

  React.useEffect(() => {
    // Reset when question changes
    setSelectedAnswer(null);
    setShowSecondChance(false);
  }, [question]);

  const handleSubmit = (answerIndex: number) => {
    if (!isMyTurn || (selectedAnswer !== null && !showSecondChance)) return;
    setSelectedAnswer(answerIndex);
    onSubmit(answerIndex);
  };

  // Listen for double chance power-up usage
  React.useEffect(() => {
    const handleDoubleChance = () => {
      setShowSecondChance(true);
      setSelectedAnswer(null); // Allow selecting again
    };

    socket.on('powerup-double-chance-used', handleDoubleChance);

    return () => {
      socket.off('powerup-double-chance-used', handleDoubleChance);
    };
  }, [socket]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">{question.category}</h2>
        <p className="text-lg mb-6 text-white">{question.question}</p>
        {showSecondChance && (
          <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <p className="text-yellow-300 font-bold">🎯 Second Chance! Try again.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(index)}
              disabled={!isMyTurn || (selectedAnswer !== null && !showSecondChance)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedAnswer === index
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-transparent'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="font-bold mr-2 text-yellow-400">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </div>
        {selectedAnswer !== null && !showSecondChance && (
          <div className="mt-4 text-center">
            <p className="text-white/70">Answer submitted! Waiting for result...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionOverlay;
