/**
 * Additional questions to enhance your trivia game
 * Organized by categories matching your existing setup
 * Just copy these templates into your questions.cjs file
 */

const additionalTemplates = {
  History: [
    { q: 'Who painted the Mona Lisa?', opts: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'], correct: 1 },
    { q: 'Which ancient wonder was located in Alexandria?', opts: ['Great Pyramid', 'Hanging Gardens', 'Lighthouse', 'Colossus'], correct: 2 },
    { q: 'Who was the first woman to fly solo across the Atlantic?', opts: ['Amelia Earhart', 'Bessie Coleman', 'Harriet Quimby', 'Jacqueline Cochran'], correct: 0 },
    { q: 'The Great Wall of China was built primarily during which dynasty?', opts: ['Tang', 'Song', 'Ming', 'Qing'], correct: 2 },
    { q: 'Which country was formerly known as Rhodesia?', opts: ['Tanzania', 'Zimbabwe', 'Namibia', 'Botswana'], correct: 1 },
    { q: 'Who discovered penicillin?', opts: ['Louis Pasteur', 'Alexander Fleming', 'Joseph Lister', 'Robert Koch'], correct: 1 },
    { q: 'Which treaty ended World War I?', opts: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Tordesillas', 'Treaty of Westphalia'], correct: 0 },
    { q: 'The Magna Carta was signed in what year?', opts: ['1066', '1215', '1492', '1776'], correct: 1 },
    { q: 'Who was the first female Prime Minister of the United Kingdom?', opts: ['Theresa May', 'Margaret Thatcher', 'Angela Merkel', 'Jacinda Ardern'], correct: 1 },
    { q: 'Which civilization built the pyramids at Giza?', opts: ['Mesopotamian', 'Egyptian', 'Greek', 'Roman'], correct: 1 },
  ],
  Science: [
    { q: 'What is the hardest natural substance on Earth?', opts: ['Gold', 'Titanium', 'Diamond', 'Platinum'], correct: 2 },
    { q: 'What is the speed of light?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correct: 0 },
    { q: 'Which element has the chemical symbol "Fe"?', opts: ['Iron', 'Fluorine', 'Francium', 'Fermium'], correct: 0 },
    { q: 'What is the primary gas found in the Earth\'s atmosphere?', opts: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correct: 2 },
    { q: 'How many chromosomes are in human DNA?', opts: ['42', '44', '46', '48'], correct: 2 },
    { q: 'Which planet has the most moons?', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correct: 1 },
    { q: 'What is the smallest unit of matter?', opts: ['Atom', 'Electron', 'Proton', 'Quark'], correct: 3 },
    { q: 'What is the largest mammal on Earth?', opts: ['African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'], correct: 1 },
    { q: 'In what year was the periodic table of elements created?', opts: ['1789', '1869', '1905', '1945'], correct: 1 },
    { q: 'What is the process called when a solid changes directly to a gas?', opts: ['Evaporation', 'Condensation', 'Sublimation', 'Deposition'], correct: 2 },
  ],
  Sports: [
    { q: 'How many players are on a standard soccer team?', opts: ['9', '10', '11', '12'], correct: 2 },
    { q: 'Which country won the 2018 FIFA World Cup?', opts: ['Brazil', 'Germany', 'France', 'Spain'], correct: 2 },
    { q: 'In which sport would you perform a slam dunk?', opts: ['Volleyball', 'Basketball', 'Tennis', 'Football'], correct: 1 },
    { q: 'How many rings are on the Olympic flag?', opts: ['4', '5', '6', '7'], correct: 1 },
    { q: 'Which athlete has won the most Olympic gold medals?', opts: ['Usain Bolt', 'Michael Phelps', 'Simone Biles', 'Carl Lewis'], correct: 1 },
    { q: 'In baseball, how many strikes constitute a strikeout?', opts: ['2', '3', '4', '5'], correct: 1 },
    { q: 'Which is the only team to play in every FIFA World Cup?', opts: ['Germany', 'Italy', 'Argentina', 'Brazil'], correct: 3 },
    { q: 'How long is a marathon race?', opts: ['25 miles', '26.2 miles', '30 kilometers', '50 kilometers'], correct: 1 },
    { q: 'In which sport would you find the Stanley Cup?', opts: ['Basketball', 'Baseball', 'Ice Hockey', 'Soccer'], correct: 2 },
    { q: 'Who holds the record for the most Grand Slam tennis titles?', opts: ['Rafael Nadal', 'Novak Djokovic', 'Roger Federer', 'Serena Williams'], correct: 1 },
  ],
  Entertainment: [
    { q: 'Who played Iron Man in the Marvel Cinematic Universe?', opts: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correct: 2 },
    { q: 'Which band released the album "Abbey Road"?', opts: ['The Rolling Stones', 'The Beatles', 'Led Zeppelin', 'Pink Floyd'], correct: 1 },
    { q: 'Which animated film features the song "Let It Go"?', opts: ['Tangled', 'Brave', 'Moana', 'Frozen'], correct: 3 },
    { q: 'Who wrote the Harry Potter series?', opts: ['J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis', 'Roald Dahl'], correct: 1 },
    { q: 'Which TV series features dragons and "White Walkers"?', opts: ['The Witcher', 'Game of Thrones', 'Lord of the Rings', 'House of the Dragon'], correct: 1 },
    { q: 'Who directed the film "Pulp Fiction"?', opts: ['Martin Scorsese', 'Quentin Tarantino', 'Christopher Nolan', 'David Fincher'], correct: 1 },
    { q: 'Which country has won the most Eurovision Song Contests?', opts: ['Sweden', 'United Kingdom', 'Ireland', 'France'], correct: 0 },
    { q: 'Which actress played Hermione Granger in the Harry Potter films?', opts: ['Emma Stone', 'Emma Watson', 'Emma Thompson', 'Emily Blunt'], correct: 1 },
    { q: 'Who was the lead singer of the band Queen?', opts: ['Mick Jagger', 'Freddie Mercury', 'Elton John', 'David Bowie'], correct: 1 },
    { q: 'In what year was the first episode of "The Simpsons" aired?', opts: ['1985', '1987', '1989', '1991'], correct: 2 },
  ],
  Geography: [
    { q: 'What is the largest desert in the world?', opts: ['Gobi', 'Kalahari', 'Sahara', 'Antarctic'], correct: 3 },
    { q: 'Which mountain is the highest in the world?', opts: ['K2', 'Kilimanjaro', 'Everest', 'Denali'], correct: 2 },
    { q: 'How many continents are there?', opts: ['5', '6', '7', '8'], correct: 2 },
    { q: 'Which is the smallest country in the world?', opts: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 1 },
    { q: 'Which city is the capital of Canada?', opts: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correct: 3 },
    { q: 'Which African country has the most pyramids?', opts: ['Egypt', 'Sudan', 'Libya', 'Algeria'], correct: 1 },
    { q: 'What is the largest island in the world?', opts: ['Madagascar', 'New Guinea', 'Borneo', 'Greenland'], correct: 3 },
    { q: 'Which strait separates Europe and Asia?', opts: ['Strait of Gibraltar', 'Bosporus Strait', 'Strait of Magellan', 'Strait of Hormuz'], correct: 1 },
    { q: 'Which country has the most natural lakes?', opts: ['Russia', 'United States', 'Canada', 'Finland'], correct: 2 },
    { q: 'Which is the driest inhabited continent?', opts: ['Africa', 'Asia', 'Australia', 'South America'], correct: 2 },
  ],
  Technology: [
    { q: 'In which year was the first iPhone released?', opts: ['2005', '2007', '2009', '2011'], correct: 1 },
    { q: 'What does CPU stand for?', opts: ['Central Processing Unit', 'Computer Personal Unit', 'Central Personal Utility', 'Computer Processing Utility'], correct: 0 },
    { q: 'Who is the co-founder of Microsoft alongside Bill Gates?', opts: ['Steve Jobs', 'Paul Allen', 'Mark Zuckerberg', 'Elon Musk'], correct: 1 },
    { q: 'Which programming language is named after a snake?', opts: ['Java', 'C++', 'Python', 'Ruby'], correct: 2 },
    { q: 'What is the main component of solar panels?', opts: ['Silicon', 'Aluminum', 'Copper', 'Graphite'], correct: 0 },
    { q: 'Which company developed the Android operating system?', opts: ['Apple', 'Microsoft', 'Google', 'Samsung'], correct: 2 },
    { q: 'What does "IoT" stand for?', opts: ['Internet of Technology', 'Internet of Things', 'Integration of Technology', 'Integration of Things'], correct: 1 },
    { q: 'In what year was the World Wide Web invented?', opts: ['1985', '1989', '1993', '1997'], correct: 1 },
    { q: 'Which tech company has the slogan "Think Different"?', opts: ['Microsoft', 'Apple', 'IBM', 'Dell'], correct: 1 },
    { q: 'What is the name of Elon Musk\'s aerospace company?', opts: ['Blue Origin', 'SpaceX', 'Virgin Galactic', 'Boeing'], correct: 1 },
  ],
};

// For more variety, here are some additional categories that could be added to your game

const newCategories = {
  Food: [
    { q: 'Which country is the origin of pizza?', opts: ['France', 'Greece', 'Italy', 'Spain'], correct: 2 },
    { q: 'What is the main ingredient in guacamole?', opts: ['Bell Pepper', 'Avocado', 'Eggplant', 'Cucumber'], correct: 1 },
    { q: 'Which nut is used to make marzipan?', opts: ['Walnut', 'Almond', 'Hazelnut', 'Cashew'], correct: 1 },
    { q: 'What is sushi traditionally wrapped in?', opts: ['Seaweed', 'Rice paper', 'Lettuce', 'Banana leaf'], correct: 0 },
    { q: 'Which cheese is traditionally used in a Greek salad?', opts: ['Mozzarella', 'Brie', 'Feta', 'Cheddar'], correct: 2 },
  ],
  Music: [
    { q: 'Which instrument has 88 keys?', opts: ['Accordion', 'Organ', 'Piano', 'Harpsichord'], correct: 2 },
    { q: 'Who wrote the opera "The Magic Flute"?', opts: ['Bach', 'Beethoven', 'Mozart', 'Verdi'], correct: 2 },
    { q: 'In which decade was the CD invented?', opts: ['1970s', '1980s', '1990s', '2000s'], correct: 1 },
    { q: 'Which genre of music originated in Jamaica?', opts: ['Salsa', 'Reggae', 'Hip Hop', 'Samba'], correct: 1 },
    { q: 'How many strings does a standard guitar have?', opts: ['4', '5', '6', '8'], correct: 2 },
  ],
  Literature: [
    { q: 'Who wrote "1984"?', opts: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correct: 1 },
    { q: 'Which Shakespeare play features the character Juliet?', opts: ['Hamlet', 'Macbeth', 'Romeo and Juliet', 'King Lear'], correct: 2 },
    { q: 'Who is the author of "To Kill a Mockingbird"?', opts: ['Ernest Hemingway', 'Harper Lee', 'John Steinbeck', 'Mark Twain'], correct: 1 },
    { q: 'What is the first book in J.K. Rowling\'s Harry Potter series?', opts: ['Chamber of Secrets', 'Philosopher\'s Stone', 'Prisoner of Azkaban', 'Goblet of Fire'], correct: 1 },
    { q: 'Which detective lives at 221B Baker Street?', opts: ['Hercule Poirot', 'Miss Marple', 'Sherlock Holmes', 'Philip Marlowe'], correct: 2 },
  ],
  Animals: [
    { q: 'What is the largest species of big cat?', opts: ['Lion', 'Leopard', 'Jaguar', 'Tiger'], correct: 3 },
    { q: 'How many legs does a spider typically have?', opts: ['4', '6', '8', '10'], correct: 2 },
    { q: 'Which bird has the largest wingspan?', opts: ['California Condor', 'Albatross', 'Bald Eagle', 'Ostrich'], correct: 1 },
    { q: 'What is a group of lions called?', opts: ['Pack', 'Herd', 'Pride', 'Gang'], correct: 2 },
    { q: 'Which mammal can fly?', opts: ['Squirrel', 'Sugar Glider', 'Bat', 'Flying Lemur'], correct: 2 },
  ]
};

// To use: Copy these question templates into your questions.cjs file and merge them with your existing templates
