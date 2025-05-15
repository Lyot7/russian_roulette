'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Offline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    // Force reload the page to check connectivity
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {isOnline ? 'You\'re back online!' : 'You\'re offline'}
        </h1>

        <div className="my-8">
          {isOnline ? (
            <p className="text-green-600">
              Your internet connection has been restored. You can now return to the game.
            </p>
          ) : (
            <>
              <p className="mb-4 text-gray-700">
                Looks like you've lost your internet connection. Russian Roulette requires an internet connection to play.
              </p>
              <p className="text-gray-700 mb-6">
                Please check your connection and try again.
              </p>
            </>
          )}
        </div>

        <div className="space-y-4">
          {isOnline ? (
            <Link href="/">
              <Button isFullWidth>
                Return to Home
              </Button>
            </Link>
          ) : (
            <Button onClick={handleRetry} isFullWidth>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </main>
  );
} 