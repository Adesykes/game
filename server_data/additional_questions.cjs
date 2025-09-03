// Additional questions for Trivia Master Multiplayer
// Contains expanded categories and new questions

// This file contains additional question categories and questions that could be added to the game
// These can be merged into the main questions.cjs file

const additionalCategories = {
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
    { q: 'Which country is known for inventing the croissant?', opts: ['France', 'Austria', 'Belgium', 'Switzerland'], correct: 1 },
    { q: 'What is the main ingredient in traditional Indian naan bread?', opts: ['Rice flour', 'Corn flour', 'Wheat flour', 'Chickpea flour'], correct: 2 },
    { q: 'Which meat is traditionally used in a Shepherd\'s Pie?', opts: ['Beef', 'Pork', 'Lamb', 'Chicken'], correct: 2 },
    { q: 'Which alcoholic drink is made from juniper berries?', opts: ['Whiskey', 'Gin', 'Vodka', 'Rum'], correct: 1 },
    { q: 'What vegetable is known as "lady\'s finger" in many English-speaking countries?', opts: ['Zucchini', 'Eggplant', 'Okra', 'Asparagus'], correct: 2 },
  ],

  Literature: [
    { q: 'Who wrote "Pride and Prejudice"?', opts: ['Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'Virginia Woolf'], correct: 0 },
    { q: 'In which century did William Shakespeare live?', opts: ['14th-15th', '15th-16th', '16th-17th', '17th-18th'], correct: 2 },
    { q: 'Who wrote the novel "1984"?', opts: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correct: 1 },
    { q: 'Which Russian author wrote "War and Peace"?', opts: ['Fyodor Dostoevsky', 'Leo Tolstoy', 'Anton Chekhov', 'Ivan Turgenev'], correct: 1 },
    { q: 'Who created the character Sherlock Holmes?', opts: ['Agatha Christie', 'Arthur Conan Doyle', 'Edgar Allan Poe', 'Mark Twain'], correct: 1 },
    { q: 'Which novel begins with the line "Call me Ishmael"?', opts: ['The Great Gatsby', 'Moby-Dick', 'To Kill a Mockingbird', 'The Catcher in the Rye'], correct: 1 },
    { q: 'Who wrote "The Divine Comedy"?', opts: ['Petrarch', 'Dante Alighieri', 'Giovanni Boccaccio', 'Niccolò Machiavelli'], correct: 1 },
    { q: 'Which author created the character Harry Potter?', opts: ['J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis', 'Philip Pullman'], correct: 1 },
    { q: 'Which play by William Shakespeare features the character Ophelia?', opts: ['Romeo and Juliet', 'Macbeth', 'Hamlet', 'King Lear'], correct: 2 },
    { q: 'Who wrote "The Old Man and the Sea"?', opts: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner', 'John Steinbeck'], correct: 1 },
    { q: 'Who wrote "The Great Gatsby"?', opts: ['F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner', 'John Steinbeck'], correct: 0 },
    { q: 'Which poet wrote "The Raven"?', opts: ['Walt Whitman', 'Robert Frost', 'Edgar Allan Poe', 'Emily Dickinson'], correct: 2 },
    { q: 'Which novel features the character Scout Finch?', opts: ['Great Expectations', 'To Kill a Mockingbird', 'The Adventures of Huckleberry Finn', 'The Catcher in the Rye'], correct: 1 },
    { q: 'Who wrote "One Hundred Years of Solitude"?', opts: ['Jorge Luis Borges', 'Gabriel García Márquez', 'Pablo Neruda', 'Isabel Allende'], correct: 1 },
    { q: 'Who is the author of "The Hobbit"?', opts: ['C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin', 'Philip Pullman'], correct: 1 },
  ],

  Animals: [
    { q: 'Which is the tallest animal on Earth?', opts: ['Elephant', 'Giraffe', 'Whale', 'Polar bear'], correct: 1 },
    { q: 'How many hearts does an octopus have?', opts: ['1', '3', '5', '8'], correct: 1 },
    { q: 'Which bird lays the largest eggs?', opts: ['Emu', 'Ostrich', 'Albatross', 'Eagle'], correct: 1 },
    { q: 'What is a group of lions called?', opts: ['Herd', 'Pack', 'Pride', 'Fleet'], correct: 2 },
    { q: 'Which is the only mammal that can fly?', opts: ['Flying squirrel', 'Bat', 'Sugar glider', 'Colugo'], correct: 1 },
    { q: 'What is a baby kangaroo called?', opts: ['Kid', 'Calf', 'Joey', 'Pup'], correct: 2 },
    { q: 'Which animal has the longest lifespan?', opts: ['Elephant', 'Giant tortoise', 'Bowhead whale', 'Greenland shark'], correct: 3 },
    { q: 'Which animal is known as the "ship of the desert"?', opts: ['Camel', 'Dromedary', 'Horse', 'Donkey'], correct: 0 },
    { q: 'Which animal can change its skin color?', opts: ['Snake', 'Lizard', 'Chameleon', 'Frog'], correct: 2 },
    { q: 'What is a group of crows called?', opts: ['Flock', 'Murder', 'Pack', 'Swarm'], correct: 1 },
    { q: 'Which animal sleeps standing up?', opts: ['Elephant', 'Giraffe', 'Horse', 'Flamingo'], correct: 2 },
    { q: 'What is the smallest bird in the world?', opts: ['Hummingbird', 'Wren', 'Bee hummingbird', 'Goldcrest'], correct: 2 },
    { q: 'Which animal has the best sense of smell?', opts: ['Bloodhound', 'Shark', 'Elephant', 'Bear'], correct: 0 },
    { q: 'Which marine animal is known to have three hearts?', opts: ['Octopus', 'Squid', 'Jellyfish', 'Starfish'], correct: 0 },
    { q: 'What is a group of wolves called?', opts: ['Pack', 'Herd', 'Flock', 'School'], correct: 0 },
  ]
};

module.exports = { additionalCategories };
