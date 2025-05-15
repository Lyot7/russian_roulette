import { Question } from '../types/game';

export const quizQuestions: Question[] = [
  {
    id: '1',
    text: 'What is the capital of France?',
    type: 'single',
    answers: [
      { id: '1a', text: 'Paris', isCorrect: true },
      { id: '1b', text: 'London', isCorrect: false },
      { id: '1c', text: 'Berlin', isCorrect: false },
      { id: '1d', text: 'Madrid', isCorrect: false },
    ],
  },
  {
    id: '2',
    text: 'Which of the following are JavaScript frameworks or libraries?',
    type: 'multiple',
    answers: [
      { id: '2a', text: 'React', isCorrect: true },
      { id: '2b', text: 'Angular', isCorrect: true },
      { id: '2c', text: 'Vue', isCorrect: true },
      { id: '2d', text: 'Python', isCorrect: false },
    ],
  },
  {
    id: '3',
    text: 'Which planet is known as the Red Planet?',
    type: 'single',
    answers: [
      { id: '3a', text: 'Venus', isCorrect: false },
      { id: '3b', text: 'Mars', isCorrect: true },
      { id: '3c', text: 'Jupiter', isCorrect: false },
      { id: '3d', text: 'Saturn', isCorrect: false },
    ],
  },
  {
    id: '4',
    text: 'Which of these are programming languages?',
    type: 'multiple',
    answers: [
      { id: '4a', text: 'Java', isCorrect: true },
      { id: '4b', text: 'HTML', isCorrect: false },
      { id: '4c', text: 'Python', isCorrect: true },
      { id: '4d', text: 'CSS', isCorrect: false },
    ],
  },
  {
    id: '5',
    text: 'Who painted the Mona Lisa?',
    type: 'single',
    answers: [
      { id: '5a', text: 'Vincent van Gogh', isCorrect: false },
      { id: '5b', text: 'Pablo Picasso', isCorrect: false },
      { id: '5c', text: 'Leonardo da Vinci', isCorrect: true },
      { id: '5d', text: 'Michelangelo', isCorrect: false },
    ],
  },
]; 