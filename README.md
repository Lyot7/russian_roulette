# Russian Roulette Quiz Game

A multiplayer quiz game where players answer questions to gain points, with a twist of Russian Roulette for wrong answers.

## Features

- **Room Management**: Create and join game rooms with unique room codes
- **Player Profiles**: Take photos for player avatars
- **Quiz System**: Answer single and multiple-choice questions
- **Russian Roulette**: Risk-based system for wrong answers
  - Lose 1 point
  - Play Russian Roulette for random outcomes:
    - Nothing happens
    - Lose 2 points
    - Lose 8 points
    - Become the target (others can make you lose points)
- **Real-time Updates**: WebSocket-based gameplay for instant updates
- **No Database**: All questions stored in the frontend

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd russian_roulette
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server with WebSockets:
   ```bash
   npm run dev:server
   # or
   yarn dev:server
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### WebSocket Server

The game uses an integrated WebSocket server for real-time communication between players. The server is contained within the Next.js app using a custom server implementation:

- **server.js**: Custom server that integrates Next.js and WebSocket
- **src/server/game.js**: Game logic handling rooms, players, and game events
- **src/lib/websocket/client.ts**: Client-side WebSocket connection

When you start the server with `npm run dev:server`, it will automatically handle both HTTP and WebSocket connections.

## How to Play

1. **Create a Game**: 
   - One player becomes the Game Master and creates a room
   - Take a photo (optional)
   - Share the room code with other players

2. **Join a Game**:
   - Other players enter the room code
   - Enter name and take a photo (optional)

3. **Gameplay**:
   - Everyone starts with 7 points
   - Answer questions correctly: +1 point
   - Answer incorrectly: Choose to lose 1 point OR play Russian Roulette
   - Players with 0 or fewer points are eliminated
   - The game continues until all questions are answered

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Real-time Communication**: WebSockets (native WebSocket API)
- **State Management**: React hooks and context

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── (auth)/       # Authentication-related pages (join, create)
│   ├── (game)/       # Game-related pages
│   └── api/          # API endpoints
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── game/         # Game components
│   ├── layout/       # Layout components
│   └── ui/           # Reusable UI components
├── constants/        # Game constants and questions
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
│   ├── utils/        # General utilities
│   └── websocket/    # WebSocket client
├── server/           # Server-side logic
│   └── game.js       # Game logic for WebSocket server
└── types/            # TypeScript type definitions
```

## Deployment

For deployment, you can:

1. Use a hosting provider that supports WebSockets (Render, DigitalOcean, etc.)
2. Deploy as-is with the integrated WebSocket server
3. Set the `PORT` environment variable if needed: `PORT=8080 npm start`

## License

This project is licensed under the MIT License.
