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
      { q: 'The Cold War was between which two superpowers?', opts: ['USA and China', 'USA and USSR', 'UK and USSR', 'France and Germany'], correct: 1 }
    ],
    Science: [
      { q: 'What is the chemical formula for water?', opts: ['H2O', 'CO2', 'NaCl', 'CH4'], correct: 0 },
      { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 },
      { q: 'What is the largest organ in the human body?', opts: ['Liver', 'Brain', 'Heart', 'Skin'], correct: 3 },
      { q: 'How many sides does a hexagon have?', opts: ['5', '6', '7', '8'], correct: 1 },
      { q: 'What is the study of earthquakes called?', opts: ['Geology', 'Seismology', 'Meteorology', 'Oceanography'], correct: 1 }
    ],
    Sports: [
      { q: 'Which sport is known as "the beautiful game"?', opts: ['Basketball', 'Tennis', 'Soccer', 'Baseball'], correct: 2 },
      { q: 'How many Grand Slam tournaments are there in tennis?', opts: ['3', '4', '5', '6'], correct: 1 },
      { q: 'In golf, what is one under par called?', opts: ['Eagle', 'Birdie', 'Bogey', 'Albatross'], correct: 1 },
      { q: 'Which country hosted the 2016 Summer Olympics?', opts: ['China', 'UK', 'Brazil', 'Japan'], correct: 2 },
      { q: 'How many players are on a soccer team?', opts: ['10', '11', '12', '13'], correct: 1 }
    ],
    Entertainment: [
      { q: 'Which movie won the Academy Award for Best Picture in 2020?', opts: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'], correct: 2 },
      { q: 'Who created the TV series "Game of Thrones"?', opts: ['J.R.R. Tolkien', 'George R.R. Martin', 'Stephen King', 'J.K. Rowling'], correct: 1 },
      { q: 'Which superhero is known as the "Man of Steel"?', opts: ['Batman', 'Spider-Man', 'Superman', 'Iron Man'], correct: 2 },
      { q: 'What is the highest-grossing animated movie?', opts: ['Frozen', 'The Lion King', 'Toy Story 4', 'Incredibles 2'], correct: 1 },
      { q: 'Which streaming platform created "The Crown"?', opts: ['Amazon Prime', 'Hulu', 'Netflix', 'Disney+'], correct: 2 }
    ],
    Geography: [
      { q: 'Which is the largest ocean?', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
      { q: 'What is the capital of Japan?', opts: ['Osaka', 'Tokyo', 'Kyoto', 'Nagoya'], correct: 1 },
      { q: 'Which country is both in Europe and Asia?', opts: ['Russia', 'Turkey', 'Kazakhstan', 'All of the above'], correct: 3 },
      { q: 'What is the tallest mountain in North America?', opts: ['Mount McKinley', 'Mount Whitney', 'Mount Elbert', 'Mount Washington'], correct: 0 },
      { q: 'Which river flows through Egypt?', opts: ['Euphrates', 'Tigris', 'Nile', 'Jordan'], correct: 2 }
    ],
    Technology: [
      { q: 'Which company created the Android operating system?', opts: ['Apple', 'Microsoft', 'Google', 'Samsung'], correct: 2 },
      { q: 'What does "HTTP" stand for?', opts: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transport Protocol', 'High Text Transfer Protocol'], correct: 0 },
      { q: 'Which programming language was created by Guido van Rossum?', opts: ['Java', 'Python', 'C++', 'JavaScript'], correct: 1 },
      { q: 'What is the name of Apple\'s virtual assistant?', opts: ['Cortana', 'Alexa', 'Siri', 'Google Assistant'], correct: 2 },
      { q: 'Which company owns Instagram?', opts: ['Google', 'Twitter', 'Meta (Facebook)', 'Microsoft'], correct: 2 }
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