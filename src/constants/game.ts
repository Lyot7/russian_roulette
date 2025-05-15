// Game parameters
export const INITIAL_POINTS = 7;
export const CORRECT_ANSWER_POINTS = 1;
export const WRONG_ANSWER_POINTS_LOSS = 1;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

// Roulette outcomes
export const ROULETTE_OUTCOMES = [
  { type: 'nothing', probability: 0.4 },
  { type: 'losePoints', amount: 2, probability: 0.3 },
  { type: 'losePoints', amount: 8, probability: 0.2 },
  { type: 'becomeTarget', probability: 0.1 },
] as const;

// WebSocket events
export const EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  CREATE_ROOM: 'create_room',
  START_GAME: 'start_game',
  END_GAME: 'end_game',
  NEXT_QUESTION: 'next_question',
  SUBMIT_ANSWER: 'submit_answer',
  PLAY_ROULETTE: 'play_roulette',
  ROULETTE_RESULT: 'roulette_result',
  POINTS_UPDATED: 'points_updated',
  TARGET_CHANGED: 'target_changed',
  ERROR: 'error',
} as const; 