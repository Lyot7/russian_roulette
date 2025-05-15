const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

// Import game logic
const {
  EVENTS,
  handleCreateRoom,
  handleJoinRoom,
  handleStartGame,
  handleSubmitAnswer,
  handlePlayRoulette,
  handleNextQuestion,
  handlePlayerDisconnect,
  rooms
} = require('./src/server/game');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Create WebSocket server
  const wss = new WebSocket.Server({ server });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.isAlive = true;
    
    // Handle ping/pong to keep connections alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle WebSocket messages
    ws.on('message', (message) => {
      try {
        const { event, data } = JSON.parse(message);
        console.log(`Received event: ${event}`, data);
        
        // Route to appropriate handler
        switch (event) {
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
            console.log(`Unknown event type: ${event}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      handlePlayerDisconnect(ws);
    });
  });
  
  // Set up ping interval to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        handlePlayerDisconnect(ws);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Start the server
  server.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log('> WebSocket server is active');
  });
}); 