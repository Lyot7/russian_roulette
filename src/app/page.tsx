'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGame = () => {
    setIsLoading(true);
    router.push('/create-game');
  };

  const handleJoinGame = () => {
    setIsLoading(true);
    router.push('/join-game');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Russian Roulette</h1>
        <p className="text-xl opacity-80">The ultimate quiz game of chance and skill</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <Button 
          onClick={handleCreateGame} 
          isFullWidth 
          size="lg" 
          disabled={isLoading}
        >
          Create Game
        </Button>
        
        <Button 
          onClick={handleJoinGame} 
          variant="secondary" 
          isFullWidth 
          size="lg" 
          disabled={isLoading}
        >
          Join Game
        </Button>
      </div>

      <div className="mt-16 text-sm opacity-70 text-center">
        <p>Everyone starts with 7 points</p>
        <p>Answer correctly: +1 point</p>
        <p>Answer incorrectly: Lose 1 point or play Russian Roulette</p>
      </div>
    </main>
  );
}
