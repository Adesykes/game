// This file contains the forfeit challenges used in the game
// Includes charades and special forfeits

// Forfeit types:
// - charade: Act out a word for others to guess
// - shot: Take a shot (triggered after multiple charades)

const charadesWords = [
  // Animals
  "elephant", "monkey", "giraffe", "kangaroo", "penguin", "octopus", "butterfly", 
  "crocodile", "dolphin", "flamingo",
  
  // Actions
  "swimming", "dancing", "skiing", "cooking", "painting", "fishing", "juggling", 
  "surfing", "knitting", "gardening",
  
  // Jobs/Roles
  "firefighter", "chef", "teacher", "astronaut", "doctor", "pirate", "superhero", 
  "police officer", "artist", "scientist",
  
  // Objects
  "telephone", "umbrella", "toothbrush", "camera", "laptop", "scissors", "guitar", 
  "helicopter", "basketball", "microwave",
  
  // Places
  "beach", "library", "airport", "restaurant", "zoo", "hospital", "amusement park", 
  "mountain", "farm", "supermarket",
  
  // Emotions
  "excited", "scared", "confused", "bored", "surprised", "exhausted", "disappointed",
  "angry", "proud", "nervous",
  
  // Phrases
  "riding a bicycle", "watching a movie", "brushing teeth", "opening a present",
  "driving a car", "playing soccer", "reading a book", "taking a photo",
  "building a sandcastle", "flying a kite"
];

// Shot forfeit messages
const shotMessages = [
  "Take a shot! You've earned it after all those charades.",
  "Time for a drink! Take a shot to celebrate your acting career.",
  "Three charades is enough! Take a shot to loosen up.",
  "Acting is thirsty work! Take a shot before continuing.",
  "You're a charade champion! Celebrate with a shot."
];

// Generate random forfeit
const getRandomForfeit = (player = null) => {
  // If player has done 3+ charades, give them the special shot forfeit
  if (player && player.charadeCount >= 3) {
    const message = shotMessages[Math.floor(Math.random() * shotMessages.length)];
    
    // Reset their charade count
    player.charadeCount = 0;
    
    return {
      id: Date.now().toString(36),
      type: 'shot',
      description: message,
      wordToAct: null // No word to act for this forfeit type
    };
  }
  
  // Default to regular charade
  const wordToAct = charadesWords[Math.floor(Math.random() * charadesWords.length)];
  
  return {
    id: Date.now().toString(36),
    type: 'charade',
    description: 'Act out this word without speaking! Other players try to guess.',
    wordToAct
  };
};

// Special forfeit for taking a shot
const getShotForfeit = () => {
  const message = shotMessages[Math.floor(Math.random() * shotMessages.length)];
  
  return {
    id: Date.now().toString(36),
    type: 'shot',
    description: message,
    wordToAct: null
  };
};

module.exports = {
  getRandomForfeit,
  getShotForfeit,
  charadesWords
};
