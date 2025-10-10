import React, { useEffect } from 'react';
import { Trophy, Users, Heart, BookOpen, Music, Globe, Dices, Utensils, Microscope, MonitorPlay } from 'lucide-react';

interface WelcomeScreenProps {
  onModeSelect: (mode: 'create' | 'join') => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onModeSelect }) => {
  console.log('WelcomeScreen component rendered');
  
  // Force clear localStorage on load to avoid persistence issues
  useEffect(() => {
    console.log('WelcomeScreen useEffect triggered');
    // Only clear if there's a saved app mode but we're on welcome screen
    // This means something went wrong with the navigation or state management
    if (localStorage.getItem('appMode') && 
        localStorage.getItem('appMode') !== 'welcome') {
      localStorage.clear();
      console.log("Cleared localStorage due to inconsistent state");
    }
  }, []);

  // Forced global music handled in App.tsx (removed local controls)

  // Restore preference
  useEffect(() => {
    // Clear any old preference keys since option removed
    localStorage.removeItem('ambientHaunting');
  }, []);


  const handleResetGame = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="text-8xl mb-6">🧠</div>
          <h1 className="text-5xl font-bold text-white mb-4">Drunk Games Night</h1>
          <p className="text-xl text-white/80 mb-8">
            Local multiplayer game for up to 6 players
          </p>
          <div className="mt-4 text-xs text-white/40 tracking-wide">Haunting soundtrack active</div>
          <div className="mt-1 text-xs text-white/60 tracking-wide">Question bank: <span className="text-yellow-300 font-semibold">1,652</span> questions across 10 categories</div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => onModeSelect('create')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            <Trophy className="w-8 h-8 mx-auto mb-3" />
            <div className="text-xl mb-2">Host Game</div>
            <div className="text-sm opacity-80">Create a new game room</div>
          </button>

          <button
            onClick={() => onModeSelect('join')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            <Users className="w-8 h-8 mx-auto mb-3" />
            <div className="text-xl mb-2">Join Game</div>
            <div className="text-sm opacity-80">Enter a room code</div>
          </button>
        </div>

        {/* Reset Button */}
        <div className="mb-6">
          <button
            onClick={handleResetGame}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Reset Game Data
          </button>
          <p className="text-xs text-white/60 mt-2">If you experience issues, click to clear saved data</p>
        </div>

        {/* Features */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">1. Join with QR Code</h3>
              <p className="text-white/70 text-sm">Scan the QR code or enter the room code on your device</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">2. Answer Questions</h3>
              <p className="text-white/70 text-sm">Answer correctly to earn points in all 10 categories</p>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">3. Stay Alive</h3>
              <p className="text-white/70 text-sm">Each player has 3 lives - wrong answers and failed charades cost a life!</p>
            </div>
          </div>
          
          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="font-bold text-white mb-3">Game Rules:</h3>
            <ul className="text-white/70 text-sm list-disc pl-5 space-y-2">
              <li>Each player starts with <span className="text-red-400">3 lives</span></li>
              <li>Wrong answers and failed charades cost one life</li>
              <li>Successfully guess another player's charade to earn an extra life</li>
              <li>Collect <span className="text-yellow-400">5 points</span> in each of the <span className="text-yellow-400">10 categories</span> to win</li>
              <li>Last player standing wins if all others are eliminated</li>
            </ul>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="font-bold text-white mb-3">Power Bar & Sabotage:</h3>
            <ul className="text-white/70 text-sm list-disc pl-5 space-y-2">
              <li>Everyone starts at <span className="text-yellow-300 font-semibold">50%</span> power</li>
              <li>Correct answers: <span className="text-green-300 font-semibold">+10%</span> • Wrong answers: <span className="text-red-300 font-semibold">-10%</span></li>
              <li>Reach <span className="text-yellow-300 font-semibold">100%</span> to unlock <span className="text-red-300 font-semibold">Sabotage</span></li>
              <li>Sabotage (during normal turns only): set a target’s power to <span className="font-semibold">0%</span> and they lose <span className="text-red-400 font-semibold">1 life</span>; your power resets to <span className="font-semibold">50%</span></li>
              <li>Sabotage is only available during category selection and question phases (not during forfeits or lightning round)</li>
            </ul>
          </div>
          
          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="font-bold text-white mb-3">Categories:</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="flex flex-col items-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span className="text-white/70 text-xs mt-1">History</span>
              </div>
              <div className="flex flex-col items-center">
                <Microscope className="w-5 h-5 text-green-400" />
                <span className="text-white/70 text-xs mt-1">Science</span>
              </div>
              <div className="flex flex-col items-center">
                <Dices className="w-5 h-5 text-red-400" />
                <span className="text-white/70 text-xs mt-1">Sports</span>
              </div>
              <div className="flex flex-col items-center">
                <MonitorPlay className="w-5 h-5 text-pink-400" />
                <span className="text-white/70 text-xs mt-1">Entertainment</span>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-white/70 text-xs mt-1">Geography</span>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="w-5 h-5 text-yellow-400" />
                <span className="text-white/70 text-xs mt-1">Technology</span>
              </div>
              <div className="flex flex-col items-center">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="text-white/70 text-xs mt-1">Music</span>
              </div>
              <div className="flex flex-col items-center">
                <Utensils className="w-5 h-5 text-orange-400" />
                <span className="text-white/70 text-xs mt-1">Food</span>
              </div>
              <div className="flex flex-col items-center">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <span className="text-white/70 text-xs mt-1">Literature</span>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="w-5 h-5 text-amber-400" />
                <span className="text-white/70 text-xs mt-1">Animals</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <button
              onClick={handleResetGame}
              className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              Reset Game Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;