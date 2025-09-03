/**
 * Comprehensive trivia question collection
 * Organized by categories matching the existing game structure
 * 
 * To use: Add these templates to your questions.cjs file's templates object
 */

const moreTemplates = {
  History: [
    // Ancient History
    { q: 'Which ancient civilization built the Pyramids of Giza?', opts: ['Sumerians', 'Egyptians', 'Greeks', 'Romans'], correct: 1 },
    { q: 'The Trojan War was fought in which present-day country?', opts: ['Greece', 'Turkey', 'Italy', 'Cyprus'], correct: 1 },
    { q: 'Which Roman emperor built a massive wall across northern Britain?', opts: ['Julius Caesar', 'Augustus', 'Hadrian', 'Constantine'], correct: 2 },
    { q: 'What was the capital of the Byzantine Empire?', opts: ['Rome', 'Athens', 'Constantinople', 'Alexandria'], correct: 2 },
    { q: 'The ancient city of Petra is located in which modern country?', opts: ['Egypt', 'Jordan', 'Turkey', 'Lebanon'], correct: 1 },
    { q: 'Who was the legendary queen of ancient Egypt known for her relationship with Mark Antony?', opts: ['Nefertiti', 'Hatshepsut', 'Cleopatra', 'Isis'], correct: 2 },
    { q: 'Which philosopher taught Alexander the Great?', opts: ['Socrates', 'Plato', 'Aristotle', 'Pythagoras'], correct: 2 },
    { q: 'The Code of Hammurabi was created in which ancient civilization?', opts: ['Egyptian', 'Greek', 'Babylonian', 'Persian'], correct: 2 },
    { q: 'Which ancient civilization is credited with inventing the concept of zero?', opts: ['Egyptian', 'Greek', 'Chinese', 'Mayan'], correct: 3 },
    { q: 'The Oracle at Delphi was dedicated to which Greek god?', opts: ['Zeus', 'Apollo', 'Poseidon', 'Athena'], correct: 1 },
    
    // Medieval History
    { q: 'Who was the first Holy Roman Emperor?', opts: ['Frederick Barbarossa', 'Otto I', 'Charlemagne', 'Henry IV'], correct: 2 },
    { q: 'The Black Death pandemic peaked in Europe between which years?', opts: ['1146-1148', '1246-1248', '1346-1348', '1446-1448'], correct: 2 },
    { q: 'Which English king signed the Magna Carta in 1215?', opts: ['Richard I', 'John', 'Henry III', 'Edward I'], correct: 1 },
    { q: 'Joan of Arc was executed in which century?', opts: ['14th', '15th', '16th', '17th'], correct: 1 },
    { q: 'Which Mongol leader established the largest contiguous land empire in history?', opts: ['Kublai Khan', 'Genghis Khan', 'Timur', 'Ogedei Khan'], correct: 1 },
    
    // Modern History
    { q: 'In which year did Christopher Columbus first reach the Americas?', opts: ['1492', '1498', '1512', '1520'], correct: 0 },
    { q: 'The American Declaration of Independence was adopted in which year?', opts: ['1770', '1776', '1783', '1787'], correct: 1 },
    { q: 'Who was the first woman to win a Nobel Prize?', opts: ['Marie Curie', 'Jane Addams', 'Mother Teresa', 'Rosalind Franklin'], correct: 0 },
    { q: 'The Bolshevik Revolution took place in Russia in which year?', opts: ['1905', '1917', '1923', '1929'], correct: 1 },
    { q: 'Which country was the first to grant women the right to vote in national elections?', opts: ['United States', 'United Kingdom', 'France', 'New Zealand'], correct: 3 },
    { q: 'Which U.S. President delivered the Gettysburg Address?', opts: ['Thomas Jefferson', 'Andrew Jackson', 'Abraham Lincoln', 'Ulysses S. Grant'], correct: 2 },
    { q: 'The Berlin Wall fell in which year?', opts: ['1987', '1989', '1991', '1993'], correct: 1 },
    { q: 'Who was the first African American to serve as President of the United States?', opts: ['Martin Luther King Jr.', 'Barack Obama', 'Colin Powell', 'Nelson Mandela'], correct: 1 },
    { q: 'Which country was the first to reach the South Pole?', opts: ['United States', 'United Kingdom', 'Norway', 'Russia'], correct: 2 },
    { q: 'The Cuban Missile Crisis occurred during which decade?', opts: ['1950s', '1960s', '1970s', '1980s'], correct: 1 },
  ],

  Science: [
    // Biology
    { q: 'DNA is an abbreviation for what?', opts: ['Deoxyribonucleic acid', 'Diribonucleic acid', 'Deoxyribose nucleic acid', 'Dual nitrogen acid'], correct: 0 },
    { q: 'Which blood type is known as the universal donor?', opts: ['A+', 'B+', 'AB+', 'O-'], correct: 3 },
    { q: 'What is the largest internal organ in the human body?', opts: ['Heart', 'Liver', 'Lungs', 'Brain'], correct: 1 },
    { q: 'Which of these is NOT one of the four nucleotide bases in DNA?', opts: ['Adenine', 'Cytosine', 'Selenium', 'Thymine'], correct: 2 },
    { q: 'What is the process by which plants make their own food?', opts: ['Photosynthesis', 'Respiration', 'Fermentation', 'Digestion'], correct: 0 },
    { q: 'How many pairs of chromosomes are in human DNA?', opts: ['21', '22', '23', '24'], correct: 2 },
    { q: 'Which organelle is known as the "powerhouse of the cell"?', opts: ['Nucleus', 'Mitochondria', 'Endoplasmic reticulum', 'Golgi apparatus'], correct: 1 },
    { q: 'What is the most abundant gas in Earth\'s atmosphere?', opts: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correct: 2 },
    
    // Chemistry
    { q: 'What is the atomic number of carbon?', opts: ['4', '6', '8', '12'], correct: 1 },
    { q: 'Which of these is a noble gas?', opts: ['Nitrogen', 'Oxygen', 'Chlorine', 'Argon'], correct: 3 },
    { q: 'What is the pH of pure water at room temperature?', opts: ['5', '7', '9', '14'], correct: 1 },
    { q: 'Which element has the chemical symbol "Pb"?', opts: ['Lead', 'Potassium', 'Phosphorus', 'Platinum'], correct: 0 },
    { q: 'What is the most abundant element in the universe?', opts: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'], correct: 2 },
    { q: 'Which of these is NOT a state of matter?', opts: ['Solid', 'Liquid', 'Gas', 'Stone'], correct: 3 },
    { q: 'What is the chemical formula for table salt?', opts: ['H2O', 'CO2', 'NaCl', 'C6H12O6'], correct: 2 },
    { q: 'What does "Au" stand for on the periodic table?', opts: ['Aluminum', 'Arsenic', 'Silver', 'Gold'], correct: 3 },
    
    // Physics
    { q: 'What is Newton\'s First Law of Motion about?', opts: ['Gravity', 'Inertia', 'Acceleration', 'Thermodynamics'], correct: 1 },
    { q: 'What is the unit of electric current?', opts: ['Volt', 'Watt', 'Ampere', 'Ohm'], correct: 2 },
    { q: 'Which of these is NOT a fundamental force of nature?', opts: ['Gravity', 'Electromagnetism', 'Surface tension', 'Strong nuclear force'], correct: 2 },
    { q: 'What particle is exchanged in electromagnetic interactions?', opts: ['Gluon', 'Photon', 'W Boson', 'Graviton'], correct: 1 },
    { q: 'Which scientist proposed the theory of general relativity?', opts: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Stephen Hawking'], correct: 2 },
    { q: 'What is the speed of sound in air at sea level?', opts: ['343 m/s', '500 m/s', '1,000 m/s', '3,000 m/s'], correct: 0 },
    { q: 'Which subatomic particle has a positive charge?', opts: ['Proton', 'Electron', 'Neutron', 'Neutrino'], correct: 0 },
    { q: 'What is the SI unit of energy?', opts: ['Watt', 'Joule', 'Newton', 'Coulomb'], correct: 1 },
    
    // Space Science
    { q: 'How many planets are in our solar system?', opts: ['7', '8', '9', '10'], correct: 1 },
    { q: 'What is the name of our galaxy?', opts: ['Andromeda', 'Triangulum', 'Milky Way', 'Sombrero'], correct: 2 },
    { q: 'Which planet is known as the "Red Planet"?', opts: ['Jupiter', 'Venus', 'Mars', 'Mercury'], correct: 2 },
    { q: 'What is a star primarily composed of?', opts: ['Rock', 'Liquid metal', 'Ice', 'Gas'], correct: 3 },
    { q: 'What causes the tides on Earth?', opts: ['Wind', 'Moon\'s gravity', 'Earth\'s rotation', 'Ocean currents'], correct: 1 },
  ],

  Sports: [
    // Soccer/Football
    { q: 'How many players are in a standard soccer team on the field?', opts: ['9', '10', '11', '12'], correct: 2 },
    { q: 'In soccer, how many points is a goal worth?', opts: ['1', '2', '3', '4'], correct: 0 },
    { q: 'Which country won the most FIFA World Cup titles?', opts: ['Germany', 'Italy', 'Argentina', 'Brazil'], correct: 3 },
    { q: 'What color card indicates a player must leave the field in soccer?', opts: ['Yellow', 'Red', 'Blue', 'Black'], correct: 1 },
    { q: 'How long is a standard professional soccer match?', opts: ['45 minutes', '60 minutes', '90 minutes', '120 minutes'], correct: 2 },
    { q: 'Which soccer player is known as "CR7"?', opts: ['Cristiano Ronaldo', 'Lionel Messi', 'Neymar Jr.', 'Kylian Mbappé'], correct: 0 },
    
    // Basketball
    { q: 'How many points is a standard field goal worth in basketball?', opts: ['1', '2', '3', '4'], correct: 1 },
    { q: 'How many players from each team are on the basketball court at once?', opts: ['4', '5', '6', '7'], correct: 1 },
    { q: 'What is the height of a standard NBA basketball hoop?', opts: ['8 feet', '9 feet', '10 feet', '11 feet'], correct: 2 },
    { q: 'Which NBA player is nicknamed "King James"?', opts: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Shaquille O\'Neal'], correct: 2 },
    { q: 'How many periods are in a standard NBA game?', opts: ['2', '3', '4', '5'], correct: 2 },
    
    // Tennis
    { q: 'What is a score of zero called in tennis?', opts: ['Zero', 'Nil', 'Love', 'Duck'], correct: 2 },
    { q: 'How many Grand Slam tournaments are held each year?', opts: ['3', '4', '5', '6'], correct: 1 },
    { q: 'Which surface is Wimbledon played on?', opts: ['Hard court', 'Clay', 'Grass', 'Carpet'], correct: 2 },
    { q: 'In tennis scoring, what comes after 40?', opts: ['Game', 'Set', '45', 'Advantage'], correct: 0 },
    { q: 'Which tennis player has won the most Grand Slam titles in men\'s singles history?', opts: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Pete Sampras'], correct: 2 },
    
    // Olympics
    { q: 'How often are the Summer Olympics held?', opts: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], correct: 2 },
    { q: 'Which city hosted the first modern Olympic Games in 1896?', opts: ['Paris', 'London', 'Athens', 'Rome'], correct: 2 },
    { q: 'Which country has won the most Olympic medals in history?', opts: ['United States', 'Soviet Union', 'China', 'Great Britain'], correct: 0 },
    { q: 'In which sport would you perform a "vault"?', opts: ['Swimming', 'Gymnastics', 'Fencing', 'Archery'], correct: 1 },
    { q: 'Which of these is NOT an Olympic sport?', opts: ['Handball', 'Cricket', 'Water polo', 'Badminton'], correct: 1 },
    
    // American Sports
    { q: 'How many points is a touchdown worth in American football?', opts: ['3', '6', '7', '9'], correct: 1 },
    { q: 'How many innings are in a standard Major League Baseball game?', opts: ['7', '9', '11', '13'], correct: 1 },
    { q: 'Which team has won the most Super Bowl championships?', opts: ['Dallas Cowboys', 'San Francisco 49ers', 'New England Patriots', 'Pittsburgh Steelers'], correct: 2 },
    { q: 'In ice hockey, how many players from each team are on the ice at once?', opts: ['5', '6', '7', '8'], correct: 1 },
    { q: 'Which major league baseball team is known as the "Bronx Bombers"?', opts: ['Boston Red Sox', 'Chicago Cubs', 'New York Yankees', 'Los Angeles Dodgers'], correct: 2 },
  ],

  Entertainment: [
    // Movies
    { q: 'Which film won the Academy Award for Best Picture in 2019?', opts: ['Green Book', 'Roma', 'Black Panther', 'A Star Is Born'], correct: 0 },
    { q: 'Who directed the movie "Jaws"?', opts: ['Martin Scorsese', 'Steven Spielberg', 'Francis Ford Coppola', 'George Lucas'], correct: 1 },
    { q: 'Which actor played Jack Dawson in the movie "Titanic"?', opts: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Johnny Depp'], correct: 1 },
    { q: 'Which movie features a character named Forrest Gump?', opts: ['Saving Private Ryan', 'The Green Mile', 'Cast Away', 'Forrest Gump'], correct: 3 },
    { q: 'What was the first feature-length animated movie ever released?', opts: ['Pinocchio', 'Snow White and the Seven Dwarfs', 'Fantasia', 'Bambi'], correct: 1 },
    { q: 'Who is the voice of Woody in the "Toy Story" films?', opts: ['Tim Allen', 'Tom Hanks', 'John Ratzenberger', 'Billy Crystal'], correct: 1 },
    { q: 'Which film franchise features the character Harry Potter?', opts: ['Lord of the Rings', 'Harry Potter', 'Chronicles of Narnia', 'Twilight'], correct: 1 },
    { q: 'Which Marvel superhero is known as the "Merc with a Mouth"?', opts: ['Deadpool', 'Wolverine', 'Spider-Man', 'Iron Man'], correct: 0 },
    
    // Television
    { q: 'Which TV show features the character Walter White?', opts: ['Mad Men', 'Breaking Bad', 'The Wire', 'The Sopranos'], correct: 1 },
    { q: 'In "Friends," what is the name of Ross\'s second wife?', opts: ['Rachel', 'Emily', 'Carol', 'Janice'], correct: 1 },
    { q: 'Which TV show is set in the fictional continent of Westeros?', opts: ['The Witcher', 'Game of Thrones', 'Vikings', 'The Last Kingdom'], correct: 1 },
    { q: 'Who played the character of Michael Scott in "The Office" (US version)?', opts: ['John Krasinski', 'Rainn Wilson', 'Steve Carell', 'Ed Helms'], correct: 2 },
    { q: 'Which animated TV show is set in the town of Springfield?', opts: ['Family Guy', 'South Park', 'The Simpsons', 'Rick and Morty'], correct: 2 },
    { q: 'How many seasons does the TV show "Breaking Bad" have?', opts: ['4', '5', '6', '7'], correct: 1 },
    { q: 'Which TV show features a high school chemistry teacher who becomes a drug dealer?', opts: ['Ozark', 'Narcos', 'Breaking Bad', 'Better Call Saul'], correct: 2 },
    { q: 'In "The Big Bang Theory," what is Sheldon Cooper\'s catchphrase?', opts: ['Bazinga!', 'Holy cow!', 'Great Scott!', 'D\'oh!'], correct: 0 },
    
    // Music
    { q: 'Which band performed the song "Bohemian Rhapsody"?', opts: ['The Rolling Stones', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correct: 2 },
    { q: 'Who is known as the "King of Pop"?', opts: ['Elvis Presley', 'Michael Jackson', 'Prince', 'David Bowie'], correct: 1 },
    { q: 'Which instrument is Yo-Yo Ma famous for playing?', opts: ['Violin', 'Piano', 'Cello', 'Flute'], correct: 2 },
    { q: 'Which artist released the album "Back to Black" in 2006?', opts: ['Adele', 'Amy Winehouse', 'Beyoncé', 'Rihanna'], correct: 1 },
    { q: 'Who wrote the opera "The Marriage of Figaro"?', opts: ['Bach', 'Beethoven', 'Mozart', 'Wagner'], correct: 2 },
    { q: 'Which of these is NOT a member of The Beatles?', opts: ['John Lennon', 'Paul McCartney', 'George Harrison', 'Mick Jagger'], correct: 3 },
    { q: 'Which female artist released the album "21" in 2011?', opts: ['Taylor Swift', 'Adele', 'Beyoncé', 'Lady Gaga'], correct: 1 },
    { q: 'Which band is Freddie Mercury associated with?', opts: ['The Rolling Stones', 'Led Zeppelin', 'Queen', 'The Who'], correct: 2 },
    
    // Literature
    { q: 'Who wrote "Pride and Prejudice"?', opts: ['Emily Brontë', 'Charlotte Brontë', 'Jane Austen', 'Virginia Woolf'], correct: 2 },
    { q: 'Which Shakespearean play features the character Hamlet?', opts: ['Macbeth', 'King Lear', 'Hamlet', 'Othello'], correct: 2 },
    { q: 'Who is the author of "The Great Gatsby"?', opts: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'Mark Twain', 'William Faulkner'], correct: 0 },
    { q: 'In which fictional land is "The Chronicles of Narnia" primarily set?', opts: ['Middle-earth', 'Narnia', 'Westeros', 'Hogwarts'], correct: 1 },
    { q: 'Who wrote "War and Peace"?', opts: ['Fyodor Dostoevsky', 'Leo Tolstoy', 'Anton Chekhov', 'Ivan Turgenev'], correct: 1 },
  ],

  Geography: [
    // Countries and Capitals
    { q: 'What is the capital of Brazil?', opts: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correct: 2 },
    { q: 'Which country is the largest by land area?', opts: ['China', 'United States', 'Canada', 'Russia'], correct: 3 },
    { q: 'Which of these countries is NOT in Europe?', opts: ['Portugal', 'Romania', 'Morocco', 'Serbia'], correct: 2 },
    { q: 'Which country is known as the Land of the Rising Sun?', opts: ['China', 'Thailand', 'Japan', 'South Korea'], correct: 2 },
    { q: 'What is the capital of Australia?', opts: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correct: 2 },
    { q: 'Which country has the largest population?', opts: ['India', 'United States', 'Indonesia', 'China'], correct: 3 },
    { q: 'Bangkok is the capital of which country?', opts: ['Vietnam', 'Thailand', 'Malaysia', 'Cambodia'], correct: 1 },
    { q: 'Which country is known as the Land of Fire and Ice?', opts: ['Norway', 'Iceland', 'Finland', 'Greenland'], correct: 1 },
    
    // Natural Features
    { q: 'What is the longest river in the world?', opts: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correct: 1 },
    { q: 'Which mountain range separates Europe and Asia?', opts: ['Alps', 'Andes', 'Urals', 'Himalayas'], correct: 2 },
    { q: 'What is the deepest point in the world\'s oceans?', opts: ['Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'Tonga Trench'], correct: 0 },
    { q: 'Which desert is the largest hot desert in the world?', opts: ['Gobi', 'Arabian', 'Kalahari', 'Sahara'], correct: 3 },
    { q: 'Lake Baikal is located in which country?', opts: ['Mongolia', 'Kazakhstan', 'China', 'Russia'], correct: 3 },
    { q: 'Which waterfall is the tallest in the world?', opts: ['Victoria Falls', 'Niagara Falls', 'Angel Falls', 'Iguazu Falls'], correct: 2 },
    { q: 'The Great Barrier Reef is located near which country?', opts: ['Brazil', 'Australia', 'Thailand', 'Mexico'], correct: 1 },
    { q: 'Which African river features Victoria Falls?', opts: ['Nile', 'Niger', 'Congo', 'Zambezi'], correct: 3 },
    
    // World Geography
    { q: 'Which continent is the least populated?', opts: ['Antarctica', 'Australia', 'South America', 'Europe'], correct: 0 },
    { q: 'The Prime Meridian (0° longitude) passes through which city?', opts: ['Paris', 'London', 'New York', 'Madrid'], correct: 1 },
    { q: 'Which country is NOT a part of Scandinavia?', opts: ['Norway', 'Sweden', 'Denmark', 'Finland'], correct: 3 },
    { q: 'What is the world\'s largest archipelago?', opts: ['Philippines', 'Indonesia', 'Japan', 'Maldives'], correct: 1 },
    { q: 'Which of these cities is NOT located on the Mediterranean Sea?', opts: ['Barcelona', 'Lisbon', 'Naples', 'Athens'], correct: 1 },
    { q: 'The Strait of Gibraltar connects the Atlantic Ocean to which sea?', opts: ['Black Sea', 'Red Sea', 'Mediterranean Sea', 'Adriatic Sea'], correct: 2 },
    { q: 'Which country has the most natural lakes?', opts: ['Russia', 'United States', 'Canada', 'Brazil'], correct: 2 },
    { q: 'What is the name of the sea between Australia and New Zealand?', opts: ['Coral Sea', 'Tasman Sea', 'Solomon Sea', 'Timor Sea'], correct: 1 },
    
    // Cities
    { q: 'Which city is known as the "Eternal City"?', opts: ['Athens', 'Jerusalem', 'Rome', 'Cairo'], correct: 2 },
    { q: 'Which city is located on two continents?', opts: ['Moscow', 'Istanbul', 'Cairo', 'Dubai'], correct: 1 },
    { q: 'What is the most populated city in the world?', opts: ['Tokyo', 'Shanghai', 'Delhi', 'Mexico City'], correct: 0 },
    { q: 'Which city is known for its canals and is called the "Venice of the North"?', opts: ['Stockholm', 'Amsterdam', 'Copenhagen', 'St. Petersburg'], correct: 1 },
    { q: 'Which city hosted the first modern Olympic Games?', opts: ['Paris', 'London', 'Athens', 'Rome'], correct: 2 },
  ],

  Technology: [
    // Computer Science
    { q: 'What does CPU stand for?', opts: ['Central Processing Unit', 'Computer Personal Unit', 'Central Process Utility', 'Core Processing Unit'], correct: 0 },
    { q: 'Which company developed the Windows operating system?', opts: ['Apple', 'Microsoft', 'Google', 'IBM'], correct: 1 },
    { q: 'What does HTML stand for?', opts: ['Hyper Text Markup Language', 'High Tech Machine Learning', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correct: 0 },
    { q: 'Which programming language is known for being used in data science and machine learning?', opts: ['Java', 'C++', 'Python', 'Ruby'], correct: 2 },
    { q: 'What is the name of the world\'s first programmable electronic computer?', opts: ['UNIVAC', 'ENIAC', 'EDVAC', 'Harvard Mark I'], correct: 1 },
    { q: 'What does URL stand for?', opts: ['Universal Resource Locator', 'Uniform Resource Locator', 'Universal Reference Link', 'Uniform Reference Link'], correct: 1 },
    { q: 'Which of these is NOT a programming language?', opts: ['Python', 'Java', 'HTML', 'Photoshop'], correct: 3 },
    { q: 'What is the main function of a firewall in computer systems?', opts: ['Cool the CPU', 'Block unauthorized access', 'Speed up processing', 'Enhance graphics'], correct: 1 },
    
    // Tech Companies
    { q: 'Who founded Microsoft?', opts: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Jeff Bezos'], correct: 1 },
    { q: 'Which company created the iPhone?', opts: ['Google', 'Microsoft', 'Apple', 'Samsung'], correct: 2 },
    { q: 'What year was Facebook founded?', opts: ['2002', '2004', '2006', '2008'], correct: 1 },
    { q: 'Which company owns YouTube?', opts: ['Microsoft', 'Apple', 'Google', 'Amazon'], correct: 2 },
    { q: 'Which of these companies is known primarily for its search engine?', opts: ['Microsoft', 'Apple', 'Google', 'Amazon'], correct: 2 },
    { q: 'Who is the CEO of Tesla?', opts: ['Jeff Bezos', 'Tim Cook', 'Elon Musk', 'Satya Nadella'], correct: 2 },
    { q: 'Which company produces the PlayStation gaming console?', opts: ['Microsoft', 'Sony', 'Nintendo', 'Sega'], correct: 1 },
    { q: 'Which company is known for its "Think Different" slogan?', opts: ['Microsoft', 'Apple', 'IBM', 'Dell'], correct: 1 },
    
    // Internet
    { q: 'What does Wi-Fi stand for?', opts: ['Wireless Fidelity', 'Wireless Frequency', 'Wired Fiber', 'Wireless Finder'], correct: 0 },
    { q: 'Which protocol is used for sending email over the Internet?', opts: ['HTTP', 'FTP', 'SMTP', 'SSH'], correct: 2 },
    { q: 'Which of these is a popular web browser?', opts: ['Excel', 'PowerPoint', 'Chrome', 'Photoshop'], correct: 2 },
    { q: 'What is the most widely used social media platform as of 2023?', opts: ['Instagram', 'Twitter', 'Facebook', 'TikTok'], correct: 2 },
    { q: 'What does SSL stand for in web technology?', opts: ['Secure Socket Layer', 'System Standard Link', 'Safe Server Login', 'Standard System Language'], correct: 0 },
    { q: 'Which company operates the app store "Google Play"?', opts: ['Microsoft', 'Apple', 'Google', 'Amazon'], correct: 2 },
    { q: 'What is the main purpose of a VPN?', opts: ['Increase internet speed', 'Store files online', 'Protect privacy online', 'Edit photos'], correct: 2 },
    { q: 'What does IoT stand for?', opts: ['Internet of Things', 'Internet of Technology', 'Integrated Online Technology', 'International Online Tracking'], correct: 0 },
    
    // Gadgets and Devices
    { q: 'Which company manufactures the Galaxy series of smartphones?', opts: ['Apple', 'Google', 'Samsung', 'Huawei'], correct: 2 },
    { q: 'What is the name of Amazon\'s virtual assistant?', opts: ['Siri', 'Alexa', 'Cortana', 'Google Assistant'], correct: 1 },
    { q: 'What does SSD stand for in computer storage?', opts: ['Solid State Drive', 'Secure Software Download', 'System Storage Device', 'Standard Storage Disk'], correct: 0 },
    { q: 'Which of these is NOT a type of computer monitor?', opts: ['LCD', 'LED', 'MRI', 'OLED'], correct: 2 },
    { q: 'Which device is used to connect a computer to the internet via phone lines?', opts: ['Router', 'Modem', 'Hub', 'Switch'], correct: 1 },
    { q: 'What kind of device is a Fitbit?', opts: ['Smartphone', 'Tablet', 'Wearable fitness tracker', 'Virtual reality headset'], correct: 2 },
    { q: 'Which company created the virtual reality headset "Oculus Rift"?', opts: ['Sony', 'Microsoft', 'Facebook (Meta)', 'HTC'], correct: 2 },
    { q: 'What year was the first iPad released?', opts: ['2008', '2010', '2012', '2014'], correct: 1 },
  ],
};

// To use: Add these template questions to your existing templates in questions.cjs
