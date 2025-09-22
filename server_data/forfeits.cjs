// This file contains the forfeit challenges used in the game
// Includes charades, pictionary, and special forfeits

// Forfeit types:
// - charade: Act out a word for others to guess
// - pictionary: Draw a word for others to guess
// - shot: Take a shot (triggered after multiple forfeits)

const charadesWords = [
  // Animals
  "elephant", "monkey", "giraffe", "kangaroo", "penguin", "octopus", "butterfly", 
  "crocodile", "dolphin", "flamingo", "lion", "tiger", "bear", "wolf", "fox",
  "rabbit", "deer", "horse", "zebra", "snake", "frog", "turtle", "owl", "eagle",
  "shark", "whale", "panda", "koala", "cheetah", "leopard", "hyena", "hippopotamus",
  "rhinoceros", "camel", "llama", "sloth", "armadillo", "porcupine", "hedgehog",
  "squirrel", "chipmunk", "badger", "weasel", "otter", "beaver", "moose", "buffalo",
  "antelope", "gazelle", "chimpanzee", "gorilla", "orangutan", "baboon", "lemur",
  
  // Actions
  "swimming", "dancing", "skiing", "cooking", "painting", "fishing", "juggling", 
  "surfing", "knitting", "gardening", "running", "jumping", "climbing", "driving",
  "writing", "reading", "singing", "playing", "eating", "sleeping", "walking",
  "flying", "crying", "laughing", "fighting", "thinking", "talking", "listening",
  "watching", "waiting", "working", "studying", "exercising", "shopping", "cleaning",
  "washing", "brushing", "combing", "shaving", "bathing", "stretching", "yawning",
  "smiling", "frowning", "winking", "nodding", "shaking", "pointing", "waving",
  "clapping", "dancing", "singing", "whistling", "humming", "cheering", "booing",
  
  // Jobs/Roles
  "firefighter", "chef", "teacher", "astronaut", "doctor", "pirate", "superhero", 
  "police officer", "artist", "scientist", "nurse", "pilot", "farmer", "mechanic",
  "lawyer", "engineer", "musician", "actor", "dentist", "photographer", "journalist",
  "architect", "veterinarian", "coach", "librarian", "accountant", "banker", "cashier",
  "waiter", "waitress", "bartender", "barista", "baker", "butcher", "fisherman",
  "hunter", "miner", "soldier", "sailor", "captain", "detective", "spy", "magician",
  "clown", "circus performer", "acrobat", "dancer", "singer", "composer", "conductor",
  "director", "producer", "writer", "editor", "translator", "interpreter", "therapist",
  
  // Objects
  "telephone", "umbrella", "toothbrush", "camera", "laptop", "scissors", "guitar", 
  "helicopter", "basketball", "microwave", "television", "refrigerator", "washing machine",
  "vacuum cleaner", "toaster", "blender", "coffee maker", "hair dryer", "alarm clock",
  "remote control", "headphones", "microphone", "projector", "printer", "calculator",
  "book", "newspaper", "magazine", "envelope", "stamp", "key", "lock", "door", "window",
  "mirror", "picture frame", "vase", "candle", "lamp", "flashlight", "battery", "plug",
  "socket", "cable", "wire", "hammer", "screwdriver", "wrench", "pliers", "saw",
  "drill", "nail", "screw", "glue", "tape", "scissors", "knife", "fork", "spoon",
  
  // Places
  "beach", "library", "airport", "restaurant", "zoo", "hospital", "amusement park", 
  "mountain", "farm", "supermarket", "school", "church", "bank", "post office",
  "gas station", "shopping mall", "movie theater", "museum", "park", "stadium",
  "train station", "bus stop", "hotel", "casino", "gym", "office", "factory", "warehouse",
  "bakery", "pharmacy", "dentist office", "barbershop", "salon", "spa", "pool",
  "lake", "river", "ocean", "forest", "desert", "canyon", "cave", "castle", "palace",
  "temple", "mosque", "synagogue", "cathedral", "bridge", "tunnel", "highway", "street",
  "alley", "courtyard", "garden", "playground", "skate park", "basketball court", "tennis court",
  
  // Emotions
  "excited", "scared", "confused", "bored", "surprised", "exhausted", "disappointed",
  "angry", "proud", "nervous", "happy", "sad", "worried", "relaxed", "frustrated",
  "jealous", "embarrassed", "guilty", "grateful", "hopeful", "lonely", "loved",
  "peaceful", "shocked", "silly", "amused", "annoyed", "anxious", "arrogant", "ashamed",
  "bewildered", "blissful", "calm", "cheerful", "confident", "content", "courageous",
  "curious", "delighted", "depressed", "determined", "disgusted", "eager", "ecstatic",
  "envious", "frightened", "furious", "gleeful", "gloomy", "grumpy", "guilty", "helpless",
  "horrified", "humiliated", "hysterical", "indifferent", "infatuated", "insecure", "insulted",
  
  // Phrases
  "riding a bicycle", "watching a movie", "brushing teeth", "opening a present",
  "driving a car", "playing soccer", "reading a book", "taking a photo",
  "building a sandcastle", "flying a kite", "blowing out candles", "tying shoelaces",
  "making a phone call", "sending an email", "watering plants", "doing laundry",
  "washing dishes", "making breakfast", "playing guitar", "dancing ballet",
  "riding a horse", "climbing a tree", "swinging on a swing", "jumping rope",
  "throwing a ball", "catching a fish", "planting a seed", "baking a cake",
  "wrapping a gift", "telling a joke", "crossing the street", "waiting in line",
  "paying with cash", "using credit card", "checking the time", "setting an alarm",
  "taking a shower", "getting dressed", "brushing hair", "putting on makeup",
  "eating breakfast", "having lunch", "dinner time", "snack time", "drinking water",
  "making coffee", "brewing tea", "cooking dinner", "setting the table", "doing homework",
  "watching television", "listening to music", "playing video games", "using computer",
  "sending text message", "making video call", "taking selfie", "posting on social media",
  "going for a walk", "jogging in park", "riding motorcycle", "driving truck", "flying airplane"
];

const pictionaryWords = [
  // Easy & Everyday Objects
  "Toothbrush",
  "Sunglasses",
  "Umbrella",
  "Backpack",
  "Spoon",
  "Chair",
  "Clock",
  "Pencil",
  "Mirror",
  "Bed",
  // 🐾 Animals
  "Elephant",
  "Kangaroo",
  "Penguin",
  "Snake",
  "Owl",
  "Dolphin",
  "Giraffe",
  "Turtle",
  "Lion",
  "Octopus",
  // 🏠 Household Items
  "Washing machine",
  "Television",
  "Lamp",
  "Microwave",
  "Vacuum cleaner",
  "Fridge",
  "Curtain",
  "Bathtub",
  "Doorbell",
  "Iron",
  // 🌍 Places & Landmarks
  "Eiffel Tower",
  "Great Wall of China",
  "Pyramid",
  "Beach",
  "Airport",
  "Zoo",
  "Library",
  "Castle",
  "Train station",
  "Forest",
  // 🎭 Actions & Verbs
  "Dancing",
  "Running",
  "Sleeping",
  "Cooking",
  "Reading",
  "Swimming",
  "Singing",
  "Jumping",
  "Crying",
  "Laughing",
  // 🍕 Food & Drink
  "Pizza",
  "Ice cream",
  "Hamburger",
  "Apple",
  "Cake",
  "Coffee",
  "Banana",
  "Sandwich",
  "Popcorn",
  "Spaghetti",
  // 🎉 Holidays & Celebrations
  "Christmas tree",
  "Birthday cake",
  "Fireworks",
  "Easter egg",
  "Halloween costume",
  "Valentine’s heart",
  "Turkey dinner",
  "New Year’s Eve",
  "Graduation cap",
  "Wedding ring",
  // 🎬 Entertainment & Pop Culture
  "Superhero",
  "Movie camera",
  "Guitar",
  "Microphone",
  "Game controller",
  "Ballet dancer",
  "Magician",
  "DJ",
  "Clown",
  "Circus tent",
  // 🚗 Transportation
  "Bicycle",
  "Airplane",
  "Train",
  "Car",
  "Bus",
  "Helicopter",
  "Skateboard",
  "Boat",
  "Hot air balloon",
  "Tractor"
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
  // If player has done 3+ forfeits (charades + pictionary), give them the special shot forfeit
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
  
  // Randomly choose between charade and pictionary
  const isCharade = Math.random() < 0.5;
  
  if (isCharade) {
    const wordToAct = charadesWords[Math.floor(Math.random() * charadesWords.length)];
    
    return {
      id: Date.now().toString(36),
      type: 'charade',
      description: 'Act out this word without speaking! Other players try to guess.',
      wordToAct
    };
  } else {
    const wordToDraw = pictionaryWords[Math.floor(Math.random() * pictionaryWords.length)];
    
    return {
      id: Date.now().toString(36),
      type: 'pictionary',
      description: 'Draw this word! Other players try to guess what you\'re drawing.',
      wordToAct: wordToDraw
    };
  }
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
  charadesWords,
  pictionaryWords
};
