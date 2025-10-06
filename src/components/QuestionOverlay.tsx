import React from 'react';
import { Question } from '../types/game';
import { Socket } from 'socket.io-client';

interface QuestionOverlayProps {
  question: Question;
  isMyTurn: boolean;
  onSubmit: (answerIndex: number) => void;
  socket: Socket;
  lifelines: {
    fiftyFifty: number;
    passToRandom: number;
  };
  powerUps: {
    swap_question: number;
    steal_category: number;
  };
  playerId: string;
  roomCode: string;
}

const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, isMyTurn, onSubmit, socket, lifelines, powerUps, playerId, roomCode }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Reset when question changes
    setSelectedAnswer(null);
  }, [question]);

  const handleSubmit = (answerIndex: number) => {
    if (!isMyTurn || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    onSubmit(answerIndex);
  };

  const handleFiftyFifty = () => {
    if (!isMyTurn || lifelines.fiftyFifty <= 0) return;
    socket.emit('use-lifeline-fifty-fifty', roomCode, playerId);
  };

  const handlePassToRandom = () => {
    if (!isMyTurn || lifelines.passToRandom <= 0) return;
    socket.emit('use-lifeline-pass-to-random', roomCode, playerId);
  };

  const handleSwapQuestion = () => {
    if (!isMyTurn || powerUps.swap_question <= 0) return;
    socket.emit('powerup-swap-question', roomCode, playerId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">{question.category}</h2>
        <p className="text-lg mb-6 text-white">{question.question}</p>
        
        {/* Lifelines and Power-ups */}
        {isMyTurn && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={handleFiftyFifty}
                disabled={lifelines.fiftyFifty <= 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                50/50 ({lifelines.fiftyFifty})
              </button>
              <button
                onClick={handlePassToRandom}
                disabled={lifelines.passToRandom <= 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pass to Random ({lifelines.passToRandom})
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSwapQuestion}
                disabled={powerUps.swap_question <= 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Swap Question ({powerUps.swap_question})
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(index)}
              disabled={!isMyTurn || selectedAnswer !== null}
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
        {selectedAnswer !== null && (
          <div className="mt-4 text-center">
            <p className="text-white/70">Answer submitted! Waiting for result...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionOverlay;
