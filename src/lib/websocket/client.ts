import { EVENTS } from '../../constants/game';

type Callback = (data?: any) => void;
type EventsMap = Record<string, Callback[]>;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private events: EventsMap = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Only initialize in browser environment
      this.setupBeforeUnload();
    }
  }

  connect(customUrl?: string): void {
    if (typeof window === 'undefined') return;
    
    // Generate WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = customUrl || `${protocol}//${host}/api/socket`;
    
    this.url = url;
    console.log(`Connecting to WebSocket at ${url}`);
    
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.trigger(EVENTS.CONNECT);
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: code ${event.code}`, event.reason);
      this.trigger(EVENTS.DISCONNECT);
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.trigger(EVENTS.ERROR, error);
    };

    this.socket.onmessage = (message) => {
      try {
        const parsedMessage = JSON.parse(message.data);
        const { event, data } = parsedMessage;
        
        console.log(`Received WebSocket event: ${event}`, data);
        if (event) {
          this.trigger(event, data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.url = null;
      this.socket.close();
      this.socket = null;
    }
  }

  private attemptReconnect(): void {
    if (!this.url || this.reconnectAttempts >= this.maxReconnectAttempts) return;

    console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
    setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect(this.url!);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(event: string, data?: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected, cannot send message');
      return;
    }

    const message = JSON.stringify({ event, data });
    console.log(`Sending WebSocket event: ${event}`, data);
    this.socket.send(message);
  }

  on(event: string, callback: Callback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback?: Callback): void {
    if (!callback) {
      delete this.events[event];
      return;
    }

    const callbacks = this.events[event];
    if (callbacks) {
      this.events[event] = callbacks.filter(cb => cb !== callback);
    }
  }

  private trigger(event: string, data?: any): void {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private setupBeforeUnload(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }
}

// Create a singleton instance
const wsClient = new WebSocketClient();
export default wsClient; 