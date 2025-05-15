// Import constants from game
const EVENTS = {
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
};

const INITIAL_POINTS = 7;

// Quiz questions (normally these would be imported from a file)
const quizQuestions = [
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
  }
  // More questions...
];

// In-memory storage for rooms
const rooms = new Map();

// Game functions
function handleCreateRoom(data, ws) {
  const { player } = data;
  const roomId = generateRoomId();
  
  const playerWithPoints = {
    ...player,
    points: INITIAL_POINTS,
    isTarget: false,
    isActive: true,
    isGameMaster: true,
  };
  
  const room = {
    id: roomId,
    name: `${player.name}'s Room`,
    players: new Map(),
    questions: shuffleQuestions(quizQuestions),
    currentQuestionIndex: null,
    isActive: true,
    gameMasterId: player.id,
  };
  
  room.players.set(player.id, { player: playerWithPoints, ws });
  rooms.set(roomId, room);
  
  // Associate player and room with socket
  ws.roomId = roomId;
  ws.playerId = player.id;
  
  // Notify player that room was created
  sendToClient(ws, EVENTS.CONNECT, { roomId });
  
  console.log(`Room created: ${roomId} by ${player.name}`);
}

function handleJoinRoom(data, ws) {
  const { roomId, player } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
  }
  
  if (!room.isActive) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Game has already ended' });
  }
  
  const playerWithPoints = {
    ...player,
    points: INITIAL_POINTS,
    isTarget: false,
    isActive: true,
    isGameMaster: false,
  };
  
  // Add player to room
  room.players.set(player.id, { player: playerWithPoints, ws });
  
  // Associate player and room with socket
  ws.roomId = roomId;
  ws.playerId = player.id;
  
  // Notify player that they joined
  sendToClient(ws, EVENTS.CONNECT, { roomId });
  
  // Notify everyone about the new player
  broadcastRoomState(room);
  
  console.log(`Player ${player.name} joined room ${roomId}`);
}

function handleStartGame(data, ws) {
  const { roomId } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
  }
  
  if (ws.playerId !== room.gameMasterId) {
    return sendToClient(ws, EVENTS.ERROR, { 
      message: 'Only the game master can start the game' 
    });
  }
  
  room.currentQuestionIndex = 0;
  
  // Send first question to all players
  broadcastToRoom(room, EVENTS.START_GAME, {
    currentQuestion: room.currentQuestionIndex,
    question: room.questions[0],
  });
  
  console.log(`Game started in room ${roomId}`);
}

function handleSubmitAnswer(data, ws) {
  const { roomId, playerId, answers } = data;
  const room = rooms.get(roomId);
  
  if (!room || room.currentQuestionIndex === null) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Game not active' });
  }
  
  const playerData = room.players.get(playerId);
  if (!playerData) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Player not found' });
  }
  
  const currentQuestion = room.questions[room.currentQuestionIndex];
  const correctAnswerIds = currentQuestion.answers
    .filter(a => a.isCorrect)
    .map(a => a.id);
  
  // Check if the answer is correct
  const isCorrect = currentQuestion.type === 'single'
    ? correctAnswerIds.includes(answers[0])
    : answers.length === correctAnswerIds.length &&
      answers.every(id => correctAnswerIds.includes(id));
  
  if (isCorrect) {
    // Correct answer: gain 1 point
    playerData.player.points += 1;
    
    // Inform the player about the result
    sendToClient(ws, EVENTS.POINTS_UPDATED, {
      points: playerData.player.points,
      correct: true
    });
  } else {
    // Wrong answer: ask player to choose between losing 1 point or playing roulette
    sendToClient(ws, EVENTS.SUBMIT_ANSWER, {
      correct: false,
      shouldChooseFate: true
    });
  }
  
  // Update room state
  broadcastRoomState(room);
}

function handlePlayRoulette(data, ws) {
  const { roomId, playerId } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
  }
  
  const playerData = room.players.get(playerId);
  if (!playerData) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Player not found' });
  }
  
  const outcome = getRouletteOutcome();
  
  // Apply outcome
  if (outcome.type === 'losePoints') {
    playerData.player.points -= outcome.amount;
  } else if (outcome.type === 'becomeTarget') {
    // Reset any existing targets
    for (const [, { player }] of room.players.entries()) {
      player.isTarget = false;
    }
    playerData.player.isTarget = true;
  }
  
  // Check if player is eliminated
  playerData.player.isActive = playerData.player.points > 0;
  
  // Send outcome to the player
  sendToClient(ws, EVENTS.ROULETTE_RESULT, {
    outcome,
    points: playerData.player.points,
    isActive: playerData.player.isActive,
    isTarget: playerData.player.isTarget
  });
  
  // Update room state
  broadcastRoomState(room);
}

function handleNextQuestion(data, ws) {
  const { roomId } = data;
  const room = rooms.get(roomId);
  
  if (!room || room.currentQuestionIndex === null) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Game not active' });
  }
  
  if (ws.playerId !== room.gameMasterId) {
    return sendToClient(ws, EVENTS.ERROR, { 
      message: 'Only the game master can advance to the next question' 
    });
  }
  
  room.currentQuestionIndex++;
  
  // Check if we've reached the end of questions
  if (room.currentQuestionIndex >= room.questions.length) {
    room.isActive = false;
    return broadcastToRoom(room, EVENTS.END_GAME, {
      winners: getWinners(room)
    });
  }
  
  // Send next question to all players
  broadcastToRoom(room, EVENTS.NEXT_QUESTION, {
    currentQuestion: room.currentQuestionIndex,
    question: room.questions[room.currentQuestionIndex]
  });
}

// Updated function to accept either a websocket object or roomId and playerId
function handlePlayerDisconnect(wsOrRoomId, playerId) {
  // Handle the case when called with a websocket object
  let roomId = wsOrRoomId;
  
  if (typeof wsOrRoomId !== 'string') {
    // Extract from websocket object
    const ws = wsOrRoomId;
    if (!ws.roomId || !ws.playerId) return;
    
    roomId = ws.roomId;
    playerId = ws.playerId;
  }
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  console.log(`Player ${playerId} disconnected from room ${roomId}`);
  
  // Remove player from room
  room.players.delete(playerId);
  
  // If room is empty, remove it
  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} removed (empty)`);
    return;
  }
  
  // If the game master left, assign a new one or end the game
  if (playerId === room.gameMasterId) {
    const players = Array.from(room.players.entries());
    if (players.length > 0) {
      const [newGameMasterId, { player: newGameMaster }] = players[0];
      room.gameMasterId = newGameMasterId;
      newGameMaster.isGameMaster = true;
      console.log(`New game master assigned: ${newGameMaster.name}`);
    } else {
      room.isActive = false;
      console.log(`Game ended in room ${roomId} (game master left)`);
    }
  }
  
  // Broadcast updated room state
  broadcastRoomState(room);
}

// Helper functions
function broadcastRoomState(room) {
  const playersList = Array.from(room.players.values()).map(({ player }) => {
    // Send only necessary player info
    return {
      id: player.id,
      name: player.name,
      points: player.points,
      photo: player.photo,
      isTarget: player.isTarget,
      isActive: player.isActive,
      isGameMaster: player.isGameMaster
    };
  });
  
  broadcastToRoom(room, EVENTS.PLAYER_JOINED, {
    players: playersList,
    roomId: room.id,
    isActive: room.isActive,
    gameMasterId: room.gameMasterId
  });
}

function broadcastToRoom(room, event, data) {
  for (const [, { ws }] of room.players.entries()) {
    if (ws.readyState === ws.OPEN) {
      sendToClient(ws, event, data);
    }
  }
}

function sendToClient(ws, event, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleQuestions(questions) {
  // Shuffle the questions
  const shuffledQuestions = shuffleArray(questions);
  
  // Shuffle the answers within each question
  return shuffledQuestions.map(question => ({
    ...question,
    answers: shuffleArray(question.answers)
  }));
}

function getRouletteOutcome() {
  const outcomes = [
    { type: 'nothing', probability: 0.4 },
    { type: 'losePoints', amount: 2, probability: 0.3 },
    { type: 'losePoints', amount: 8, probability: 0.2 },
    { type: 'becomeTarget', probability: 0.1 },
  ];
  
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const outcome of outcomes) {
    cumulativeProbability += outcome.probability;
    if (random <= cumulativeProbability) {
      const { probability, ...result } = outcome;
      return result;
    }
  }
  
  // Default to nothing if something goes wrong
  return { type: 'nothing' };
}

function getWinners(room) {
  // Find highest score
  let highestScore = -1;
  for (const [, { player }] of room.players.entries()) {
    if (player.points > highestScore) {
      highestScore = player.points;
    }
  }
  
  // Find all players with the highest score
  return Array.from(room.players.values())
    .filter(({ player }) => player.points === highestScore)
    .map(({ player }) => ({
      id: player.id,
      name: player.name,
      points: player.points
    }));
}

module.exports = {
  EVENTS,
  handleCreateRoom,
  handleJoinRoom,
  handleStartGame,
  handleSubmitAnswer,
  handlePlayRoulette,
  handleNextQuestion,
  handlePlayerDisconnect,
  rooms
}; 