import { useState, useEffect, useCallback } from 'react';
import wsClient from '../websocket/client';
import { EVENTS } from '../../constants/game';

type WebSocketHandler = {
  event: string;
  handler: (data: any) => void;
};

interface UseWebSocketProps {
  url?: string;
  handlers?: WebSocketHandler[];
  autoConnect?: boolean;
}

export function useWebSocket({
  url,
  handlers = [],
  autoConnect = false
}: UseWebSocketProps = {}) {
  const [isConnected, setIsConnected] = useState(false);

  // Handle connection status
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    wsClient.on(EVENTS.CONNECT, onConnect);
    wsClient.on(EVENTS.DISCONNECT, onDisconnect);

    return () => {
      wsClient.off(EVENTS.CONNECT, onConnect);
      wsClient.off(EVENTS.DISCONNECT, onDisconnect);
    };
  }, []);

  // Register event handlers
  useEffect(() => {
    if (handlers.length === 0) return;

    // Register all handlers
    handlers.forEach(({ event, handler }) => {
      wsClient.on(event, handler);
    });

    // Cleanup on unmount
    return () => {
      handlers.forEach(({ event, handler }) => {
        wsClient.off(event, handler);
      });
    };
  }, [handlers]);

  // Auto connect if URL is provided and autoConnect is true
  useEffect(() => {
    if (url && autoConnect && !isConnected) {
      wsClient.connect(url);
    }
    
    return () => {
      if (autoConnect) {
        wsClient.disconnect();
      }
    };
  }, [url, autoConnect, isConnected]);

  const connect = useCallback((socketUrl?: string) => {
    wsClient.connect(socketUrl || url || '');
  }, [url]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  const send = useCallback((event: string, data?: any) => {
    wsClient.send(event, data);
  }, []);

  return { isConnected, connect, disconnect, send };
} 