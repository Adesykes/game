import React from 'react';
import { Question } from '../types/game';

interface QuestionOverlayProps {
  question: Question;
  isMyTurn: boolean;
  onSubmit: (answerIndex: number) => void;
}

const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, isMyTurn, onSubmit }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);

  const handleSubmit = (answerIndex: number) => {
    if (!isMyTurn) return;
    setSelectedAnswer(answerIndex);
    onSubmit(answerIndex);
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">{question.category}</h2>
        <p className="text-lg mb-6">{question.question}</p>
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(index)}
              disabled={!isMyTurn || selectedAnswer !== null}
              className={`p-4 rounded-lg text-left transition-colors ${
                selectedAnswer === index
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionOverlay;
