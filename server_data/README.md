# Expanded Questions for Trivia Master Multiplayer

This package includes an expanded set of trivia questions for your game, with:

- Over 1000+ existing questions across 6 categories
- 4 new categories with 15 questions each
- Simple integration process

## Available Categories

**Original Categories:**
- History
- Science
- Sports
- Entertainment
- Geography
- Technology

**New Categories:**
- Music
- Food
- Literature
- Animals

## How to Use the Expanded Questions

### Option 1: Quick Integration (Use both original and new categories)

1. Run the integration script:
   ```
   node server_data/integrate_questions.cjs
   ```

2. Open `server.cjs` and replace:
   ```javascript
   const { allQuestions } = require('./server_data/questions.cjs');
   ```
   with:
   ```javascript
   const { allQuestions } = require('./server_data/expanded_questions.cjs');
   ```

3. Restart your server to apply the changes

### Option 2: Manual Update (Customize the categories)

If you want to customize which categories to include:

1. Open `server_data/questions.cjs` 
2. Open `server_data/additional_questions.cjs`
3. Copy the categories you want from `additional_questions.cjs` into `questions.cjs`
4. Update the `CATEGORIES` array in `server.cjs` to include your selected categories

Example of updating CATEGORIES in server.cjs:
```javascript
const CATEGORIES = [
  'History', 'Science', 'Sports', 'Entertainment', 'Geography', 'Technology',
  'Music', 'Food', 'Literature', 'Animals'
];
```

## Customizing Difficulty

The integration script automatically assigns difficulty levels based on question position:
- Every 3rd question is marked as "easy"
- Every 3rd+1 question is marked as "medium"
- Every 3rd+2 question is marked as "hard"

You can adjust this distribution in the `integrate_questions.cjs` file.

## Adding Your Own Questions

To add your own custom questions:

1. Create a new file in the `server_data` folder (e.g., `my_questions.cjs`)
2. Use the same format as in `additional_questions.cjs`:
   ```javascript
   const myCategories = {
     MyCategoryName: [
       { q: 'Question text?', opts: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 },
       // Add more questions...
     ]
   };
   
   module.exports = { myCategories };
   ```
3. Update the integration script to include your new question file

## Notes

- The game currently supports up to 10 categories comfortably
- Adding too many categories might require UI adjustments
- Questions with the same ID will be overwritten, so ensure unique IDs
- Keep backup copies of your question files
