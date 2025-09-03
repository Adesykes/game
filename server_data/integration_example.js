/**
 * Example integration of new trivia questions
 * This file demonstrates how to incorporate the additional questions
 * into your existing questions.cjs file.
 */

// Here's how you would modify your existing questions.cjs file:

// Step 1: Merge the new templates with your existing ones
const templates = {
  History: [
    { q: 'Which emperor built the Colosseum?', opts: ['Nero', 'Vespasian', 'Augustus', 'Trajan'], correct: 1 },
    { q: 'The French Revolution began in which year?', opts: ['1787', '1789', '1791', '1793'], correct: 1 },
    { q: 'Which civilization built Machu Picchu?', opts: ['Aztecs', 'Mayans', 'Incas', 'Olmecs'], correct: 2 },
    // Add new history questions here
    { q: 'Who painted the Mona Lisa?', opts: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'], correct: 1 },
    { q: 'Which ancient wonder was located in Alexandria?', opts: ['Great Pyramid', 'Hanging Gardens', 'Lighthouse', 'Colossus'], correct: 2 },
    { q: 'Who was the first woman to fly solo across the Atlantic?', opts: ['Amelia Earhart', 'Bessie Coleman', 'Harriet Quimby', 'Jacqueline Cochran'], correct: 0 },
    // ... add more as desired
  ],
  Science: [
    { q: 'What is the chemical formula for water?', opts: ['H2O', 'CO2', 'NaCl', 'CH4'], correct: 0 },
    { q: 'Which planet is closest to the Sun?', opts: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2 },
    { q: 'What is the largest organ in the human body?', opts: ['Liver', 'Brain', 'Heart', 'Skin'], correct: 3 },
    // Add new science questions here
    { q: 'What is the hardest natural substance on Earth?', opts: ['Gold', 'Titanium', 'Diamond', 'Platinum'], correct: 2 },
    { q: 'What is the speed of light?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correct: 0 },
    { q: 'Which element has the chemical symbol "Fe"?', opts: ['Iron', 'Fluorine', 'Francium', 'Fermium'], correct: 0 },
    // ... add more as desired
  ],
  // Continue for other categories
};

// Step 2: If you want to add new categories, update your game constants
// In server.cjs:
// const CATEGORIES = ['History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology', 'Food', 'Music', 'Literature', 'Animals'];

// Step 3: Add new categories to your templates object
/*
templates.Food = [
  { q: 'Which country is the origin of pizza?', opts: ['France', 'Greece', 'Italy', 'Spain'], correct: 2 },
  { q: 'What is the main ingredient in guacamole?', opts: ['Bell Pepper', 'Avocado', 'Eggplant', 'Cucumber'], correct: 1 },
  // ... add more as desired
];

templates.Music = [
  { q: 'Which instrument has 88 keys?', opts: ['Accordion', 'Organ', 'Piano', 'Harpsichord'], correct: 2 },
  { q: 'Who wrote the opera "The Magic Flute"?', opts: ['Bach', 'Beethoven', 'Mozart', 'Verdi'], correct: 2 },
  // ... add more as desired
];
*/

// Step 4: Update your generateAdditionalQuestions function
// If you want to generate even more questions:
/*
function generateAdditionalQuestions(total = 800) { // Increased from 500
  // Same implementation as before
}
*/

// Step 5: Update your base questions if desired
// You can add more hand-crafted base questions:
/*
const baseQuestions = [
  // Your existing base questions...
  
  // New base questions
  { id: '61', category: 'Food', question: 'Which fruit is known as the "king of fruits"?', options: ['Apple', 'Mango', 'Durian', 'Banana'], correctAnswer: 2, difficulty: 'medium' },
  { id: '62', category: 'Music', question: 'Which Beatles album features "Hey Jude"?', options: ['Abbey Road', 'Let It Be', 'The Beatles (White Album)', 'Past Masters'], correctAnswer: 1, difficulty: 'hard' },
];
*/
