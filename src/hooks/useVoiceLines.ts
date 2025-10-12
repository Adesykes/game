import { useCallback } from 'react';

type VoiceLineType =
  | 'correct_basic'
  | 'correct_streak'
  | 'correct_mastery'
  | 'wrong_basic'
  | 'wrong_epic'
  | 'lightning_win'
  | 'lightning_elimination'
  | 'forfeit_shot'
  | 'forfeit_charade'
  | 'forfeit_pictionary'
  | 'guess_correct';

interface VoiceLine {
  text: string;
  style: 'excited' | 'mocking' | 'dramatic' | 'celebratory' | 'ominous';
}

const voiceLines: Record<VoiceLineType, VoiceLine[]> = {
  correct_basic: [
    { text: "Nice one!", style: 'celebratory' },
    { text: "Good job!", style: 'celebratory' },
    { text: "Correct!", style: 'excited' },
    { text: "Well done!", style: 'celebratory' }
  ],
  correct_streak: [
    { text: "On fire!", style: 'excited' },
    { text: "Unstoppable!", style: 'excited' },
    { text: "Keep it going!", style: 'celebratory' },
    { text: "You're on a roll!", style: 'excited' }
  ],
  correct_mastery: [
    { text: "Master level achieved!", style: 'dramatic' },
    { text: "You're a legend!", style: 'celebratory' },
    { text: "Category expert!", style: 'excited' },
    { text: "Absolute mastery!", style: 'dramatic' }
  ],
  wrong_basic: [
    { text: "Wrong!", style: 'mocking' },
    { text: "Nope!", style: 'mocking' },
    { text: "Incorrect!", style: 'mocking' },
    { text: "Try again!", style: 'mocking' }
  ],
  wrong_epic: [
    { text: "Thick as fuck!", style: 'mocking' },
    { text: "Epic fail!", style: 'mocking' },
    { text: "What a spaz!", style: 'mocking' },
    { text: "FFS loser!", style: 'mocking' },
    { text: "OMG how thick!", style: 'mocking' },
    { text: "Retard!", style: 'mocking' },
    { text: "Cabbage!", style: 'mocking' }
  ],
  lightning_win: [
    { text: "Lightning champion!", style: 'dramatic' },
    { text: "Speed demon!", style: 'excited' },
    { text: "Too fast for them!", style: 'celebratory' },
    { text: "Lightning victory!", style: 'dramatic' }
  ],
  lightning_elimination: [
    { text: "Eliminated!", style: 'ominous' },
    { text: "Out of the game!", style: 'ominous' },
    { text: "Sudden death!", style: 'dramatic' },
    { text: "Game over for you!", style: 'ominous' }
  ],
  forfeit_shot: [
    { text: "Bottoms up!", style: 'excited' },
    { text: "Drink up!", style: 'celebratory' },
    { text: "Time for a shot!", style: 'excited' },
    { text: "Cheers!", style: 'celebratory' }
  ],
  forfeit_charade: [
    { text: "Act it out!", style: 'excited' },
    { text: "Show us!", style: 'celebratory' },
    { text: "Charades time!", style: 'excited' },
    { text: "Get acting!", style: 'celebratory' }
  ],
  forfeit_pictionary: [
    { text: "Draw it!", style: 'excited' },
    { text: "Get sketching!", style: 'celebratory' },
    { text: "Pictionary!", style: 'excited' },
    { text: "Show your art!", style: 'celebratory' }
  ],
  guess_correct: [
    { text: "You got it!", style: 'excited' },
    { text: "Correct guess!", style: 'celebratory' },
    { text: "Well guessed!", style: 'excited' },
    { text: "Spot on!", style: 'celebratory' }
  ]
};

export const useVoiceLines = () => {
  const speak = useCallback((text: string, style: VoiceLine['style'] = 'excited') => {
    // Check if speech synthesis is available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice based on style
      switch (style) {
        case 'excited':
          utterance.rate = 1.2;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          break;
        case 'mocking':
          utterance.rate = 0.9;
          utterance.pitch = 0.9;
          utterance.volume = 0.9;
          break;
        case 'dramatic':
          utterance.rate = 0.8;
          utterance.pitch = 0.7;
          utterance.volume = 1.0;
          break;
        case 'celebratory':
          utterance.rate = 1.1;
          utterance.pitch = 1.2;
          utterance.volume = 0.9;
          break;
        case 'ominous':
          utterance.rate = 0.7;
          utterance.pitch = 0.6;
          utterance.volume = 0.8;
          break;
      }

      // Try to use a realistic human-like voice if available
      const voices = speechSynthesis.getVoices();
      const humanVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('aria online') ||
        voice.name.toLowerCase().includes('jenny online') ||
        voice.name.toLowerCase().includes('zira online') ||
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      );

      if (humanVoice) {
        utterance.voice = humanVoice;
      }

      speechSynthesis.speak(utterance);
    }
  }, []);

  const getRandomVoiceLine = useCallback((type: VoiceLineType): VoiceLine => {
    const lines = voiceLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
  }, []);

  const playVoiceLine = useCallback((type: VoiceLineType) => {
    const voiceLine = getRandomVoiceLine(type);
    speak(voiceLine.text, voiceLine.style);
    return voiceLine;
  }, [getRandomVoiceLine, speak]);

  return {
    speak,
    getRandomVoiceLine,
    playVoiceLine
  };
};