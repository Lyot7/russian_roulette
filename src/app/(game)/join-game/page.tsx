'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import CameraCapture from '@/components/auth/CameraCapture';

export default function JoinGame() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'photo' | 'joining'>('info');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = (photoData: string) => {
    setPhoto(photoData);
    setStep('joining');
  };

  const handleJoinGame = async () => {
    if (!name || !roomId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, we'd validate the room ID with the server first
      // For now, we'll just store player info and redirect
      
      // Store player info in localStorage
      const player = {
        id: crypto.randomUUID(),
        name,
        photo: photo || undefined,
        isGameMaster: false,
      };
      
      localStorage.setItem('player', JSON.stringify(player));
      localStorage.setItem('roomId', roomId);
      
      // Redirect to game room
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      setError('Failed to join game. Please check the room code and try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col p-8">
      <div className="flex items-center mb-8">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Join Game</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {step === 'info' && (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="roomId" className="block mb-2 text-sm font-medium">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter room code"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep('photo')}
                isFullWidth
                disabled={!name || !roomId}
              >
                Next: Take Photo
              </Button>
            </>
          )}

          {step === 'photo' && (
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Take Your Photo</h2>
              <CameraCapture onCapture={handleCapture} />
              <Button 
                variant="secondary" 
                onClick={() => setStep('joining')} 
                isFullWidth
              >
                Skip Photo
              </Button>
            </div>
          )}

          {step === 'joining' && (
            <div className="space-y-4">
              {photo && (
                <div className="flex justify-center mb-4">
                  <img
                    src={photo}
                    alt="Player"
                    className="w-32 h-32 object-cover rounded-full"
                  />
                </div>
              )}

              <h2 className="text-xl font-medium text-center">Ready to join game?</h2>

              <Button
                onClick={handleJoinGame}
                isFullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Game'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 