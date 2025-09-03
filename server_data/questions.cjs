// Server-side questions dataset (CommonJS)
// Generates a large pool of trivia questions across categories

const baseQuestions = [
  { id: '1', category: 'History', question: 'Who was the first President of the United States?', options: ['George Washington', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin'], correctAnswer: 0, difficulty: 'easy' },
  { id: '2', category: 'History', question: 'In which year did World War II end?', options: ['1944', '1945', '1946', '1947'], correctAnswer: 1, difficulty: 'easy' },
  { id: '11', category: 'Science', question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 2, difficulty: 'easy' },
  { id: '12', category: 'Science', question: 'How many bones are in the adult human body?', options: ['206', '208', '210', '212'], correctAnswer: 0, difficulty: 'medium' },
  { id: '21', category: 'Sports', question: 'How many players are on a basketball team on the court at once?', options: ['4', '5', '6', '7'], correctAnswer: 1, difficulty: 'easy' },
  { id: '22', category: 'Sports', question: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Argentina', 'Brazil', 'Italy'], correctAnswer: 2, difficulty: 'medium' },
  { id: '31', category: 'Entertainment', question: 'Who directed the movie "Jaws"?', options: ['George Lucas', 'Steven Spielberg', 'Martin Scorsese', 'Francis Ford Coppola'], correctAnswer: 1, difficulty: 'medium' },
  { id: '32', category: 'Entertainment', question: 'Which movie features the song "My Heart Will Go On"?', options: ['The Bodyguard', 'Ghost', 'Titanic', 'Dirty Dancing'], correctAnswer: 2, difficulty: 'easy' },
  { id: '41', category: 'Geography', question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctAnswer: 2, difficulty: 'medium' },
  { id: '42', category: 'Geography', question: 'Which is the longest river in the world?', options: ['Amazon River', 'Nile River', 'Mississippi River', 'Yangtze River'], correctAnswer: 1, difficulty: 'medium' },
  { id: '51', category: 'Technology', question: 'What does "WWW" stand for?', options: ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'], correctAnswer: 0, difficulty: 'easy' },
  { id: '52', category: 'Technology', question: 'Who founded Microsoft?', options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Larry Page'], correctAnswer: 1, difficulty: 'easy' },
];

const templates = {
  History: [
    // Original questions
    { q: 'Which emperor built the Colosseum?', opts: ['Nero', 'Vespasian', 'Augustus', 'Trajan'], correct: 1 },
    { q: 'The French Revolution began in which year?', opts: ['1787', '1789', '1791', '1793'], correct: 1 },
    { q: 'Which civilization built Machu Picchu?', opts: ['Aztecs', 'Mayans', 'Incas', 'Olmecs'], correct: 2 },
    // Previously added questions
    { q: 'Who painted the Mona Lisa?', opts: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'], correct: 1 },
    { q: 'Which ancient wonder was located in Alexandria?', opts: ['Great Pyramid', 'Hanging Gardens', 'Lighthouse', 'Colossus'], correct: 2 },
    { q: 'Who was the first woman to fly solo across the Atlantic?', opts: ['Amelia Earhart', 'Bessie Coleman', 'Harriet Quimby', 'Jacqueline Cochran'], correct: 0 },
    { q: 'The Great Wall of China was built primarily during which dynasty?', opts: ['Tang', 'Song', 'Ming', 'Qing'], correct: 2 },
    { q: 'Which country was formerly known as Rhodesia?', opts: ['Tanzania', 'Zimbabwe', 'Namibia', 'Botswana'], correct: 1 },
    { q: 'Who discovered penicillin?', opts: ['Louis Pasteur', 'Alexander Fleming', 'Joseph Lister', 'Robert Koch'], correct: 1 },
    { q: 'Which treaty ended World War I?', opts: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Tordesillas', 'Treaty of Westphalia'], correct: 0 },
    
    // New comprehensive questions
    { q: 'Which ancient civilization built the Pyramids of Giza?', opts: ['Sumerians', 'Egyptians', 'Greeks', 'Romans'], correct: 1 },
    { q: 'The Trojan War was fought in which present-day country?', opts: ['Greece', 'Turkey', 'Italy', 'Cyprus'], correct: 1 },
    { q: 'Which Roman emperor built a massive wall across northern Britain?', opts: ['Julius Caesar', 'Augustus', 'Hadrian', 'Constantine'], correct: 2 },
    { q: 'What was the capital of the Byzantine Empire?', opts: ['Rome', 'Athens', 'Constantinople', 'Alexandria'], correct: 2 },
    { q: 'The ancient city of Petra is located in which modern country?', opts: ['Egypt', 'Jordan', 'Turkey', 'Lebanon'], correct: 1 },
    { q: 'Who was the legendary queen of ancient Egypt known for her relationship with Mark Antony?', opts: ['Nefertiti', 'Hatshepsut', 'Cleopatra', 'Isis'], correct: 2 },
    { q: 'Which philosopher taught Alexander the Great?', opts: ['Socrates', 'Plato', 'Aristotle', 'Pythagoras'], correct: 2 },
    { q: 'The Code of Hammurabi was created in which ancient civilization?', opts: ['Egyptian', 'Greek', 'Babylonian', 'Persian'], correct: 2 },
    { q: 'Who was the first Holy Roman Emperor?', opts: ['Frederick Barbarossa', 'Otto I', 'Charlemagne', 'Henry IV'], correct: 2 },
    { q: 'The Black Death pandemic peaked in Europe between which years?', opts: ['1146-1148', '1246-1248', '1346-1348', '1446-1448'], correct: 2 },
    { q: 'Which English king signed the Magna Carta in 1215?', opts: ['Richard I', 'John', 'Henry III', 'Edward I'], correct: 1 },
    { q: 'In which year did Christopher Columbus first reach the Americas?', opts: ['1492', '1498', '1512', '1520'], correct: 0 },
    { q: 'The American Declaration of Independence was adopted in which year?', opts: ['1770', '1776', '1783', '1787'], correct: 1 },
    { q: 'Who was the first woman to win a Nobel Prize?', opts: ['Marie Curie', 'Jane Addams', 'Mother Teresa', 'Rosalind Franklin'], correct: 0 },
    { q: 'The Berlin Wall fell in which year?', opts: ['1987', '1989', '1991', '1993'], correct: 1 },
    { q: 'Who was the first African American to serve as President of the United States?', opts: ['Martin Luther King Jr.', 'Barack Obama', 'Colin Powell', 'Nelson Mandela'], correct: 1 },
  ],

  Science: [
    // Original questions
    { q: 'What is the chemical formula for water?', opts: ['H2O', 'CO2', 'NaCl', 'CH4'], correct: 0 },
    { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 },
    { q: 'What is the largest organ in the human body?', opts: ['Liver', 'Brain', 'Heart', 'Skin'], correct: 3 },
    // Previously added questions
    { q: 'What is the hardest natural substance on Earth?', opts: ['Gold', 'Titanium', 'Diamond', 'Platinum'], correct: 2 },
    { q: 'What is the speed of light?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correct: 0 },
    { q: 'Which element has the chemical symbol "Fe"?', opts: ['Iron', 'Fluorine', 'Francium', 'Fermium'], correct: 0 },
    { q: 'What is the primary gas found in the Earth\'s atmosphere?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correct: 2 },
    { q: 'How many chromosomes are in human DNA?', opts: ['42', '44', '46', '48'], correct: 2 },
    { q: 'Which planet has the most moons?', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correct: 1 },
    { q: 'What is the smallest unit of matter?', opts: ['Atom', 'Electron', 'Proton', 'Quark'], correct: 3 },
    
    // New comprehensive questions
    { q: 'DNA is an abbreviation for what?', opts: ['Deoxyribonucleic acid', 'Diribonucleic acid', 'Deoxyribose nucleic acid', 'Dual nitrogen acid'], correct: 0 },
    { q: 'Which blood type is known as the universal donor?', opts: ['A+', 'B+', 'AB+', 'O-'], correct: 3 },
    { q: 'Which of these is NOT one of the four nucleotide bases in DNA?', opts: ['Adenine', 'Cytosine', 'Selenium', 'Thymine'], correct: 2 },
    { q: 'What is the process by which plants make their own food?', opts: ['Photosynthesis', 'Respiration', 'Fermentation', 'Digestion'], correct: 0 },
    { q: 'Which organelle is known as the "powerhouse of the cell"?', opts: ['Nucleus', 'Mitochondria', 'Endoplasmic reticulum', 'Golgi apparatus'], correct: 1 },
    { q: 'What is the atomic number of carbon?', opts: ['4', '6', '8', '12'], correct: 1 },
    { q: 'Which of these is a noble gas?', opts: ['Nitrogen', 'Oxygen', 'Chlorine', 'Argon'], correct: 3 },
    { q: 'What is the pH of pure water at room temperature?', opts: ['5', '7', '9', '14'], correct: 1 },
    { q: 'What is the most abundant element in the universe?', opts: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'], correct: 2 },
    { q: 'What is Newton\'s First Law of Motion about?', opts: ['Gravity', 'Inertia', 'Acceleration', 'Thermodynamics'], correct: 1 },
    { q: 'What is the unit of electric current?', opts: ['Volt', 'Watt', 'Ampere', 'Ohm'], correct: 2 },
    { q: 'Which scientist proposed the theory of general relativity?', opts: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Stephen Hawking'], correct: 2 },
    { q: 'What is the speed of sound in air at sea level?', opts: ['343 m/s', '500 m/s', '1,000 m/s', '3,000 m/s'], correct: 0 },
    { q: 'What is the name of our galaxy?', opts: ['Andromeda', 'Triangulum', 'Milky Way', 'Sombrero'], correct: 2 },
    { q: 'Which planet is known as the "Red Planet"?', opts: ['Jupiter', 'Venus', 'Mars', 'Mercury'], correct: 2 },
  ],

  Sports: [
    // Original questions
    { q: 'Which sport is known as "the beautiful game"?', opts: ['Basketball', 'Tennis', 'Soccer', 'Baseball'], correct: 2 },
    { q: 'How many Grand Slam tournaments are there in tennis?', opts: ['3', '4', '5', '6'], correct: 1 },
    { q: 'In golf, what is one under par called?', opts: ['Eagle', 'Birdie', 'Bogey', 'Albatross'], correct: 1 },
    // Previously added questions
    { q: 'How many players are on a standard soccer team?', opts: ['9', '10', '11', '12'], correct: 2 },
    { q: 'Which country won the 2018 FIFA World Cup?', opts: ['Brazil', 'Germany', 'France', 'Spain'], correct: 2 },
    { q: 'In which sport would you perform a slam dunk?', opts: ['Volleyball', 'Basketball', 'Tennis', 'Football'], correct: 1 },
    { q: 'How many rings are on the Olympic flag?', opts: ['4', '5', '6', '7'], correct: 1 },
    { q: 'Which athlete has won the most Olympic gold medals?', opts: ['Usain Bolt', 'Michael Phelps', 'Simone Biles', 'Carl Lewis'], correct: 1 },
    { q: 'In baseball, how many strikes constitute a strikeout?', opts: ['2', '3', '4', '5'], correct: 1 },
    { q: 'Which is the only team to play in every FIFA World Cup?', opts: ['Germany', 'Italy', 'Argentina', 'Brazil'], correct: 3 },
    
    // New comprehensive questions
    { q: 'In soccer, how many points is a goal worth?', opts: ['1', '2', '3', '4'], correct: 0 },
    { q: 'What color card indicates a player must leave the field in soccer?', opts: ['Yellow', 'Red', 'Blue', 'Black'], correct: 1 },
    { q: 'How long is a standard professional soccer match?', opts: ['45 minutes', '60 minutes', '90 minutes', '120 minutes'], correct: 2 },
    { q: 'Which soccer player is known as "CR7"?', opts: ['Cristiano Ronaldo', 'Lionel Messi', 'Neymar Jr.', 'Kylian Mbappé'], correct: 0 },
    { q: 'How many points is a standard field goal worth in basketball?', opts: ['1', '2', '3', '4'], correct: 1 },
    { q: 'What is the height of a standard NBA basketball hoop?', opts: ['8 feet', '9 feet', '10 feet', '11 feet'], correct: 2 },
    { q: 'Which NBA player is nicknamed "King James"?', opts: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Shaquille O\'Neal'], correct: 2 },
    { q: 'How many periods are in a standard NBA game?', opts: ['2', '3', '4', '5'], correct: 2 },
    { q: 'What is a score of zero called in tennis?', opts: ['Zero', 'Nil', 'Love', 'Duck'], correct: 2 },
    { q: 'Which surface is Wimbledon played on?', opts: ['Hard court', 'Clay', 'Grass', 'Carpet'], correct: 2 },
    { q: 'How often are the Summer Olympics held?', opts: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], correct: 2 },
    { q: 'How many points is a touchdown worth in American football?', opts: ['3', '6', '7', '9'], correct: 1 },
    { q: 'How many innings are in a standard Major League Baseball game?', opts: ['7', '9', '11', '13'], correct: 1 },
    { q: 'In ice hockey, how many players from each team are on the ice at once?', opts: ['5', '6', '7', '8'], correct: 1 },
    { q: 'Which major league baseball team is known as the "Bronx Bombers"?', opts: ['Boston Red Sox', 'Chicago Cubs', 'New York Yankees', 'Los Angeles Dodgers'], correct: 2 },
  ],

  Entertainment: [
    // Original questions
    { q: 'Which movie won Best Picture in 2020?', opts: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'], correct: 2 },
    { q: 'Which superhero is known as the "Man of Steel"?', opts: ['Batman', 'Spider-Man', 'Superman', 'Iron Man'], correct: 2 },
    { q: 'Which streaming platform created "The Crown"?', opts: ['Amazon Prime', 'Hulu', 'Netflix', 'Disney+'], correct: 2 },
    // Previously added questions
    { q: 'Who played Iron Man in the Marvel Cinematic Universe?', opts: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correct: 2 },
    { q: 'Which band released the album "Abbey Road"?', opts: ['The Rolling Stones', 'The Beatles', 'Led Zeppelin', 'Pink Floyd'], correct: 1 },
    { q: 'Which animated film features the song "Let It Go"?', opts: ['Tangled', 'Brave', 'Moana', 'Frozen'], correct: 3 },
    { q: 'Who wrote the Harry Potter series?', opts: ['J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis', 'Roald Dahl'], correct: 1 },
    { q: 'Which TV series features dragons and "White Walkers"?', opts: ['The Witcher', 'Game of Thrones', 'Lord of the Rings', 'House of the Dragon'], correct: 1 },
    { q: 'Who directed the film "Pulp Fiction"?', opts: ['Martin Scorsese', 'Quentin Tarantino', 'Christopher Nolan', 'David Fincher'], correct: 1 },
    { q: 'Which country has won the most Eurovision Song Contests?', opts: ['Sweden', 'United Kingdom', 'Ireland', 'France'], correct: 0 },
    
    // New comprehensive questions
    { q: 'Which film won the Academy Award for Best Picture in 2019?', opts: ['Green Book', 'Roma', 'Black Panther', 'A Star Is Born'], correct: 0 },
    { q: 'Which actor played Jack Dawson in the movie "Titanic"?', opts: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Johnny Depp'], correct: 1 },
    { q: 'Which movie features a character named Forrest Gump?', opts: ['Saving Private Ryan', 'The Green Mile', 'Cast Away', 'Forrest Gump'], correct: 3 },
    { q: 'What was the first feature-length animated movie ever released?', opts: ['Pinocchio', 'Snow White and the Seven Dwarfs', 'Fantasia', 'Bambi'], correct: 1 },
    { q: 'Who is the voice of Woody in the "Toy Story" films?', opts: ['Tim Allen', 'Tom Hanks', 'John Ratzenberger', 'Billy Crystal'], correct: 1 },
    { q: 'Which TV show features the character Walter White?', opts: ['Mad Men', 'Breaking Bad', 'The Wire', 'The Sopranos'], correct: 1 },
    { q: 'In "Friends," what is the name of Ross\'s second wife?', opts: ['Rachel', 'Emily', 'Carol', 'Janice'], correct: 1 },
    { q: 'Who played the character of Michael Scott in "The Office" (US version)?', opts: ['John Krasinski', 'Rainn Wilson', 'Steve Carell', 'Ed Helms'], correct: 2 },
    { q: 'Which animated TV show is set in the town of Springfield?', opts: ['Family Guy', 'South Park', 'The Simpsons', 'Rick and Morty'], correct: 2 },
    { q: 'Which band performed the song "Bohemian Rhapsody"?', opts: ['The Rolling Stones', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correct: 2 },
    { q: 'Who is known as the "King of Pop"?', opts: ['Elvis Presley', 'Michael Jackson', 'Prince', 'David Bowie'], correct: 1 },
    { q: 'Which instrument is Yo-Yo Ma famous for playing?', opts: ['Violin', 'Piano', 'Cello', 'Flute'], correct: 2 },
    { q: 'Who wrote "Pride and Prejudice"?', opts: ['Emily Brontë', 'Charlotte Brontë', 'Jane Austen', 'Virginia Woolf'], correct: 2 },
    { q: 'Which Shakespearean play features the character Hamlet?', opts: ['Macbeth', 'King Lear', 'Hamlet', 'Othello'], correct: 2 },
    { q: 'Who is the author of "The Great Gatsby"?', opts: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'Mark Twain', 'William Faulkner'], correct: 0 },
  ],

  Geography: [
    // Original questions
    { q: 'Which is the largest ocean?', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
    { q: 'What is the capital of Japan?', opts: ['Osaka', 'Tokyo', 'Kyoto', 'Nagoya'], correct: 1 },
    { q: 'Which river flows through Egypt?', opts: ['Euphrates', 'Tigris', 'Nile', 'Jordan'], correct: 2 },
    // Previously added questions
    { q: 'What is the largest desert in the world?', opts: ['Gobi', 'Kalahari', 'Sahara', 'Antarctic'], correct: 3 },
    { q: 'Which mountain is the highest in the world?', opts: ['K2', 'Kilimanjaro', 'Everest', 'Denali'], correct: 2 },
    { q: 'How many continents are there?', opts: ['5', '6', '7', '8'], correct: 2 },
    { q: 'Which is the smallest country in the world?', opts: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 1 },
    { q: 'Which city is the capital of Canada?', opts: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correct: 3 },
    { q: 'Which African country has the most pyramids?', opts: ['Egypt', 'Sudan', 'Libya', 'Algeria'], correct: 1 },
    { q: 'What is the largest island in the world?', opts: ['Madagascar', 'New Guinea', 'Borneo', 'Greenland'], correct: 3 },
    
    // New comprehensive questions
    { q: 'What is the capital of Brazil?', opts: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correct: 2 },
    { q: 'Which country is the largest by land area?', opts: ['China', 'United States', 'Canada', 'Russia'], correct: 3 },
    { q: 'Which of these countries is NOT in Europe?', opts: ['Portugal', 'Romania', 'Morocco', 'Serbia'], correct: 2 },
    { q: 'Which country is known as the Land of the Rising Sun?', opts: ['China', 'Thailand', 'Japan', 'South Korea'], correct: 2 },
    { q: 'Which country has the largest population?', opts: ['India', 'United States', 'Indonesia', 'China'], correct: 3 },
    { q: 'Bangkok is the capital of which country?', opts: ['Vietnam', 'Thailand', 'Malaysia', 'Cambodia'], correct: 1 },
    { q: 'Which country is known as the Land of Fire and Ice?', opts: ['Norway', 'Iceland', 'Finland', 'Greenland'], correct: 1 },
    { q: 'What is the longest river in the world?', opts: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correct: 1 },
    { q: 'Which mountain range separates Europe and Asia?', opts: ['Alps', 'Andes', 'Urals', 'Himalayas'], correct: 2 },
    { q: 'What is the deepest point in the world\'s oceans?', opts: ['Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'Tonga Trench'], correct: 0 },
    { q: 'Lake Baikal is located in which country?', opts: ['Mongolia', 'Kazakhstan', 'China', 'Russia'], correct: 3 },
    { q: 'Which waterfall is the tallest in the world?', opts: ['Victoria Falls', 'Niagara Falls', 'Angel Falls', 'Iguazu Falls'], correct: 2 },
    { q: 'Which continent is the least populated?', opts: ['Antarctica', 'Australia', 'South America', 'Europe'], correct: 0 },
    { q: 'The Prime Meridian (0° longitude) passes through which city?', opts: ['Paris', 'London', 'New York', 'Madrid'], correct: 1 },
    { q: 'Which city is known as the "Eternal City"?', opts: ['Athens', 'Jerusalem', 'Rome', 'Cairo'], correct: 2 },
  ],

  Technology: [
    // Original questions
    { q: 'What does "HTTP" stand for?', opts: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transport Protocol', 'High Text Transfer Protocol'], correct: 0 },
    { q: 'Which language was created by Guido van Rossum?', opts: ['Java', 'Python', 'C++', 'JavaScript'], correct: 1 },
    { q: 'Which company owns Instagram?', opts: ['Google', 'Twitter', 'Meta (Facebook)', 'Microsoft'], correct: 2 },
    // Previously added questions
    { q: 'In which year was the first iPhone released?', opts: ['2005', '2007', '2009', '2011'], correct: 1 },
    { q: 'What does CPU stand for?', opts: ['Central Processing Unit', 'Computer Personal Unit', 'Central Personal Utility', 'Computer Processing Utility'], correct: 0 },
    { q: 'Who is the co-founder of Microsoft alongside Bill Gates?', opts: ['Steve Jobs', 'Paul Allen', 'Mark Zuckerberg', 'Elon Musk'], correct: 1 },
    { q: 'Which programming language is named after a snake?', opts: ['Java', 'C++', 'Python', 'Ruby'], correct: 2 },
    { q: 'What is the main component of solar panels?', opts: ['Silicon', 'Aluminum', 'Copper', 'Graphite'], correct: 0 },
    { q: 'Which company developed the Android operating system?', opts: ['Apple', 'Microsoft', 'Google', 'Samsung'], correct: 2 },
    { q: 'What does "IoT" stand for?', opts: ['Internet of Technology', 'Internet of Things', 'Integration of Technology', 'Integration of Things'], correct: 1 },
    
    // New comprehensive questions
    { q: 'Which company developed the Windows operating system?', opts: ['Apple', 'Microsoft', 'Google', 'IBM'], correct: 1 },
    { q: 'What does HTML stand for?', opts: ['Hyper Text Markup Language', 'High Tech Machine Learning', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0 },
    { q: 'Which programming language is known for being used in data science and machine learning?', opts: ['Java', 'C++', 'Python', 'Ruby'], correct: 2 },
    { q: 'What is the name of the world\'s first programmable electronic computer?', opts: ['UNIVAC', 'ENIAC', 'EDVAC', 'Harvard Mark I'], correct: 1 },
    { q: 'What does URL stand for?', opts: ['Universal Resource Locator', 'Uniform Resource Locator', 'Universal Reference Link', 'Uniform Reference Link'], correct: 1 },
    { q: 'Which of these is NOT a programming language?', opts: ['Python', 'Java', 'HTML', 'Photoshop'], correct: 3 },
    { q: 'What is the main function of a firewall in computer systems?', opts: ['Cool the CPU', 'Block unauthorized access', 'Speed up processing', 'Enhance graphics'], correct: 1 },
    { q: 'Which company created the iPhone?', opts: ['Google', 'Microsoft', 'Apple', 'Samsung'], correct: 2 },
    { q: 'What year was Facebook founded?', opts: ['2002', '2004', '2006', '2008'], correct: 1 },
    { q: 'Which company owns YouTube?', opts: ['Microsoft', 'Apple', 'Google', 'Amazon'], correct: 2 },
    { q: 'Who is the CEO of Tesla?', opts: ['Jeff Bezos', 'Tim Cook', 'Elon Musk', 'Satya Nadella'], correct: 2 },
    { q: 'Which company produces the PlayStation gaming console?', opts: ['Microsoft', 'Sony', 'Nintendo', 'Sega'], correct: 1 },
    { q: 'What does Wi-Fi stand for?', opts: ['Wireless Fidelity', 'Wireless Frequency', 'Wired Fiber', 'Wireless Finder'], correct: 0 },
    { q: 'Which protocol is used for sending email over the Internet?', opts: ['HTTP', 'FTP', 'SMTP', 'SSH'], correct: 2 },
    { q: 'Which of these is a popular web browser?', opts: ['Excel', 'PowerPoint', 'Chrome', 'Photoshop'], correct: 2 },
  ],
};

function generateAdditionalQuestions(total = 1000) {
  const additional = [];
  let id = 1000; // keep IDs well clear of base
  const categories = Object.keys(templates);
  let i = 0;
  while (additional.length < total) {
    const cat = categories[i % categories.length];
    const arr = templates[cat];
    const t = arr[i % arr.length];
    additional.push({
      id: String(id++),
      category: cat,
      question: t.q,
      options: t.opts,
      correctAnswer: t.correct,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
    });
    i++;
  }
  return additional;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const allQuestions = shuffle([...baseQuestions, ...generateAdditionalQuestions(1000)]);

module.exports = { allQuestions };
