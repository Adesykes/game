export const tongueTwisters = [
  // Classic tongue twisters
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Betty Botter bought some butter",
  "Red lorry, yellow lorry",
  "Pad kid poured curd pulled cod",
  "Six sick hicks nick six slick bricks with picks and sticks",

  // More challenging ones
  "The sixth sick sheik's sixth sheep's sick",
  "A proper copper coffee pot",
  "Rubber baby buggy bumpers",
  "Shy Shelly says she shall sew sheets",
  "Preshrunk silk shirts",
  "Irish wristwatch",
  "Thin sticks, thick bricks",

  // Really difficult ones
  "The thirty-three thieves thought that they thrilled the throne throughout Thursday",
  "Can you can a can as a canner can can a can?",
  "I have got a date at a quarter to eight; I'll see you at the gate, so don't be late",
  "You know New York, you need New York, you know you need unique New York",
  "One smart fellow, he felt smart. Two smart fellows, they felt smart. Three smart fellows, they all felt smart",
  "Near an ear, a nearer ear, a nearly eerie ear",
  "A big black bug bit a big black bear",

  // Fun ones
  "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn't fuzzy, was he?",
  "If a dog chews shoes, whose shoes does he choose?",
  "I thought a thought. But the thought I thought wasn't the thought I thought I thought",
  "Upper roller lower roller",
  "Red leather yellow leather",
  "The two-twenty-two train tore through the tunnel",
  "Specific Pacific",
];

export const getRandomTongueTwister = (): string => {
  return tongueTwisters[Math.floor(Math.random() * tongueTwisters.length)];
};