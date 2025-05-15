import { Question, RouletteOutcome } from '../../types/game';
import { ROULETTE_OUTCOMES } from '../../constants/game';

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates a random room ID
 */
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get shuffled questions with shuffled answers
 */
export function getShuffledQuestions(questions: Question[]): Question[] {
  // Shuffle the questions
  const shuffledQuestions = shuffleArray(questions);
  
  // Shuffle the answers within each question
  return shuffledQuestions.map(question => ({
    ...question,
    answers: shuffleArray(question.answers)
  }));
}

/**
 * Get a random roulette outcome based on probability
 */
export function getRouletteOutcome(): RouletteOutcome {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const outcome of ROULETTE_OUTCOMES) {
    cumulativeProbability += outcome.probability;
    if (random <= cumulativeProbability) {
      const { probability, ...result } = outcome;
      return result;
    }
  }
  
  // Default to nothing if something goes wrong
  return { type: 'nothing' };
}

/**
 * Checks if a player is eliminated (points <= 0)
 */
export function isPlayerEliminated(points: number): boolean {
  return points <= 0;
} 