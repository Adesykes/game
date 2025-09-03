import React from 'react';
import { Player, BoardSquare } from '../types/game';
import { HelpCircle, Zap, Play } from 'lucide-react';
import { questionCategories } from '../data/questions';
import { categoryColors } from '../utils/gameLogic';

interface GameBoardProps {
  board: BoardSquare[];
  players: Player[];
  currentPlayerIndex: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, players, currentPlayerIndex }) => {
  const getSquareIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="w-4 h-4 text-white" />;
      case 'chance':
        return <Zap className="w-4 h-4 text-white" />;
      case 'start':
        return <Play className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  const getPlayersAtPosition = (position: number) => {
    return players.filter(p => p.position === position);
  };

  const renderSquare = (square: BoardSquare) => {
    const playersHere = getPlayersAtPosition(square.id);
    const isCurrentPlayerPosition = players[currentPlayerIndex]?.position === square.id;
    let categoryAbbreviation = '';
    if (!square.category || typeof square.category !== 'string') {
      categoryAbbreviation = '';
    } else if (square.category === 'Chance') {
      categoryAbbreviation = 'CH';
    } else if (square.category === 'Start') {
      categoryAbbreviation = 'GO';
    } else {
      categoryAbbreviation = square.category.substring(0, 2).toUpperCase();
    }

    let borderColor = 'border-white/30';
    let bgOpacity = 'bg-opacity-30';
    let bgColor = square.color;
    let ownerColor = '';
    if (square.ownedBy) {
      const owner = players.find(p => p.id === square.ownedBy);
      if (owner) {
        borderColor = `border-[${owner.color}]`;
        bgOpacity = 'bg-opacity-100';
        ownerColor = owner.color;
        // Always show the category color for owned squares
        bgColor = square.color;
      }
    }

    return (
      <div
        key={square.id}
        className={`relative border-2 rounded-lg transition-all flex flex-col items-center justify-between aspect-square min-w-0 min-h-0 overflow-hidden ${borderColor} ${bgOpacity} ${isCurrentPlayerPosition ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}`}
        style={{ backgroundColor: bgColor }}
      >
        {/* Square Icon */}
        <div className="absolute top-1 left-1">
          {getSquareIcon(square.type)}
        </div>
        {/* Square Number */}
        <div className="absolute top-1 right-1 text-xs text-white/80">
          {square.id}
        </div>
        {/* Category Name */}
        <div className="w-full text-center text-xs font-bold text-white mt-auto mb-1">
          {categoryAbbreviation}
        </div>
        {/* Players on this square */}
        {playersHere.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-wrap justify-center">
              {playersHere.map((player) => (
                <span
                  key={player.id}
                  className={`text-lg ${playersHere.length > 2 ? 'text-sm' : ''}`}
                  style={{ filter: player.id === players[currentPlayerIndex]?.id ? 'drop-shadow(0 0 8px #fbbf24)' : 'none' }}
                >
                  {player.avatar}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Ownership Indicator */}
        {square.ownedBy && (
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            <div className="w-4 h-4 rounded-full mb-1 border-2 border-white" style={{ backgroundColor: ownerColor }} title="Owned" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-10 grid-rows-4 gap-2 aspect-[2.5/1] bg-white/5 rounded-xl p-4">
        {board.map(square => renderSquare(square))}
      </div>
      {/* Board Legend */}
      <div className="mt-4 grid grid-cols-3 md:grid-cols-7 gap-2 text-sm">
        {questionCategories.map((category, index) => (
          <div key={category} className="flex items-center space-x-2 text-white/80">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[index] }} />
            <span>{category}</span>
          </div>
        ))}
        <div className="flex items-center space-x-2 text-white/80">
          <Zap className="w-4 h-4 text-orange-400" />
          <span>Chance</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;