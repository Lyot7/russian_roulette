'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { quizQuestions } from '@/constants/quizData';
import { getShuffledQuestions, getRouletteOutcome } from '@/lib/utils/game';
import { INITIAL_POINTS } from '@/constants/game';
import { Player, Question, RouletteOutcome } from '@/types/game';

export default function GameRoom() {
  const router = useRouter();
  const { roomId } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showingQuestion, setShowingQuestion] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [rouletteOutcome, setRouletteOutcome] = useState<RouletteOutcome | null>(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [playingRoulette, setPlayingRoulette] = useState(false);
  
  // Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the game
    try {
      // In a real app, this would connect to websocket and fetch players
      // For now, we'll use localStorage
      const storedPlayer = localStorage.getItem('player');
      const storedRoomId = localStorage.getItem('roomId');
      
      if (!storedPlayer || !storedRoomId || storedRoomId !== roomId) {
        // Player not authenticated or wrong room
        router.push('/');
        return;
      }
      
      const parsedPlayer = JSON.parse(storedPlayer) as Player;
      
      // Create a complete player object
      const fullPlayer: Player = {
        ...parsedPlayer,
        points: INITIAL_POINTS,
        isTarget: false,
        isActive: true,
      };
      
      setPlayer(fullPlayer);
      setAllPlayers([fullPlayer]); // In real app, we'd get all players from server
      
      // Initialize with shuffled questions
      const shuffled = getShuffledQuestions(quizQuestions);
      setQuestions(shuffled);
      
      // Simulate connection delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error initializing game:', err);
      setError('Failed to initialize game. Please try again.');
      setIsLoading(false);
    }
  }, [roomId, router]);

  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      // End game when we've gone through all questions
      setGameEnded(true);
      return;
    }
    
    setSelectedAnswers([]);
    setShowingQuestion(true);
  };

  const handleAnswerSelect = (answerId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'single') {
      setSelectedAnswers([answerId]);
    } else {
      // Toggle the answer for multiple choice
      setSelectedAnswers(prev => 
        prev.includes(answerId) 
          ? prev.filter(id => id !== answerId) 
          : [...prev, answerId]
      );
    }
  };

  const submitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);
    
    // Check if the answer is correct
    const isCorrect = currentQuestion.type === 'single'
      // For single choice, the selected answer must match the correct one
      ? correctAnswerIds.includes(selectedAnswers[0])
      // For multiple choice, all correct answers must be selected and no incorrect ones
      : selectedAnswers.length === correctAnswerIds.length &&
        selectedAnswers.every(id => correctAnswerIds.includes(id));
    
    if (isCorrect) {
      // Correct answer: gain 1 point
      setPlayer(prev => {
        if (!prev) return prev;
        return { ...prev, points: prev.points + 1 };
      });
    } else {
      // Wrong answer: show options
      setShowRoulette(true);
    }
    
    setShowingQuestion(false);
  };

  const loseOnePoint = () => {
    setPlayer(prev => {
      if (!prev) return prev;
      return { ...prev, points: prev.points - 1 };
    });
    
    setShowRoulette(false);
    moveToNextQuestion();
  };

  const playRoulette = () => {
    setPlayingRoulette(true);
    setShowRoulette(false);
    
    // Simulate roulette spinning
    setTimeout(() => {
      const outcome = getRouletteOutcome();
      setRouletteOutcome(outcome);
      setShowOutcome(true);
      
      // Apply outcome
      setPlayer(prev => {
        if (!prev) return prev;
        
        if (outcome.type === 'losePoints') {
          return { ...prev, points: prev.points - outcome.amount };
        } else if (outcome.type === 'becomeTarget') {
          return { ...prev, isTarget: true };
        }
        
        return prev;
      });
      
      setPlayingRoulette(false);
    }, 2000);
  };

  const closeOutcome = () => {
    setShowOutcome(false);
    setRouletteOutcome(null);
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    
    // Small delay before showing next question
    setTimeout(() => {
      nextQuestion();
    }, 500);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="mb-4">Player not found. Please join the game first.</div>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-8">
      {/* Header with room code and player info */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Game Room: {roomId}</h1>
          <p className="text-sm opacity-70">
            {player.isGameMaster ? 'Game Master' : 'Player'}: {player.name}
          </p>
        </div>
        <div className="text-lg font-semibold">
          Points: {player.points}
          {player.isTarget && <span className="ml-2 text-red-600">(TARGET)</span>}
        </div>
      </div>

      {/* Game content */}
      <div className="flex-1 flex flex-col">
        {!gameStarted && !gameEnded && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome to Russian Roulette!</h2>
              <p className="text-lg mb-4">Room Code: <span className="font-bold">{roomId}</span></p>
              <p>Share this code with your friends to join the game.</p>
              <p className="mt-4">Players: {allPlayers.length}</p>
            </div>

            {player.isGameMaster && (
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            )}

            {!player.isGameMaster && (
              <p>Waiting for the Game Master to start the game...</p>
            )}
          </div>
        )}

        {gameStarted && !gameEnded && (
          <div className="flex-1">
            {showingQuestion && currentQuestionIndex < questions.length && (
              <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-6">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                
                <div className="mb-6">
                  <p className="text-lg mb-4">{questions[currentQuestionIndex].text}</p>
                  <p className="text-sm opacity-70 mb-4">
                    {questions[currentQuestionIndex].type === 'multiple' 
                      ? 'Select all that apply' 
                      : 'Select one answer'}
                  </p>
                  
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].answers.map(answer => (
                      <div 
                        key={answer.id}
                        className={`border p-3 rounded-md cursor-pointer transition-colors ${
                          selectedAnswers.includes(answer.id) 
                            ? 'bg-blue-100 border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleAnswerSelect(answer.id)}
                      >
                        {answer.text}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={submitAnswer} 
                  disabled={selectedAnswers.length === 0}
                  isFullWidth
                >
                  Submit Answer
                </Button>
              </div>
            )}

            {showRoulette && (
              <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto text-center">
                <h2 className="text-xl font-bold mb-4">Wrong Answer!</h2>
                <p className="mb-6">Choose your fate:</p>
                
                <div className="flex flex-col gap-4 sm:flex-row justify-center">
                  <Button 
                    variant="secondary" 
                    onClick={loseOnePoint} 
                    size="lg"
                  >
                    Lose 1 Point
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={playRoulette} 
                    size="lg"
                  >
                    Play Russian Roulette
                  </Button>
                </div>
              </div>
            )}

            {playingRoulette && (
              <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto text-center">
                <h2 className="text-xl font-bold mb-4">Spinning the Cylinder...</h2>
                <p className="text-lg animate-pulse">Click... Click... Click...</p>
              </div>
            )}

            {showOutcome && rouletteOutcome && (
              <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto text-center">
                <h2 className="text-xl font-bold mb-4">Your Fate</h2>
                
                {rouletteOutcome.type === 'nothing' && (
                  <p className="text-green-600 text-lg mb-6">Lucky! Nothing happens.</p>
                )}
                
                {rouletteOutcome.type === 'losePoints' && (
                  <p className="text-red-600 text-lg mb-6">
                    You lose {rouletteOutcome.amount} points!
                  </p>
                )}
                
                {rouletteOutcome.type === 'becomeTarget' && (
                  <p className="text-orange-600 text-lg mb-6">
                    You are now the Target! Other players can make you lose points.
                  </p>
                )}
                
                <Button onClick={closeOutcome}>Continue</Button>
              </div>
            )}
          </div>
        )}

        {gameEnded && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-lg mb-2">Your final score: {player.points}</p>
            <p className="mb-6">
              {player.points <= 0 
                ? 'You have been eliminated!' 
                : 'You survived the Russian Roulette!'}
            </p>
            
            <Link href="/">
              <Button size="lg">Return to Home</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
} 