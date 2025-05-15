import { NextRequest } from 'next/server';
import { Server as SocketServer } from 'ws';
import { EVENTS } from '@/constants/game';
import { Player, Room, Question } from '@/types/game';
import { quizQuestions } from '@/constants/quizData';
import { generateRoomId, getShuffledQuestions, getRouletteOutcome } from '@/lib/utils/game';
import { INITIAL_POINTS } from '@/constants/game';

// Type definitions for WS with custom properties
interface GameWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
  isAlive?: boolean;
}

// Store rooms in memory
interface ServerRoom {
  id: string;
  name: string;
  players: Map<string, { player: Player; ws: GameWebSocket }>;
  questions: Question[];
  currentQuestionIndex: number | null;
  isActive: boolean;
  gameMasterId: string;
}

// In-memory storage for rooms
const rooms: Map<string, ServerRoom> = new Map();

// Initialize WebSocket server only once
let wss: SocketServer | null = null;
const initWebSocketServer = () => {
  if (wss) return wss;

  console.log("Initializing WebSocket server");
  wss = new SocketServer({ noServer: true });
  
  wss.on('connection', (ws: GameWebSocket) => {
    console.log('Client connected');
    ws.isAlive = true;
    
    ws.on('message', (message: Buffer) => {
      try {
        const { event, data } = JSON.parse(message.toString());
        console.log(`Received event: ${event}`);
        handleEvent(event, data, ws);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('close', () => {
      if (ws.roomId && ws.playerId) {
        handlePlayerDisconnect(ws.roomId, ws.playerId);
      }
    });
  });
  
  // Set up ping interval to keep connections alive
  const interval = setInterval(() => {
    wss!.clients.forEach((ws: any) => {
      const gameWs = ws as GameWebSocket;
      if (gameWs.isAlive === false) {
        if (gameWs.roomId && gameWs.playerId) {
          handlePlayerDisconnect(gameWs.roomId, gameWs.playerId);
        }
        return gameWs.terminate();
      }
      
      gameWs.isAlive = false;
      gameWs.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return wss;
};

// Handle Events
function handleEvent(event: string, data: any, ws: GameWebSocket) {
  switch(event) {
    case EVENTS.JOIN_ROOM:
      handleJoinRoom(data, ws);
      break;
    case EVENTS.CREATE_ROOM:
      handleCreateRoom(data, ws);
      break;
    case EVENTS.START_GAME:
      handleStartGame(data, ws);
      break;
    case EVENTS.SUBMIT_ANSWER:
      handleSubmitAnswer(data, ws);
      break;
    case EVENTS.PLAY_ROULETTE:
      handlePlayRoulette(data, ws);
      break;
    case EVENTS.NEXT_QUESTION:
      handleNextQuestion(data, ws);
      break;
    default:
      console.log(`Unknown event: ${event}`);
  }
}

// Game Logic
function handleCreateRoom(data: { player: Player }, ws: GameWebSocket) {
  const { player } = data;
  const roomId = generateRoomId();
  
  const playerWithPoints = {
    ...player,
    points: INITIAL_POINTS,
    isTarget: false,
    isActive: true,
    isGameMaster: true,
  };
  
  const room: ServerRoom = {
    id: roomId,
    name: `${player.name}'s Room`,
    players: new Map(),
    questions: getShuffledQuestions(quizQuestions),
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
}

function handleJoinRoom(data: { roomId: string; player: Player }, ws: GameWebSocket) {
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
}

function handleStartGame(data: { roomId: string }, ws: GameWebSocket) {
  const { roomId } = data;
  const room = rooms.get(roomId);
  
  if (!room) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Room not found' });
  }
  
  if (ws.playerId !== room.gameMasterId) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Only the game master can start the game' });
  }
  
  room.currentQuestionIndex = 0;
  
  // Send first question to all players
  broadcastToRoom(room, EVENTS.START_GAME, {
    currentQuestion: room.currentQuestionIndex,
    question: room.questions[0],
  });
}

function handleSubmitAnswer(data: { roomId: string; playerId: string; answers: string[] }, ws: GameWebSocket) {
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
    // For single choice, the selected answer must match the correct one
    ? correctAnswerIds.includes(answers[0])
    // For multiple choice, all correct answers must be selected and no incorrect ones
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

function handlePlayRoulette(data: { roomId: string; playerId: string }, ws: GameWebSocket) {
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

function handleNextQuestion(data: { roomId: string }, ws: GameWebSocket) {
  const { roomId } = data;
  const room = rooms.get(roomId);
  
  if (!room || room.currentQuestionIndex === null) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Game not active' });
  }
  
  if (ws.playerId !== room.gameMasterId) {
    return sendToClient(ws, EVENTS.ERROR, { message: 'Only the game master can advance to the next question' });
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

function handlePlayerDisconnect(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const player = room.players.get(playerId);
  if (!player) return;
  
  // Remove player from room
  room.players.delete(playerId);
  
  // If room is empty, remove it
  if (room.players.size === 0) {
    rooms.delete(roomId);
    return;
  }
  
  // If the game master left, assign a new one or end the game
  if (playerId === room.gameMasterId) {
    const players = Array.from(room.players.entries());
    if (players.length > 0) {
      const [newGameMasterId, { player: newGameMaster }] = players[0];
      room.gameMasterId = newGameMasterId;
      newGameMaster.isGameMaster = true;
    } else {
      room.isActive = false;
    }
  }
  
  // Broadcast updated room state
  broadcastRoomState(room);
}

// Helper functions
function broadcastRoomState(room: ServerRoom) {
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

function broadcastToRoom(room: ServerRoom, event: string, data: any) {
  for (const [, { ws }] of room.players.entries()) {
    if (ws.readyState === ws.OPEN) {
      sendToClient(ws, event, data);
    }
  }
}

function sendToClient(ws: GameWebSocket, event: string, data: any) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

function getWinners(room: ServerRoom) {
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

// API route handler
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  // This would be where you'd validate the token if you had authentication
  
  return new Response('WebSocket server is running. Connect with a WebSocket client.', {
    status: 200,
    headers: {
      'content-type': 'text/plain',
    }
  });
}

// Export WebSocketServer for use in middleware
export const webSocketServer = initWebSocketServer(); 