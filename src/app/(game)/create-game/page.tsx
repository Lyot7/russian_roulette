'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import CameraCapture from '@/components/auth/CameraCapture';
import { generateRoomId } from '@/lib/utils/game';

export default function CreateGame() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'photo' | 'creating'>('info');
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = (photoData: string) => {
    setPhoto(photoData);
    setStep('creating');
  };

  const handleCreateGame = async () => {
    if (!name) return;

    setIsLoading(true);
    
    try {
      // In a real app, we'd connect to WebSocket here
      // For now, we'll just generate a room ID and redirect
      const roomId = generateRoomId();
      
      // Store game master info in localStorage
      const player = {
        id: crypto.randomUUID(),
        name,
        photo: photo || undefined,
        isGameMaster: true,
      };
      
      localStorage.setItem('player', JSON.stringify(player));
      localStorage.setItem('roomId', roomId);
      
      // Redirect to game room
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
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
          <h1 className="text-2xl font-bold mb-6 text-center">Create New Game</h1>

          {step === 'info' && (
            <>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-2 text-sm font-medium">
                  Your Name (Game Master)
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

              <Button
                onClick={() => setStep('photo')}
                isFullWidth
                disabled={!name}
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
                onClick={() => setStep('creating')} 
                isFullWidth
              >
                Skip Photo
              </Button>
            </div>
          )}

          {step === 'creating' && (
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

              <h2 className="text-xl font-medium text-center">Ready to create game?</h2>

              <Button
                onClick={handleCreateGame}
                isFullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Game'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 