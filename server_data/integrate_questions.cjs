// Integration script for adding new question categories
// Run this script to add new categories to the game

const path = require('path');
const fs = require('fs');

// Import both question sets
const { allQuestions } = require('./questions.cjs');
const { additionalCategories } = require('./additional_questions.cjs');

console.log('Current question count:', allQuestions.length);
console.log('Available categories:', [...new Set(allQuestions.map(q => q.category))].join(', '));

// Generate new questions from additional categories
function generateAdditionalCategoryQuestions() {
  const newQuestions = [];
  let id = 10000; // Start ID from a high number to avoid conflicts
  
  for (const [category, questions] of Object.entries(additionalCategories)) {
    console.log(`Processing ${questions.length} questions for new category: ${category}`);
    
    questions.forEach((q, index) => {
      newQuestions.push({
        id: String(id++),
        category,
        question: q.q,
        options: q.opts,
        correctAnswer: q.correct,
        difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard'
      });
    });
  }
  
  console.log(`Generated ${newQuestions.length} new questions from additional categories`);
  return newQuestions;
}

// Combine all questions
const newCategoryQuestions = generateAdditionalCategoryQuestions();
const combinedQuestions = [...allQuestions, ...newCategoryQuestions];

console.log('New total question count:', combinedQuestions.length);
console.log('Updated categories:', [...new Set(combinedQuestions.map(q => q.category))].join(', '));

// Save to a combined file
const outputPath = path.join(__dirname, 'expanded_questions.cjs');
fs.writeFileSync(outputPath, `// Expanded question set including additional categories
// Generated on ${new Date().toLocaleDateString()}

const expandedQuestions = ${JSON.stringify(combinedQuestions, null, 2)};

module.exports = { allQuestions: expandedQuestions };
`);

console.log(`\nSuccess! ${combinedQuestions.length} questions saved to ${outputPath}`);
console.log('\nTo use these questions in your game:');
console.log('1. In server.cjs, change:');
console.log('   const { allQuestions } = require(\'./server_data/questions.cjs\');');
console.log('   to:');
console.log('   const { allQuestions } = require(\'./server_data/expanded_questions.cjs\');');
console.log('\n2. Restart your server to load the expanded question set');
