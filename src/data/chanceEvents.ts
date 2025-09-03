import { ChanceEvent } from '../types/game';

export const chanceEvents: ChanceEvent[] = [
  {
    type: 'move',
    value: 3,
    description: 'Lucky break! Move forward 3 spaces!'
  },
  {
    type: 'move',
    value: -2,
    description: 'Oops! Move back 2 spaces!'
  },
  {
    type: 'move',
    value: 5,
    description: 'Super lucky! Jump forward 5 spaces!'
  },
  {
    type: 'move',
    value: -1,
    description: 'Minor setback! Move back 1 space!'
  },
  {
    type: 'points',
    value: 50,
    description: 'Bonus points! Gain 50 points!'
  },
  {
    type: 'points',
    value: -25,
    description: 'Point penalty! Lose 25 points!'
  },
  {
    type: 'points',
    value: 100,
    description: 'Jackpot! Gain 100 points!'
  },
  {
    type: 'skip',
    value: 1,
    description: 'Take a break! Skip your next turn!'
  },
  {
    type: 'move',
    value: 2,
    description: 'Good fortune! Move forward 2 spaces!'
  },
  {
    type: 'points',
    value: 75,
    description: 'Nice! Gain 75 bonus points!'
  },
  {
    type: 'move',
    value: -3,
    description: 'Bad luck! Move back 3 spaces!'
  },
  {
    type: 'points',
    value: -50,
    description: 'Tough break! Lose 50 points!'
  }
];

export const getRandomChanceEvent = (): ChanceEvent => {
  return chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
};