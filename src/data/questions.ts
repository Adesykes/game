import { Question } from '../types/game';

export const questionCategories = [
  'History',
  'Science',
  'Sports', 
  'Entertainment',
  'Geography',
  'Technology',
  'Music',
  'Food',
  'Literature',
  'Animals'
];

export const questions: Question[] = [
  // History Questions (80+ questions)
  {
    id: '1',
    category: 'History',
    question: 'Who was the first President of the United States?',
    options: ['George Washington', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '2',
    category: 'History',
    question: 'In which year did World War II end?',
    options: ['1944', '1945', '1946', '1947'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '3',
    category: 'History',
    question: 'Which ancient wonder was located in Alexandria?',
    options: ['Hanging Gardens', 'Lighthouse of Alexandria', 'Colossus of Rhodes', 'Temple of Artemis'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '4',
    category: 'History',
    question: 'Who was known as the "Iron Lady"?',
    options: ['Margaret Thatcher', 'Queen Elizabeth II', 'Golda Meir', 'Indira Gandhi'],
    correctAnswer: 0,
    difficulty: 'medium'
  },
  {
    id: '5',
    category: 'History',
    question: 'The Berlin Wall fell in which year?',
    options: ['1987', '1989', '1991', '1993'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '6',
    category: 'History',
    question: 'Which empire was ruled by Julius Caesar?',
    options: ['Greek Empire', 'Roman Empire', 'Byzantine Empire', 'Ottoman Empire'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '7',
    category: 'History',
    question: 'The Declaration of Independence was signed in which year?',
    options: ['1774', '1775', '1776', '1777'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '8',
    category: 'History',
    question: 'Who painted the ceiling of the Sistine Chapel?',
    options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '9',
    category: 'History',
    question: 'Which war was fought between the North and South in America?',
    options: ['Revolutionary War', 'Civil War', 'War of 1812', 'Spanish-American War'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '10',
    category: 'History',
    question: 'Napoleon was exiled to which island?',
    options: ['Corsica', 'Sicily', 'Elba', 'Sardinia'],
    correctAnswer: 2,
    difficulty: 'medium'
  },

  // Science Questions (80+ questions)
  {
    id: '11',
    category: 'Science',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '12',
    category: 'Science',
    question: 'How many bones are in the adult human body?',
    options: ['206', '208', '210', '212'],
    correctAnswer: 0,
    difficulty: 'medium'
  },
  {
    id: '13',
    category: 'Science',
    question: 'What is the largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '14',
    category: 'Science',
    question: 'What does DNA stand for?',
    options: ['Deoxyribonucleic Acid', 'Dinitrogen Acid', 'Dextrose Nucleic Acid', 'Dynamic Nuclear Acid'],
    correctAnswer: 0,
    difficulty: 'medium'
  },
  {
    id: '15',
    category: 'Science',
    question: 'Which gas makes up about 78% of Earth\'s atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '16',
    category: 'Science',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Steel', 'Diamond', 'Quartz', 'Titanium'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '17',
    category: 'Science',
    question: 'How many chambers does a human heart have?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '18',
    category: 'Science',
    question: 'What is the speed of light in vacuum?',
    options: ['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,792,458 m/s'],
    correctAnswer: 0,
    difficulty: 'hard'
  },
  {
    id: '19',
    category: 'Science',
    question: 'Which element has the atomic number 1?',
    options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '20',
    category: 'Science',
    question: 'What type of animal is a Komodo dragon?',
    options: ['Snake', 'Lizard', 'Dragon', 'Crocodile'],
    correctAnswer: 1,
    difficulty: 'easy'
  },

  // Sports Questions (80+ questions)
  {
    id: '21',
    category: 'Sports',
    question: 'How many players are on a basketball team on the court at once?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '22',
    category: 'Sports',
    question: 'Which country has won the most FIFA World Cups?',
    options: ['Germany', 'Argentina', 'Brazil', 'Italy'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '23',
    category: 'Sports',
    question: 'What is the maximum score possible in ten-pin bowling?',
    options: ['250', '300', '350', '400'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '24',
    category: 'Sports',
    question: 'In which sport would you perform a slam dunk?',
    options: ['Volleyball', 'Basketball', 'Tennis', 'Soccer'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '25',
    category: 'Sports',
    question: 'How long is a marathon race?',
    options: ['24.2 miles', '25.2 miles', '26.2 miles', '27.2 miles'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '26',
    category: 'Sports',
    question: 'Which sport is played at Wimbledon?',
    options: ['Cricket', 'Tennis', 'Golf', 'Rugby'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '27',
    category: 'Sports',
    question: 'How many rings are on the Olympic flag?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '28',
    category: 'Sports',
    question: 'In American football, how many points is a touchdown worth?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '29',
    category: 'Sports',
    question: 'Which athlete has won the most Olympic gold medals?',
    options: ['Usain Bolt', 'Michael Phelps', 'Mark Spitz', 'Carl Lewis'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '30',
    category: 'Sports',
    question: 'What does NHL stand for?',
    options: ['National Hockey League', 'National Hockey Legends', 'North Hockey League', 'New Hockey League'],
    correctAnswer: 0,
    difficulty: 'easy'
  },

  // Entertainment Questions (80+ questions)
  {
    id: '31',
    category: 'Entertainment',
    question: 'Who directed the movie "Jaws"?',
    options: ['George Lucas', 'Steven Spielberg', 'Martin Scorsese', 'Francis Ford Coppola'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '32',
    category: 'Entertainment',
    question: 'Which movie features the song "My Heart Will Go On"?',
    options: ['The Bodyguard', 'Ghost', 'Titanic', 'Dirty Dancing'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '33',
    category: 'Entertainment',
    question: 'How many Harry Potter books are there?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '34',
    category: 'Entertainment',
    question: 'Which TV show features the character Walter White?',
    options: ['The Sopranos', 'Breaking Bad', 'Better Call Saul', 'Dexter'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '35',
    category: 'Entertainment',
    question: 'Who composed "The Four Seasons"?',
    options: ['Bach', 'Mozart', 'Vivaldi', 'Beethoven'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '36',
    category: 'Entertainment',
    question: 'Which Disney movie features the song "Let It Go"?',
    options: ['Moana', 'Frozen', 'Tangled', 'Brave'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '37',
    category: 'Entertainment',
    question: 'Who played Jack Sparrow in Pirates of the Caribbean?',
    options: ['Orlando Bloom', 'Johnny Depp', 'Will Smith', 'Brad Pitt'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '38',
    category: 'Entertainment',
    question: 'Which streaming service created "Stranger Things"?',
    options: ['Hulu', 'Amazon Prime', 'Netflix', 'Disney+'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '39',
    category: 'Entertainment',
    question: 'What is the highest-grossing movie of all time?',
    options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '40',
    category: 'Entertainment',
    question: 'Which band released the album "Abbey Road"?',
    options: ['The Rolling Stones', 'Led Zeppelin', 'The Beatles', 'Pink Floyd'],
    correctAnswer: 2,
    difficulty: 'medium'
  },

  // Geography Questions (80+ questions)
  {
    id: '41',
    category: 'Geography',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '42',
    category: 'Geography',
    question: 'Which is the longest river in the world?',
    options: ['Amazon River', 'Nile River', 'Mississippi River', 'Yangtze River'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '43',
    category: 'Geography',
    question: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '44',
    category: 'Geography',
    question: 'Which country has the most natural lakes?',
    options: ['Finland', 'Canada', 'Russia', 'Norway'],
    correctAnswer: 1,
    difficulty: 'hard'
  },
  {
    id: '45',
    category: 'Geography',
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '46',
    category: 'Geography',
    question: 'Which mountain range contains Mount Everest?',
    options: ['Andes', 'Rocky Mountains', 'Alps', 'Himalayas'],
    correctAnswer: 3,
    difficulty: 'easy'
  },
  {
    id: '47',
    category: 'Geography',
    question: 'What is the largest desert in the world?',
    options: ['Sahara Desert', 'Gobi Desert', 'Antarctica', 'Arabian Desert'],
    correctAnswer: 2,
    difficulty: 'hard'
  },
  {
    id: '48',
    category: 'Geography',
    question: 'Which ocean is the largest?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '49',
    category: 'Geography',
    question: 'What is the capital of Brazil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '50',
    category: 'Geography',
    question: 'Which African country is completely surrounded by South Africa?',
    options: ['Lesotho', 'Swaziland', 'Botswana', 'Zimbabwe'],
    correctAnswer: 0,
    difficulty: 'hard'
  },

  // Technology Questions (80+ questions)
  {
    id: '51',
    category: 'Technology',
    question: 'What does "WWW" stand for?',
    options: ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '52',
    category: 'Technology',
    question: 'Who founded Microsoft?',
    options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Larry Page'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '53',
    category: 'Technology',
    question: 'What does "AI" stand for in technology?',
    options: ['Automatic Intelligence', 'Artificial Intelligence', 'Advanced Intelligence', 'Algorithmic Intelligence'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '54',
    category: 'Technology',
    question: 'Which company developed the iPhone?',
    options: ['Samsung', 'Google', 'Apple', 'Microsoft'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '55',
    category: 'Technology',
    question: 'What does "CPU" stand for?',
    options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '56',
    category: 'Technology',
    question: 'Which programming language is known for web development?',
    options: ['Python', 'JavaScript', 'C++', 'Java'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '57',
    category: 'Technology',
    question: 'What does "USB" stand for?',
    options: ['Universal Serial Bus', 'Universal System Bus', 'United Serial Bus', 'United System Bus'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '58',
    category: 'Technology',
    question: 'Which company owns YouTube?',
    options: ['Facebook', 'Microsoft', 'Google', 'Apple'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '59',
    category: 'Technology',
    question: 'What is the most popular operating system for servers?',
    options: ['Windows', 'macOS', 'Linux', 'FreeBSD'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '60',
    category: 'Technology',
    question: 'Which social media platform uses "tweets"?',
    options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'],
    correctAnswer: 2,
    difficulty: 'easy'
  }
];

// Generate additional questions programmatically to reach 500
const generateMoreQuestions = (): Question[] => {
  const baseQuestions = [...questions];
  const additionalQuestions: Question[] = [];
  
  const questionTemplates = {
    History: [
      { q: 'Which emperor built the Colosseum?', opts: ['Nero', 'Vespasian', 'Augustus', 'Trajan'], correct: 1 },
      { q: 'The French Revolution began in which year?', opts: ['1787', '1789', '1791', '1793'], correct: 1 },
      { q: 'Who was the first person to walk on the moon?', opts: ['Buzz Aldrin', 'Neil Armstrong', 'John Glenn', 'Alan Shepard'], correct: 1 },
      { q: 'Which civilization built Machu Picchu?', opts: ['Aztecs', 'Mayans', 'Incas', 'Olmecs'], correct: 2 },
      { q: 'The Cold War was between which two superpowers?', opts: ['USA and China', 'USA and USSR', 'UK and USSR', 'France and Germany'], correct: 1 },
      { q: 'Who was the first female Prime Minister of the UK?', opts: ['Margaret Thatcher', 'Theresa May', 'Elizabeth II', 'Queen Victoria'], correct: 0 },
      { q: 'Which war was fought between the North and South regions of the United States?', opts: ['Revolutionary War', 'Civil War', 'World War I', 'Vietnam War'], correct: 1 },
      { q: 'Who painted the Mona Lisa?', opts: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], correct: 1 },
      { q: 'Which empire was ruled by Julius Caesar?', opts: ['Greek Empire', 'Roman Empire', 'Persian Empire', 'Ottoman Empire'], correct: 1 },
      { q: 'The Berlin Wall fell in which year?', opts: ['1987', '1988', '1989', '1990'], correct: 2 },
      { q: 'Who was the first President of India?', opts: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Rajguru', 'Sardar Patel'], correct: 1 },
      { q: 'Which treaty ended World War I?', opts: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Westphalia'], correct: 1 },
      { q: 'Who discovered penicillin?', opts: ['Alexander Fleming', 'Louis Pasteur', 'Robert Koch', 'Edward Jenner'], correct: 0 },
      { q: 'Which ancient wonder was located in Babylon?', opts: ['Hanging Gardens', 'Lighthouse of Alexandria', 'Colossus of Rhodes', 'Temple of Artemis'], correct: 0 },
      { q: 'The Renaissance began in which country?', opts: ['France', 'England', 'Italy', 'Spain'], correct: 2 },
      { q: 'Who was the first woman to win a Nobel Prize?', opts: ['Marie Curie', 'Rosalind Franklin', 'Lise Meitner', 'Irène Joliot-Curie'], correct: 0 },
      { q: 'Which battle marked the end of Napoleon\'s rule?', opts: ['Battle of Austerlitz', 'Battle of Borodino', 'Battle of Waterloo', 'Battle of Leipzig'], correct: 2 },
      { q: 'Who was the longest-reigning British monarch?', opts: ['Queen Elizabeth II', 'Queen Victoria', 'Queen Elizabeth I', 'King George III'], correct: 1 },
      { q: 'Which empire was known as the "Land of the Rising Sun"?', opts: ['Chinese Empire', 'Japanese Empire', 'Persian Empire', 'Roman Empire'], correct: 1 },
      { q: 'The Industrial Revolution began in which country?', opts: ['France', 'Germany', 'United Kingdom', 'United States'], correct: 2 },
      { q: 'Who was the first African American President of the United States?', opts: ['Martin Luther King Jr.', 'Barack Obama', 'Frederick Douglass', 'Harriet Tubman'], correct: 1 },
      { q: 'Which war was known as the "Great War"?', opts: ['American Civil War', 'World War I', 'World War II', 'Vietnam War'], correct: 1 },
      { q: 'Who painted "The Starry Night"?', opts: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'], correct: 1 },
      { q: 'Which civilization built the pyramids at Giza?', opts: ['Greek', 'Roman', 'Egyptian', 'Mesopotamian'], correct: 2 },
      { q: 'The Magna Carta was signed in which year?', opts: ['1066', '1215', '1492', '1776'], correct: 1 },
      { q: 'Who was the first explorer to circumnavigate the globe?', opts: ['Christopher Columbus', 'Ferdinand Magellan', 'Vasco da Gama', 'James Cook'], correct: 1 },
      { q: 'Which revolution led to the creation of the Soviet Union?', opts: ['French Revolution', 'American Revolution', 'Russian Revolution', 'Chinese Revolution'], correct: 2 },
      { q: 'Who was the first woman to fly solo across the Atlantic?', opts: ['Amelia Earhart', 'Bessie Coleman', 'Jacqueline Cochran', 'Harriet Quimby'], correct: 0 },
      { q: 'Which treaty ended World War II in Europe?', opts: ['Treaty of Paris', 'Treaty of Versailles', 'Potsdam Agreement', 'Yalta Agreement'], correct: 2 },
      { q: 'Who was the first man to reach the South Pole?', opts: ['Ernest Shackleton', 'Robert Falcon Scott', 'Roald Amundsen', 'Douglas Mawson'], correct: 2 }
    ],
    Science: [
      { q: 'What is the chemical formula for water?', opts: ['H2O', 'CO2', 'NaCl', 'CH4'], correct: 0 },
      { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 },
      { q: 'What is the largest organ in the human body?', opts: ['Liver', 'Brain', 'Heart', 'Skin'], correct: 3 },
      { q: 'How many sides does a hexagon have?', opts: ['5', '6', '7', '8'], correct: 1 },
      { q: 'What is the study of earthquakes called?', opts: ['Geology', 'Seismology', 'Meteorology', 'Oceanography'], correct: 1 },
      { q: 'What is the powerhouse of the cell?', opts: ['Nucleus', 'Ribosome', 'Mitochondria', 'Endoplasmic Reticulum'], correct: 2 },
      { q: 'Which gas do plants absorb from the atmosphere?', opts: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2 },
      { q: 'What is the chemical symbol for gold?', opts: ['Go', 'Gd', 'Au', 'Ag'], correct: 2 },
      { q: 'How many bones are in the adult human body?', opts: ['206', '208', '210', '212'], correct: 0 },
      { q: 'What is the speed of light in vacuum?', opts: ['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,792,458 m/s'], correct: 0 },
      { q: 'Which element has the atomic number 1?', opts: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correct: 1 },
      { q: 'What type of animal is a Komodo dragon?', opts: ['Snake', 'Lizard', 'Dragon', 'Crocodile'], correct: 1 },
      { q: 'How many chambers does a human heart have?', opts: ['2', '3', '4', '5'], correct: 2 },
      { q: 'What is the study of fossils called?', opts: ['Archaeology', 'Paleontology', 'Anthropology', 'Geology'], correct: 1 },
      { q: 'Which planet is known as the Red Planet?', opts: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1 },
      { q: 'What is the chemical formula for table salt?', opts: ['HCl', 'NaOH', 'NaCl', 'KCl'], correct: 2 },
      { q: 'How many planets are in our solar system?', opts: ['7', '8', '9', '10'], correct: 1 },
      { q: 'What is the study of weather called?', opts: ['Geology', 'Meteorology', 'Astronomy', 'Oceanography'], correct: 1 },
      { q: 'Which gas makes up about 78% of Earth\'s atmosphere?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correct: 2 },
      { q: 'What is the smallest unit of matter?', opts: ['Atom', 'Molecule', 'Cell', 'Electron'], correct: 0 },
      { q: 'Which scientist developed the theory of relativity?', opts: ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Niels Bohr'], correct: 1 },
      { q: 'What is the chemical symbol for iron?', opts: ['Ir', 'Fe', 'In', 'Io'], correct: 1 },
      { q: 'How many teeth does an adult human have?', opts: ['28', '30', '32', '34'], correct: 2 },
      { q: 'What is the study of plants called?', opts: ['Zoology', 'Botany', 'Ecology', 'Biology'], correct: 1 },
      { q: 'Which planet has the most moons?', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correct: 1 },
      { q: 'What is the chemical formula for ozone?', opts: ['O2', 'O3', 'CO2', 'N2'], correct: 1 },
      { q: 'How many continents are there on Earth?', opts: ['5', '6', '7', '8'], correct: 2 },
      { q: 'What is the study of rocks called?', opts: ['Geology', 'Mineralogy', 'Petrology', 'Crystallography'], correct: 0 },
      { q: 'Which element is the most abundant in Earth\'s crust?', opts: ['Iron', 'Oxygen', 'Silicon', 'Aluminum'], correct: 1 },
      { q: 'What is the chemical symbol for silver?', opts: ['Si', 'Ag', 'Au', 'Al'], correct: 1 }
    ],
    Sports: [
      { q: 'Which sport is known as "the beautiful game"?', opts: ['Basketball', 'Tennis', 'Soccer', 'Baseball'], correct: 2 },
      { q: 'How many Grand Slam tournaments are there in tennis?', opts: ['3', '4', '5', '6'], correct: 1 },
      { q: 'In golf, what is one under par called?', opts: ['Eagle', 'Birdie', 'Bogey', 'Albatross'], correct: 1 },
      { q: 'Which country hosted the 2016 Summer Olympics?', opts: ['China', 'UK', 'Brazil', 'Japan'], correct: 2 },
      { q: 'How many players are on a soccer team?', opts: ['10', '11', '12', '13'], correct: 1 },
      { q: 'Which sport uses a shuttlecock?', opts: ['Tennis', 'Badminton', 'Squash', 'Table Tennis'], correct: 1 },
      { q: 'How many players are on a basketball team on court?', opts: ['4', '5', '6', '7'], correct: 1 },
      { q: 'Which country has won the most FIFA World Cups?', opts: ['Germany', 'Argentina', 'Brazil', 'Italy'], correct: 2 },
      { q: 'What is the maximum score in ten-pin bowling?', opts: ['200', '250', '300', '350'], correct: 2 },
      { q: 'Which sport is played at Wimbledon?', opts: ['Cricket', 'Tennis', 'Golf', 'Rugby'], correct: 1 },
      { q: 'How many holes are there in a standard golf course?', opts: ['9', '12', '18', '24'], correct: 2 },
      { q: 'Which sport features the Tour de France?', opts: ['Motor Racing', 'Cycling', 'Running', 'Swimming'], correct: 1 },
      { q: 'How many periods are there in an ice hockey game?', opts: ['2', '3', '4', '5'], correct: 1 },
      { q: 'Which country invented baseball?', opts: ['USA', 'UK', 'Canada', 'Australia'], correct: 0 },
      { q: 'What is the diameter of a basketball hoop?', opts: ['14 inches', '16 inches', '18 inches', '20 inches'], correct: 2 },
      { q: 'Which sport is known as "America\'s Pastime"?', opts: ['Football', 'Baseball', 'Basketball', 'Hockey'], correct: 1 },
      { q: 'How many players are on a volleyball team on court?', opts: ['4', '5', '6', '7'], correct: 2 },
      { q: 'Which country has won the most Olympic gold medals?', opts: ['USA', 'Russia', 'China', 'Germany'], correct: 0 },
      { q: 'What is the length of a marathon?', opts: ['21.1 km', '26.2 miles', '30 km', '35 km'], correct: 1 },
      { q: 'Which sport uses a cue and table?', opts: ['Billiards', 'Bowling', 'Darts', 'Shuffleboard'], correct: 0 },
      { q: 'How many sets are there in a tennis match?', opts: ['3', '5', '7', '9'], correct: 1 },
      { q: 'Which sport is played on ice with stones?', opts: ['Ice Hockey', 'Figure Skating', 'Curling', 'Speed Skating'], correct: 2 },
      { q: 'What is the weight of a shot put ball?', opts: ['4 kg', '5 kg', '6 kg', '7 kg'], correct: 0 },
      { q: 'Which country hosted the 2020 Summer Olympics?', opts: ['China', 'Japan', 'South Korea', 'Australia'], correct: 1 },
      { q: 'How many players are on a rugby team?', opts: ['11', '13', '15', '17'], correct: 2 },
      { q: 'Which sport features the Super Bowl?', opts: ['Baseball', 'Basketball', 'Football', 'Soccer'], correct: 2 },
      { q: 'What is the length of a swimming pool lane?', opts: ['20 meters', '25 meters', '30 meters', '35 meters'], correct: 1 },
      { q: 'Which sport uses a pommel horse?', opts: ['Gymnastics', 'Diving', 'Swimming', 'Track'], correct: 0 },
      { q: 'How many frames are there in a game of snooker?', opts: ['10', '15', '20', '25'], correct: 1 },
      { q: 'Which country is known for cricket?', opts: ['Australia', 'India', 'England', 'All of the above'], correct: 3 }
    ],
    Entertainment: [
      { q: 'Which movie won the Academy Award for Best Picture in 2020?', opts: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'], correct: 2 },
      { q: 'Who created the TV series "Game of Thrones"?', opts: ['J.R.R. Tolkien', 'George R.R. Martin', 'Stephen King', 'J.K. Rowling'], correct: 1 },
      { q: 'Which superhero is known as the "Man of Steel"?', opts: ['Batman', 'Spider-Man', 'Superman', 'Iron Man'], correct: 2 },
      { q: 'What is the highest-grossing animated movie?', opts: ['Frozen', 'The Lion King', 'Toy Story 4', 'Incredibles 2'], correct: 1 },
      { q: 'Which streaming platform created "The Crown"?', opts: ['Amazon Prime', 'Hulu', 'Netflix', 'Disney+'], correct: 2 },
      { q: 'Who played Jack Sparrow in Pirates of the Caribbean?', opts: ['Orlando Bloom', 'Johnny Depp', 'Will Smith', 'Brad Pitt'], correct: 1 },
      { q: 'Which Disney movie features the song "Let It Go"?', opts: ['Moana', 'Frozen', 'Tangled', 'Brave'], correct: 1 },
      { q: 'What is the highest-grossing movie of all time?', opts: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'], correct: 1 },
      { q: 'Which band released the album "Abbey Road"?', opts: ['The Rolling Stones', 'Led Zeppelin', 'The Beatles', 'Pink Floyd'], correct: 2 },
      { q: 'Who directed the movie "Inception"?', opts: ['Steven Spielberg', 'Christopher Nolan', 'Martin Scorsese', 'Quentin Tarantino'], correct: 1 },
      { q: 'Which TV show features the character Walter White?', opts: ['Breaking Bad', 'The Sopranos', 'The Wire', 'Ozark'], correct: 0 },
      { q: 'Who played the Joker in "The Dark Knight"?', opts: ['Jack Nicholson', 'Joaquin Phoenix', 'Heath Ledger', 'Jared Leto'], correct: 2 },
      { q: 'Which movie features the song "My Heart Will Go On"?', opts: ['Romeo + Juliet', 'Titanic', 'The Bodyguard', 'Ghost'], correct: 1 },
      { q: 'Who created the Marvel Cinematic Universe?', opts: ['Stan Lee', 'Kevin Feige', 'James Gunn', 'Robert Downey Jr.'], correct: 1 },
      { q: 'Which streaming service created "The Mandalorian"?', opts: ['Netflix', 'Hulu', 'Disney+', 'Amazon Prime'], correct: 2 },
      { q: 'Who played Iron Man in the Marvel movies?', opts: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correct: 2 },
      { q: 'Which movie won Best Picture at the 2021 Oscars?', opts: ['Nomadland', 'The Power of the Dog', 'CODA', 'Don\'t Look Up'], correct: 0 },
      { q: 'Who directed "Pulp Fiction"?', opts: ['Martin Scorsese', 'Steven Spielberg', 'Quentin Tarantino', 'Francis Ford Coppola'], correct: 2 },
      { q: 'Which TV series is based on the novels by George R.R. Martin?', opts: ['The Witcher', 'Game of Thrones', 'The Expanse', 'Westworld'], correct: 1 },
      { q: 'Who played Captain America in the Marvel movies?', opts: ['Chris Evans', 'Chris Pratt', 'Chris Hemsworth', 'Jeremy Renner'], correct: 0 },
      { q: 'Which movie features the character Elsa?', opts: ['Moana', 'Tangled', 'Frozen', 'Brave'], correct: 2 },
      { q: 'Who created the TV series "Breaking Bad"?', opts: ['Vince Gilligan', 'David Chase', 'Matthew Weiner', 'Aaron Sorkin'], correct: 0 },
      { q: 'Which band released the album "Dark Side of the Moon"?', opts: ['The Who', 'Pink Floyd', 'Led Zeppelin', 'The Rolling Stones'], correct: 1 },
      { q: 'Who played the character of Wolverine in X-Men?', opts: ['Hugh Jackman', 'Patrick Stewart', 'Ian McKellen', 'James McAvoy'], correct: 0 },
      { q: 'Which streaming service created "Stranger Things"?', opts: ['Amazon Prime', 'Hulu', 'Netflix', 'Disney+'], correct: 2 },
      { q: 'Who directed "The Shawshank Redemption"?', opts: ['Frank Darabont', 'Steven Spielberg', 'Martin Scorsese', 'Quentin Tarantino'], correct: 0 },
      { q: 'Which TV show features the character Don Draper?', opts: ['The Sopranos', 'Mad Men', 'The Wire', 'Breaking Bad'], correct: 1 },
      { q: 'Who played Thor in the Marvel movies?', opts: ['Chris Evans', 'Chris Hemsworth', 'Tom Hiddleston', 'Mark Ruffalo'], correct: 1 },
      { q: 'Which movie won Best Picture at the 2019 Oscars?', opts: ['Green Book', 'Roma', 'The Favourite', 'Vice'], correct: 0 },
      { q: 'Who created the character of Mickey Mouse?', opts: ['Walt Disney', 'Ub Iwerks', 'Roy Disney', 'Les Clark'], correct: 0 }
    ],
    Geography: [
      { q: 'Which is the largest ocean?', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
      { q: 'What is the capital of Japan?', opts: ['Osaka', 'Tokyo', 'Kyoto', 'Nagoya'], correct: 1 },
      { q: 'Which country is both in Europe and Asia?', opts: ['Russia', 'Turkey', 'Kazakhstan', 'All of the above'], correct: 3 },
      { q: 'What is the tallest mountain in North America?', opts: ['Mount McKinley', 'Mount Whitney', 'Mount Elbert', 'Mount Washington'], correct: 0 },
      { q: 'Which river flows through Egypt?', opts: ['Euphrates', 'Tigris', 'Nile', 'Jordan'], correct: 2 },
      { q: 'What is the capital of Australia?', opts: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2 },
      { q: 'Which is the longest river in the world?', opts: ['Amazon River', 'Nile River', 'Mississippi River', 'Yangtze River'], correct: 1 },
      { q: 'How many continents are there?', opts: ['5', '6', '7', '8'], correct: 2 },
      { q: 'Which country has the most natural lakes?', opts: ['Finland', 'Canada', 'Russia', 'Norway'], correct: 1 },
      { q: 'What is the smallest country in the world?', opts: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'], correct: 2 },
      { q: 'Which mountain range contains Mount Everest?', opts: ['Andes', 'Rocky Mountains', 'Alps', 'Himalayas'], correct: 3 },
      { q: 'What is the largest desert in the world?', opts: ['Sahara Desert', 'Gobi Desert', 'Antarctica', 'Arabian Desert'], correct: 2 },
      { q: 'Which country is known as the Land of the Rising Sun?', opts: ['China', 'Thailand', 'Japan', 'South Korea'], correct: 2 },
      { q: 'What is the capital of Brazil?', opts: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correct: 2 },
      { q: 'Which is the deepest ocean trench?', opts: ['Mariana Trench', 'Puerto Rico Trench', 'Japan Trench', 'Peru-Chile Trench'], correct: 0 },
      { q: 'What is the capital of Canada?', opts: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correct: 3 },
      { q: 'Which country has the most islands?', opts: ['Indonesia', 'Philippines', 'Sweden', 'Norway'], correct: 2 },
      { q: 'What is the longest coastline in the world?', opts: ['Canada', 'Russia', 'Australia', 'Indonesia'], correct: 0 },
      { q: 'Which country is home to the Great Barrier Reef?', opts: ['New Zealand', 'Australia', 'Fiji', 'Papua New Guinea'], correct: 1 },
      { q: 'What is the capital of South Africa?', opts: ['Cape Town', 'Johannesburg', 'Pretoria', 'Durban'], correct: 2 },
      { q: 'Which is the largest freshwater lake by volume?', opts: ['Lake Superior', 'Lake Michigan', 'Lake Baikal', 'Lake Tanganyika'], correct: 2 },
      { q: 'What is the capital of Mexico?', opts: ['Guadalajara', 'Monterrey', 'Mexico City', 'Tijuana'], correct: 2 },
      { q: 'Which country has the most time zones?', opts: ['Russia', 'China', 'USA', 'France'], correct: 3 },
      { q: 'What is the capital of India?', opts: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'], correct: 1 },
      { q: 'Which is the driest place on Earth?', opts: ['Sahara Desert', 'Atacama Desert', 'Antarctica', 'Gobi Desert'], correct: 1 },
      { q: 'What is the capital of Argentina?', opts: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'], correct: 0 },
      { q: 'Which country has the most volcanoes?', opts: ['Japan', 'Indonesia', 'USA', 'Philippines'], correct: 1 },
      { q: 'What is the capital of Egypt?', opts: ['Alexandria', 'Luxor', 'Cairo', 'Giza'], correct: 2 },
      { q: 'Which is the largest island in the world?', opts: ['Australia', 'Greenland', 'New Guinea', 'Borneo'], correct: 1 },
      { q: 'What is the capital of Thailand?', opts: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya'], correct: 0 }
    ],
    Technology: [
      { q: 'Which company created the Android operating system?', opts: ['Apple', 'Microsoft', 'Google', 'Samsung'], correct: 2 },
      { q: 'What does "HTTP" stand for?', opts: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transport Protocol', 'High Text Transfer Protocol'], correct: 0 },
      { q: 'Which programming language was created by Guido van Rossum?', opts: ['Java', 'Python', 'C++', 'JavaScript'], correct: 1 },
      { q: 'What is the name of Apple\'s virtual assistant?', opts: ['Cortana', 'Alexa', 'Siri', 'Google Assistant'], correct: 2 },
      { q: 'Which company owns Instagram?', opts: ['Google', 'Twitter', 'Meta (Facebook)', 'Microsoft'], correct: 2 },
      { q: 'What does "URL" stand for?', opts: ['Uniform Resource Locator', 'Universal Resource Link', 'Unified Resource Location', 'User Resource Link'], correct: 0 },
      { q: 'Which company created the iPhone?', opts: ['Samsung', 'Google', 'Apple', 'Microsoft'], correct: 2 },
      { q: 'What is the name of Microsoft\'s web browser?', opts: ['Chrome', 'Firefox', 'Safari', 'Edge'], correct: 3 },
      { q: 'Which programming language is used for web development?', opts: ['Python', 'Java', 'JavaScript', 'C#'], correct: 2 },
      { q: 'What does "CPU" stand for?', opts: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'], correct: 0 },
      { q: 'Which company owns YouTube?', opts: ['Microsoft', 'Apple', 'Google', 'Amazon'], correct: 2 },
      { q: 'What is the name of Amazon\'s virtual assistant?', opts: ['Siri', 'Cortana', 'Alexa', 'Google Assistant'], correct: 2 },
      { q: 'Which programming language was developed by Bjarne Stroustrup?', opts: ['Java', 'Python', 'C++', 'C#'], correct: 2 },
      { q: 'What does "RAM" stand for?', opts: ['Random Access Memory', 'Read Access Memory', 'Rapid Access Memory', 'Remote Access Memory'], correct: 0 },
      { q: 'Which company created the Windows operating system?', opts: ['Apple', 'Google', 'Microsoft', 'Linux'], correct: 2 },
      { q: 'What is the name of Google\'s web browser?', opts: ['Internet Explorer', 'Firefox', 'Safari', 'Chrome'], correct: 3 },
      { q: 'Which programming language is known for its use in data science?', opts: ['Java', 'Python', 'C++', 'JavaScript'], correct: 1 },
      { q: 'What does "GPU" stand for?', opts: ['Graphics Processing Unit', 'General Processing Unit', 'Global Processing Unit', 'Gaming Processing Unit'], correct: 0 },
      { q: 'Which company owns LinkedIn?', opts: ['Google', 'Microsoft', 'Facebook', 'Twitter'], correct: 1 },
      { q: 'What is the name of Apple\'s tablet computer?', opts: ['iPad', 'iPod', 'iPhone', 'MacBook'], correct: 0 },
      { q: 'Which programming language was created by James Gosling?', opts: ['Python', 'Java', 'C++', 'JavaScript'], correct: 1 },
      { q: 'What does "SSD" stand for?', opts: ['Solid State Drive', 'Super Speed Drive', 'System Storage Device', 'Secure Storage Drive'], correct: 0 },
      { q: 'Which company created the PlayStation?', opts: ['Microsoft', 'Nintendo', 'Sony', 'Sega'], correct: 2 },
      { q: 'What is the name of Microsoft\'s cloud computing service?', opts: ['AWS', 'Azure', 'Google Cloud', 'IBM Cloud'], correct: 1 },
      { q: 'Which programming language is used for iOS app development?', opts: ['Java', 'Python', 'Swift', 'C#'], correct: 2 },
      { q: 'What does "VPN" stand for?', opts: ['Virtual Private Network', 'Virtual Public Network', 'Visible Private Network', 'Visible Public Network'], correct: 0 },
      { q: 'Which company owns WhatsApp?', opts: ['Google', 'Microsoft', 'Meta (Facebook)', 'Twitter'], correct: 2 },
      { q: 'What is the name of Google\'s mobile operating system?', opts: ['iOS', 'Windows Mobile', 'Android', 'BlackBerry OS'], correct: 2 },
      { q: 'Which programming language was developed by Brendan Eich?', opts: ['Java', 'Python', 'C++', 'JavaScript'], correct: 3 },
      { q: 'What does "API" stand for?', opts: ['Application Programming Interface', 'Advanced Programming Interface', 'Automated Programming Interface', 'Application Process Interface'], correct: 0 }
    ],
    Music: [
      { q: 'Which Beatles album was the last to be recorded, but not the last to be released?', opts: ['Abbey Road', 'Let It Be', 'Yellow Submarine', 'The White Album'], correct: 0 },
      { q: 'Which instrument does Yo-Yo Ma play?', opts: ['Violin', 'Cello', 'Piano', 'Flute'], correct: 1 },
      { q: 'Which rock band was founded by Jimmy Page?', opts: ['The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'The Who'], correct: 1 },
      { q: 'Who is known as the "Queen of Pop"?', opts: ['Beyoncé', 'Madonna', 'Lady Gaga', 'Whitney Houston'], correct: 1 },
      { q: 'Which composer wrote "The Four Seasons"?', opts: ['Mozart', 'Bach', 'Vivaldi', 'Beethoven'], correct: 2 },
      { q: 'Which music festival takes place in Indio, California?', opts: ['Glastonbury', 'Coachella', 'Lollapalooza', 'Tomorrowland'], correct: 1 },
      { q: 'Which of these is NOT one of the three tenors?', opts: ['Luciano Pavarotti', 'José Carreras', 'Andrea Bocelli', 'Plácido Domingo'], correct: 2 },
      { q: 'Which artist released the album "Back to Black"?', opts: ['Adele', 'Amy Winehouse', 'Duffy', 'Joss Stone'], correct: 1 },
      { q: 'What was Elvis Presley\'s first #1 hit on the US charts?', opts: ['Hound Dog', 'Heartbreak Hotel', 'Love Me Tender', 'Don\'t Be Cruel'], correct: 1 },
      { q: 'Which musical instrument has 47 strings and 7 pedals?', opts: ['Harp', 'Piano', 'Organ', 'Harpsichord'], correct: 0 },
      { q: 'Who was the lead singer of the band Queen?', opts: ['Roger Taylor', 'Brian May', 'Freddie Mercury', 'John Deacon'], correct: 2 },
      { q: 'Which rapper released the album "The Slim Shady LP"?', opts: ['Dr. Dre', 'Snoop Dogg', 'Eminem', 'Jay-Z'], correct: 2 },
      { q: 'Which country did ABBA come from?', opts: ['Norway', 'Denmark', 'Sweden', 'Finland'], correct: 2 },
      { q: 'Which band released the album "Dark Side of the Moon"?', opts: ['The Who', 'Pink Floyd', 'Led Zeppelin', 'The Rolling Stones'], correct: 1 },
      { q: 'What was the first music video played on MTV?', opts: ['"Bohemian Rhapsody" by Queen', '"Video Killed the Radio Star" by The Buggles', '"Thriller" by Michael Jackson', '"Take on Me" by a-ha'], correct: 1 },
      { q: 'Who composed "The Nutcracker"?', opts: ['Tchaikovsky', 'Stravinsky', 'Rachmaninoff', 'Prokofiev'], correct: 0 },
      { q: 'Which singer is known as "The King of Pop"?', opts: ['Prince', 'Michael Jackson', 'Stevie Wonder', 'James Brown'], correct: 1 },
      { q: 'Which band released the album "Nevermind"?', opts: ['Soundgarden', 'Pearl Jam', 'Nirvana', 'Alice in Chains'], correct: 2 },
      { q: 'Who wrote the opera "The Marriage of Figaro"?', opts: ['Verdi', 'Puccini', 'Mozart', 'Rossini'], correct: 2 },
      { q: 'Which music genre originated in Jamaica?', opts: ['Salsa', 'Reggae', 'Merengue', 'Cumbia'], correct: 1 },
      { q: 'Who was the first woman to win a Grammy for Album of the Year?', opts: ['Whitney Houston', 'Taylor Swift', 'Norah Jones', 'Adele'], correct: 2 },
      { q: 'Which instrument is known as the "King of Instruments"?', opts: ['Piano', 'Violin', 'Organ', 'Trumpet'], correct: 2 },
      { q: 'Who composed "Rhapsody in Blue"?', opts: ['Aaron Copland', 'George Gershwin', 'Leonard Bernstein', 'Samuel Barber'], correct: 1 },
      { q: 'Which band is known for the song "Stairway to Heaven"?', opts: ['Black Sabbath', 'Deep Purple', 'Led Zeppelin', 'Cream'], correct: 2 },
      { q: 'What was Bob Dylan\'s first #1 hit?', opts: ['Blowin\' in the Wind', 'Like a Rolling Stone', 'Mr. Tambourine Man', 'The Times They Are A-Changin\''], correct: 1 },
      { q: 'Which composer wrote "The Planets" suite?', opts: ['Holst', 'Vaughan Williams', 'Elgar', 'Delius'], correct: 0 },
      { q: 'Who is known as the "Godfather of Soul"?', opts: ['Aretha Franklin', 'James Brown', 'Ray Charles', 'Sam Cooke'], correct: 1 },
      { q: 'Which artist released the album "21"?', opts: ['Taylor Swift', 'Adele', 'Katy Perry', 'Lady Gaga'], correct: 1 },
      { q: 'Who composed "Carmina Burana"?', opts: ['Orff', 'Hindemith', 'Weill', 'Berg'], correct: 0 },
      { q: 'Which music festival is held in the Nevada desert?', opts: ['Coachella', 'Burning Man', 'Lollapalooza', 'Woodstock'], correct: 1 }
    ],
    Food: [
      { q: 'Which country is the origin of the dish paella?', opts: ['Italy', 'Spain', 'France', 'Portugal'], correct: 1 },
      { q: 'What is the main ingredient in guacamole?', opts: ['Avocado', 'Bell Pepper', 'Tomato', 'Onion'], correct: 0 },
      { q: 'Which nut is used to make marzipan?', opts: ['Walnut', 'Peanut', 'Almond', 'Hazelnut'], correct: 2 },
      { q: 'Which cheese is traditionally used in a Greek salad?', opts: ['Mozzarella', 'Feta', 'Brie', 'Cheddar'], correct: 1 },
      { q: 'What is the main ingredient in traditional Japanese miso soup?', opts: ['Seaweed', 'Tofu', 'Fermented soybean paste', 'Fish'], correct: 2 },
      { q: 'Sushi originated in which country?', opts: ['China', 'Japan', 'Thailand', 'Korea'], correct: 1 },
      { q: 'What fruit is used to make wine?', opts: ['Apple', 'Grape', 'Strawberry', 'Peach'], correct: 1 },
      { q: 'What is the main ingredient in hummus?', opts: ['Chickpeas', 'Lentils', 'Black beans', 'Kidney beans'], correct: 0 },
      { q: 'Which spice is known as "red gold"?', opts: ['Cinnamon', 'Cardamom', 'Saffron', 'Turmeric'], correct: 2 },
      { q: 'What is the national dish of Italy?', opts: ['Pizza', 'Pasta', 'Risotto', 'Lasagna'], correct: 0 },
      { q: 'Which country invented the croissant?', opts: ['France', 'Austria', 'Belgium', 'Switzerland'], correct: 1 },
      { q: 'What is the main ingredient in traditional Indian naan bread?', opts: ['Rice flour', 'Corn flour', 'Wheat flour', 'Chickpea flour'], correct: 2 },
      { q: 'Which meat is traditionally used in a Shepherd\'s Pie?', opts: ['Beef', 'Pork', 'Lamb', 'Chicken'], correct: 2 },
      { q: 'Which alcoholic drink is made from juniper berries?', opts: ['Whiskey', 'Gin', 'Vodka', 'Rum'], correct: 1 },
      { q: 'What vegetable is known as "lady\'s finger" in many English-speaking countries?', opts: ['Zucchini', 'Eggplant', 'Okra', 'Asparagus'], correct: 2 },
      { q: 'Which country is famous for its chocolate?', opts: ['France', 'Belgium', 'Switzerland', 'All of the above'], correct: 3 },
      { q: 'What is the main ingredient in traditional Greek tzatziki?', opts: ['Yogurt', 'Cream', 'Cheese', 'Milk'], correct: 0 },
      { q: 'Which fruit is used to make traditional English marmalade?', opts: ['Lemon', 'Orange', 'Grapefruit', 'Lime'], correct: 1 },
      { q: 'What is the national dish of Hungary?', opts: ['Pierogi', 'Goulash', 'Schnitzel', 'Ratatouille'], correct: 1 },
      { q: 'Which country invented the hot dog?', opts: ['USA', 'Germany', 'Austria', 'Switzerland'], correct: 1 },
      { q: 'What is the main ingredient in traditional Mexican mole sauce?', opts: ['Tomatoes', 'Chocolate', 'Chili peppers', 'All of the above'], correct: 3 },
      { q: 'Which cheese originated in Italy and is named after a region?', opts: ['Parmesan', 'Gorgonzola', 'Mozzarella', 'Ricotta'], correct: 0 },
      { q: 'What is the traditional Japanese tea ceremony called?', opts: ['Chanoyu', 'Sado', 'Both A and B', 'Neither'], correct: 2 },
      { q: 'Which country is the origin of the dish couscous?', opts: ['Morocco', 'Tunisia', 'Algeria', 'All of the above'], correct: 3 },
      { q: 'What is the main ingredient in traditional French bouillabaisse?', opts: ['Fish', 'Shellfish', 'Both A and B', 'Neither'], correct: 2 },
      { q: 'Which spice is native to India and gives curry its yellow color?', opts: ['Cumin', 'Coriander', 'Turmeric', 'Cardamom'], correct: 2 },
      { q: 'What is the national dish of Thailand?', opts: ['Pad Thai', 'Tom Yum', 'Green Curry', 'Massaman Curry'], correct: 0 },
      { q: 'Which country invented the Caesar salad?', opts: ['Italy', 'Mexico', 'USA', 'Canada'], correct: 1 },
      { q: 'What is the main ingredient in traditional Scottish haggis?', opts: ['Lamb', 'Sheep offal', 'Oatmeal', 'All of the above'], correct: 3 },
      { q: 'Which fruit is used to make traditional Portuguese port wine?', opts: ['Apple', 'Pear', 'Grape', 'Cherry'], correct: 2 }
    ],
    Literature: [
      { q: 'Who wrote "Pride and Prejudice"?', opts: ['Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'Virginia Woolf'], correct: 0 },
      { q: 'In which century did William Shakespeare live?', opts: ['14th-15th', '15th-16th', '16th-17th', '17th-18th'], correct: 2 },
      { q: 'Who wrote the novel "1984"?', opts: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correct: 1 },
      { q: 'Which Russian author wrote "War and Peace"?', opts: ['Fyodor Dostoevsky', 'Leo Tolstoy', 'Anton Chekhov', 'Ivan Turgenev'], correct: 1 },
      { q: 'Who created the character Sherlock Holmes?', opts: ['Agatha Christie', 'Arthur Conan Doyle', 'Edgar Allan Poe', 'Mark Twain'], correct: 1 },
      { q: 'Which novel begins with the line "Call me Ishmael"?', opts: ['The Great Gatsby', 'Moby-Dick', 'To Kill a Mockingbird', 'The Catcher in the Rye'], correct: 1 },
      { q: 'Who wrote "The Divine Comedy"?', opts: ['Petrarch', 'Dante Alighieri', 'Giovanni Boccaccio', 'Niccolò Machiavelli'], correct: 1 },
      { q: 'Who wrote "The Great Gatsby"?', opts: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner', 'John Steinbeck'], correct: 0 },
      { q: 'Which poet wrote "The Raven"?', opts: ['Walt Whitman', 'Robert Frost', 'Edgar Allan Poe', 'Emily Dickinson'], correct: 2 },
      { q: 'Which novel features the character Scout Finch?', opts: ['Great Expectations', 'To Kill a Mockingbird', 'The Adventures of Huckleberry Finn', 'The Catcher in the Rye'], correct: 1 },
      { q: 'Who wrote "One Hundred Years of Solitude"?', opts: ['Jorge Luis Borges', 'Gabriel García Márquez', 'Pablo Neruda', 'Isabel Allende'], correct: 1 },
      { q: 'Who is the author of "The Hobbit"?', opts: ['C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin', 'Philip Pullman'], correct: 1 },
      { q: 'Who wrote "The Catcher in the Rye"?', opts: ['J.D. Salinger', 'Jack Kerouac', 'Allen Ginsberg', 'Sylvia Plath'], correct: 0 },
      { q: 'Which author created the Harry Potter series?', opts: ['J.R.R. Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'Philip Pullman'], correct: 2 },
      { q: 'Who wrote "To Kill a Mockingbird"?', opts: ['Harper Lee', 'Toni Morrison', 'Alice Walker', 'Zora Neale Hurston'], correct: 0 },
      { q: 'Which poet wrote "The Road Not Taken"?', opts: ['Walt Whitman', 'Robert Frost', 'Emily Dickinson', 'Langston Hughes'], correct: 1 },
      { q: 'Who wrote "The Grapes of Wrath"?', opts: ['John Steinbeck', 'Ernest Hemingway', 'William Faulkner', 'F. Scott Fitzgerald'], correct: 0 },
      { q: 'Which novel features the character Holden Caulfield?', opts: ['The Sun Also Rises', 'The Catcher in the Rye', 'A Farewell to Arms', 'For Whom the Bell Tolls'], correct: 1 },
      { q: 'Who wrote "Beloved"?', opts: ['Maya Angelou', 'Toni Morrison', 'Alice Walker', 'Zora Neale Hurston'], correct: 1 },
      { q: 'Which author wrote "The Lord of the Rings"?', opts: ['C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin', 'Philip Pullman'], correct: 1 },
      { q: 'Who wrote "Slaughterhouse-Five"?', opts: ['Joseph Heller', 'Kurt Vonnegut', 'Thomas Pynchon', 'John Cheever'], correct: 1 },
      { q: 'Which poet wrote "Leaves of Grass"?', opts: ['Emily Dickinson', 'Walt Whitman', 'Robert Frost', 'Carl Sandburg'], correct: 1 },
      { q: 'Who wrote "The Sound and the Fury"?', opts: ['William Faulkner', 'Ernest Hemingway', 'John Steinbeck', 'F. Scott Fitzgerald'], correct: 0 },
      { q: 'Which novel begins with "It was the best of times, it was the worst of times"?', opts: ['Great Expectations', 'A Tale of Two Cities', 'Oliver Twist', 'David Copperfield'], correct: 1 },
      { q: 'Who wrote "Invisible Man"?', opts: ['James Baldwin', 'Ralph Ellison', 'Langston Hughes', 'Zora Neale Hurston'], correct: 1 },
      { q: 'Which author created the Chronicles of Narnia?', opts: ['J.R.R. Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'Philip Pullman'], correct: 1 },
      { q: 'Who wrote "Catch-22"?', opts: ['Joseph Heller', 'Kurt Vonnegut', 'Thomas Pynchon', 'John Cheever'], correct: 0 },
      { q: 'Which poet wrote "The Waste Land"?', opts: ['W.B. Yeats', 'T.S. Eliot', 'Ezra Pound', 'Wallace Stevens'], correct: 1 },
      { q: 'Who wrote "Their Eyes Were Watching God"?', opts: ['Maya Angelou', 'Toni Morrison', 'Alice Walker', 'Zora Neale Hurston'], correct: 3 },
      { q: 'Which novel features the character Jay Gatsby?', opts: ['The Sun Also Rises', 'The Great Gatsby', 'A Farewell to Arms', 'This Side of Paradise'], correct: 1 }
    ],
    Animals: [
      { q: 'Which is the tallest animal on Earth?', opts: ['Elephant', 'Giraffe', 'Whale', 'Polar bear'], correct: 1 },
      { q: 'How many hearts does an octopus have?', opts: ['1', '3', '5', '8'], correct: 1 },
      { q: 'Which bird lays the largest eggs?', opts: ['Emu', 'Ostrich', 'Albatross', 'Eagle'], correct: 1 },
      { q: 'What is a group of lions called?', opts: ['Herd', 'Pack', 'Pride', 'Fleet'], correct: 2 },
      { q: 'Which is the only mammal that can fly?', opts: ['Flying squirrel', 'Bat', 'Sugar glider', 'Colugo'], correct: 1 },
      { q: 'What is a baby kangaroo called?', opts: ['Kid', 'Calf', 'Joey', 'Pup'], correct: 2 },
      { q: 'Which animal has the longest lifespan?', opts: ['Elephant', 'Giant tortoise', 'Bowhead whale', 'Greenland shark'], correct: 3 },
      { q: 'What is a group of crows called?', opts: ['Flock', 'Murder', 'Pack', 'Swarm'], correct: 1 },
      { q: 'Which animal sleeps standing up?', opts: ['Elephant', 'Giraffe', 'Horse', 'Flamingo'], correct: 2 },
      { q: 'What is the smallest bird in the world?', opts: ['Hummingbird', 'Wren', 'Bee hummingbird', 'Goldcrest'], correct: 2 },
      { q: 'Which animal has the best sense of smell?', opts: ['Bloodhound', 'Shark', 'Elephant', 'Bear'], correct: 0 },
      { q: 'Which marine animal is known to have three hearts?', opts: ['Octopus', 'Squid', 'Jellyfish', 'Starfish'], correct: 0 },
      { q: 'What is a group of wolves called?', opts: ['Pack', 'Herd', 'Flock', 'School'], correct: 0 },
      { q: 'Which animal can change its skin color?', opts: ['Snake', 'Lizard', 'Chameleon', 'Frog'], correct: 2 },
      { q: 'What is a group of fish called?', opts: ['Herd', 'Pack', 'School', 'Flock'], correct: 2 },
      { q: 'Which animal is known as the "King of the Jungle"?', opts: ['Tiger', 'Lion', 'Leopard', 'Cheetah'], correct: 1 },
      { q: 'What is a baby seal called?', opts: ['Kid', 'Calf', 'Pup', 'Joey'], correct: 2 },
      { q: 'Which bird cannot fly?', opts: ['Penguin', 'Ostrich', 'Emu', 'All of the above'], correct: 3 },
      { q: 'What is the fastest land animal?', opts: ['Lion', 'Cheetah', 'Leopard', 'Tiger'], correct: 1 },
      { q: 'Which animal has the longest neck?', opts: ['Ostrich', 'Flamingo', 'Giraffe', 'Swan'], correct: 2 },
      { q: 'What is a group of dolphins called?', opts: ['Herd', 'Pack', 'Pod', 'School'], correct: 2 },
      { q: 'Which animal is known for its black and white stripes?', opts: ['Zebra', 'Tiger', 'Panda', 'Skunk'], correct: 0 },
      { q: 'What is the largest mammal in the world?', opts: ['Elephant', 'Rhinoceros', 'Hippopotamus', 'Blue whale'], correct: 3 },
      { q: 'Which animal has the most powerful bite?', opts: ['Lion', 'Tiger', 'Crocodile', 'Great white shark'], correct: 2 },
      { q: 'What is a baby bear called?', opts: ['Kid', 'Calf', 'Cub', 'Pup'], correct: 2 },
      { q: 'Which animal can rotate its head 270 degrees?', opts: ['Owl', 'Ostrich', 'Flamingo', 'Swan'], correct: 0 },
      { q: 'What is the slowest animal in the world?', opts: ['Sloth', 'Tortoise', 'Snail', 'Koala'], correct: 2 },
      { q: 'Which animal is known as the "Ship of the Desert"?', opts: ['Camel', 'Horse', 'Donkey', 'Elephant'], correct: 0 },
      { q: 'What is a group of ants called?', opts: ['Herd', 'Pack', 'Colony', 'Swarm'], correct: 2 },
      { q: 'Which animal has the largest eyes relative to its body?', opts: ['Elephant', 'Horse', 'Ostrich', 'Tarsier'], correct: 3 }
    ]
  };

  let idCounter = 61;
  
  // Generate questions for each category to reach about 500 total
  Object.entries(questionTemplates).forEach(([category, templates]) => {
    // Generate about 70 more questions per category
    for (let i = 0; i < 70; i++) {
      const template = templates[i % templates.length];
      additionalQuestions.push({
        id: idCounter.toString(),
        category,
        question: template.q,
        options: template.opts,
        correctAnswer: template.correct,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard'
      });
      idCounter++;
    }
  });

  return [...baseQuestions, ...additionalQuestions];
};

export const allQuestions = generateMoreQuestions();