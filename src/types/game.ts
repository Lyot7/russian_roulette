export interface Player {
  id: string;
  name: string;
  points: number;
  photo?: string; // Base64 encoded image
  isTarget: boolean;
  isActive: boolean;
  isGameMaster: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
  type: 'single' | 'multiple'; // Single choice or multiple choice
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  questions: Question[];
  currentQuestion: number | null;
  isActive: boolean;
  gameMasterId: string;
}

export type RouletteOutcome = 
  | { type: 'nothing' }
  | { type: 'losePoints', amount: number }
  | { type: 'becomeTarget' };

export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  isConnected: boolean;
} 