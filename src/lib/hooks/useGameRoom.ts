import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import wsClient from '@/lib/websocket/client';
import { useWebSocket } from './useWebSocket';
import { EVENTS } from '@/constants/game';
import { Player } from '@/types/game';

interface UseGameRoomProps {
  roomId?: string;
  player?: Player | null;
  autoJoin?: boolean;
}

export function useGameRoom({
  roomId,
  player,
  autoJoin = false
}: UseGameRoomProps = {}) {
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  
  // Connect to WebSocket
  const wsHandlers = [
    {
      event: EVENTS.CONNECT,
      handler: (data: any) => {
        console.log('Connected to server', data);
        setError(null);
      }
    },
    {
      event: EVENTS.ERROR,
      handler: (data: any) => {
        console.error('Server error:', data);
        setError(data.message || 'An error occurred');
      }
    },
    {
      event: EVENTS.PLAYER_JOINED,
      handler: (data: any) => {
        if (data.players) {
          setPlayers(data.players);
        }
      }
    },
    {
      event: EVENTS.START_GAME,
      handler: () => {
        setGameState('playing');
      }
    },
    {
      event: EVENTS.END_GAME,
      handler: () => {
        setGameState('ended');
      }
    }
  ];
  
  // Initialize WebSocket connection
  const { isConnected, connect, send } = useWebSocket({
    handlers: wsHandlers
  });
  
  // Create a new room
  const createRoom = useCallback((playerData: Player) => {
    if (!isConnected) {
      connect();
    }
    
    setIsGameMaster(true);
    send(EVENTS.CREATE_ROOM, { player: playerData });
  }, [isConnected, connect, send]);
  
  // Join an existing room
  const joinRoom = useCallback((roomId: string, playerData: Player) => {
    if (!roomId) {
      setError('Room ID is required');
      return;
    }
    
    if (!isConnected) {
      connect();
    }
    
    send(EVENTS.JOIN_ROOM, { 
      roomId, 
      player: playerData 
    });
    
    setIsJoined(true);
  }, [isConnected, connect, send]);
  
  // Start the game (game master only)
  const startGame = useCallback(() => {
    if (!isGameMaster) {
      setError('Only game master can start the game');
      return;
    }
    
    send(EVENTS.START_GAME, { roomId });
  }, [isGameMaster, roomId, send]);
  
  // Handle auto-join if configured
  useEffect(() => {
    if (autoJoin && player && roomId && isConnected && !isJoined) {
      joinRoom(roomId, player);
    }
  }, [autoJoin, player, roomId, isConnected, isJoined, joinRoom]);
  
  return {
    isConnected,
    isJoined,
    players,
    error,
    isGameMaster,
    gameState,
    createRoom,
    joinRoom,
    startGame
  };
} 