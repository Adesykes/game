import React from 'react';
import { Player } from '../types/game';
import { Heart, ThumbsUp, SkipForward, Shuffle, Theater } from 'lucide-react';

interface PlayerCategoryScoresProps {
  players: Player[];
  currentPlayerIndex?: number;
  requiredLevel?: number;
  showCategoryNames?: boolean;
  compact?: boolean;
}

const PlayerCategoryScores: React.FC<PlayerCategoryScoresProps> = ({
  players,
  currentPlayerIndex = -1,
  requiredLevel = 1,
  showCategoryNames = true,
  compact = false,
}) => {
  // Get all unique category keys across all players
  const allCategories = Array.from(
    new Set(
      players.flatMap(player => 
        player.categoryScores ? Object.keys(player.categoryScores) : []
      )
    )
  ).sort();

  // Initial values for each lifeline/powerup
  const INITIAL_FIFTY_FIFTY = 2;
  const INITIAL_PASS_TO_RANDOM = 2;
  const INITIAL_SWAP_QUESTION = 2;

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full ${compact ? 'text-xs' : 'text-sm'}`}>
        <thead>
          <tr className="border-b border-white/10">
            <th className={`text-left font-bold text-white/80 py-2 ${compact ? 'px-1' : 'px-3'}`}>Player</th>
            {showCategoryNames && allCategories.map(category => (
              <th key={category} className={`text-center font-bold text-yellow-400/80 py-2 ${compact ? 'px-1' : 'px-3'}`}>
                {category}
              </th>
            ))}
            {!showCategoryNames && (
              <th className={`text-center font-bold text-yellow-400/80 py-2 ${compact ? 'px-1' : 'px-3'}`}>
                Categories
              </th>
            )}
            <th className={`text-center font-bold text-red-400/80 py-2 ${compact ? 'px-1' : 'px-3'}`}>Lives</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            // Count how many categories this player has at the required level
            const completedCategories = allCategories.filter(
              category => (player.categoryScores?.[category] || 0) >= requiredLevel
            ).length;
            const totalCategories = allCategories.length;
            const progressPercent = totalCategories > 0 
              ? (completedCategories / totalCategories) * 100 
              : 0;
            
            return (
              <tr key={player.id} className={`
                ${player.isEliminated ? 'opacity-50' : ''}
                ${index === currentPlayerIndex ? 'bg-white/10' : ''}
                ${index % 2 === 0 ? 'bg-black/10' : ''}
                border-b border-white/10 hover:bg-white/5 transition-colors
              `}>
                <td className={`py-2 ${compact ? 'px-1' : 'px-3'}`}>
                  <div className="flex items-center">
                    <span className="mr-2">{player.avatar}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className={`font-medium ${player.isHost ? 'text-yellow-400' : 'text-white'} ${player.isEliminated ? 'line-through' : ''}`}>
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span className="ml-1.5 text-xs text-yellow-400 opacity-60">
                            (Host)
                          </span>
                        )}
                      </div>
                      
                      {/* Display badges for charades and used lifelines/powerups */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {/* Only show charade badge if they've done 2 or more */}
                        {(player.charadeCount && player.charadeCount >= 2) && (
                          <span 
                            className="bg-pink-600/30 text-pink-300 text-xs px-1.5 py-0.5 rounded flex items-center"
                            title={`${player.name} has performed ${player.charadeCount} charades/pictionary`}
                          >
                            <Theater className="w-3 h-3 mr-0.5" />
                            {player.charadeCount}
                          </span>
                        )}
                        
                        {/* 50/50 lifeline */}
                        {INITIAL_FIFTY_FIFTY - (player.lifelines?.fiftyFifty || 0) > 0 && (
                          <span 
                            className="bg-purple-600/30 text-purple-300 text-xs px-1.5 py-0.5 rounded flex items-center"
                            title={`${player.name} has used ${INITIAL_FIFTY_FIFTY - player.lifelines.fiftyFifty} 50/50 lifelines`}
                          >
                            <ThumbsUp className="w-3 h-3 mr-0.5" />
                            {INITIAL_FIFTY_FIFTY - player.lifelines.fiftyFifty}
                          </span>
                        )}
                        
                        {/* Pass to Random lifeline */}
                        {INITIAL_PASS_TO_RANDOM - (player.lifelines?.passToRandom || 0) > 0 && (
                          <span 
                            className="bg-orange-600/30 text-orange-300 text-xs px-1.5 py-0.5 rounded flex items-center"
                            title={`${player.name} has used ${INITIAL_PASS_TO_RANDOM - player.lifelines.passToRandom} Pass to Random lifelines`}
                          >
                            <SkipForward className="w-3 h-3 mr-0.5" />
                            {INITIAL_PASS_TO_RANDOM - player.lifelines.passToRandom}
                          </span>
                        )}
                        
                        {/* Question Swap powerup */}
                        {INITIAL_SWAP_QUESTION - (player.powerUps?.swap_question || 0) > 0 && (
                          <span 
                            className="bg-red-600/30 text-red-300 text-xs px-1.5 py-0.5 rounded flex items-center"
                            title={`${player.name} has used ${INITIAL_SWAP_QUESTION - player.powerUps.swap_question} Question Swaps`}
                          >
                            <Shuffle className="w-3 h-3 mr-0.5" />
                            {INITIAL_SWAP_QUESTION - player.powerUps.swap_question}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                
                {showCategoryNames ? (
                  // Show individual category scores
                  allCategories.map(category => (
                    <td key={category} className={`text-center ${compact ? 'px-1' : 'px-3'} py-2`}>
                      <span className={`
                        inline-flex justify-center items-center 
                        w-6 h-6 rounded-full
                        ${(player.categoryScores?.[category] || 0) >= requiredLevel
                          ? 'bg-green-500 text-white'
                          : (player.categoryScores?.[category] || 0) > 0
                            ? 'bg-yellow-500/30 text-yellow-300'
                            : 'bg-white/10 text-white/30'
                        }
                        font-medium text-xs
                      `}>
                        {player.categoryScores?.[category] || 0}
                      </span>
                    </td>
                  ))
                ) : (
                  // Show progress bar for all categories combined
                  <td className={`${compact ? 'px-1' : 'px-3'} py-2`}>
                    <div className="flex items-center">
                      <div className="flex-1 bg-white/10 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-xs whitespace-nowrap">
                        {completedCategories}/{totalCategories}
                      </span>
                    </div>
                  </td>
                )}
                
                <td className={`text-center ${compact ? 'px-1' : 'px-3'} py-2`}>
                  <div className="flex items-center justify-center text-red-400">
                    <Heart className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                    <span>{player.lives}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerCategoryScores;