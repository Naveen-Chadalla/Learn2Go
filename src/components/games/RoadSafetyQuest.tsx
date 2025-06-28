import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Clock, 
  HelpCircle, 
  Volume2, 
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Info,
  Settings,
  CheckCircle,
  XCircle,
  Star,
  Brain,
  Home,
  MapPin,
  Flag,
  User,
  Bike,
  Car,
  Shield
} from 'lucide-react';

interface RoadSafetyQuestProps {
  onComplete: (score: number) => void;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  language?: string;
}

// Game entity interfaces
interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  type: 'pedestrian' | 'cyclist' | 'driver';
  lives: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'pedestrian' | 'cyclist' | 'trafficLight' | 'sign' | 'crosswalk' | 'hazard';
  state?: 'red' | 'yellow' | 'green' | 'walk' | 'stop';
  direction?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
  dangerous: boolean;
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crosswalk' | 'trafficSignal' | 'blindTurn' | 'zebraCrossing' | 'parkingZone' | 'destination';
  completed: boolean;
  instructions: string;
}

interface Challenge {
  id: string;
  type: 'reaction' | 'decision' | 'awareness';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  completed: boolean;
  timeLimit: number;
}

interface GameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  safetyTips: string[];
  currentTip: number;
  violations: number;
  checkpointsCompleted: number;
  challengesCompleted: number;
}

const RoadSafetyQuest: React.FC<RoadSafetyQuestProps> = ({ 
  onComplete, 
  theme,
  language = 'en'
}) => {
  // Game canvas references
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    level: 1,
    timeLeft: 300,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    safetyTips: [
      "Always look both ways before crossing",
      "Stop at red lights and stop signs",
      "Use crosswalks when available",
      "Wear a helmet when cycling",
      "Avoid distractions while walking or driving",
      "Yield to pedestrians at crosswalks",
      "Signal before turning or changing lanes",
      "Maintain a safe following distance",
      "Adjust speed for weather conditions",
      "Check blind spots before changing lanes"
    ],
    currentTip: 0,
    violations: 0,
    checkpointsCompleted: 0,
    challengesCompleted: 0
  });
  
  // Player state
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    direction: 'right',
    isMoving: false,
    type: 'pedestrian',
    lives: 3
  });
  
  // Game entities
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  
  // UI state
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyStates, setKeyStates] = useState<{[key: string]: boolean}>({});
  const [tutorialStep, setTutorialStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFailMessage, setShowFailMessage] = useState(false);
  const [failMessage, setFailMessage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<'pedestrian' | 'cyclist' | 'driver'>('pedestrian');
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Initialize game based on character selection
  useEffect(() => {
    if (!gameStarted) return;
    
    // Clear any existing game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Reset game state
    setGameState({
      score: 0,
      lives: 3,
      level: 1,
      timeLeft: 300,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyTips: [
        "Always look both ways before crossing",
        "Stop at red lights and stop signs",
        "Use crosswalks when available",
        "Wear a helmet when cycling",
        "Avoid distractions while walking or driving",
        "Yield to pedestrians at crosswalks",
        "Signal before turning or changing lanes",
        "Maintain a safe following distance",
        "Adjust speed for weather conditions",
        "Check blind spots before changing lanes"
      ],
      currentTip: 0,
      violations: 0,
      checkpointsCompleted: 0,
      challengesCompleted: 0
    });
    
    // Initialize player based on character type
    setPlayer({
      x: 50,
      y: 300,
      width: selectedCharacter === 'driver' ? 60 : 40,
      height: selectedCharacter === 'driver' ? 30 : 40,
      speed: selectedCharacter === 'pedestrian' ? 3 : selectedCharacter === 'cyclist' ? 5 : 7,
      direction: 'right',
      isMoving: false,
      type: selectedCharacter,
      lives: 3
    });
    
    // Initialize game entities
    initializeGameEntities();
    
    // Start game loop
    startGameLoop();
    
    // Rotate safety tips
    const tipInterval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        currentTip: (prev.currentTip + 1) % prev.safetyTips.length
      }));
    }, 5000);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      clearInterval(tipInterval);
    };
  }, [gameStarted, selectedCharacter]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isGameOver || showTutorial || currentChallenge) return;
      
      setKeyStates(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeyStates(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPaused, gameState.isGameOver, showTutorial, currentChallenge]);
  
  // Game timer
  useEffect(() => {
    if (!gameStarted || gameState.isPaused || gameState.isGameOver || showTutorial || currentChallenge) return;
    
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(timer);
          return { ...prev, isGameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameState.isPaused, gameState.isGameOver, showTutorial, currentChallenge]);
  
  // Initialize game entities
  const initializeGameEntities = () => {
    // Create checkpoints
    const newCheckpoints: Checkpoint[] = [
      {
        id: 'checkpoint-1',
        x: 200,
        y: 300,
        width: 80,
        height: 80,
        type: 'crosswalk',
        completed: false,
        instructions: "Use the crosswalk to safely cross the street"
      },
      {
        id: 'checkpoint-2',
        x: 400,
        y: 200,
        width: 80,
        height: 80,
        type: 'trafficSignal',
        completed: false,
        instructions: "Wait for the green light before proceeding"
      },
      {
        id: 'checkpoint-3',
        x: 600,
        y: 300,
        width: 80,
        height: 80,
        type: 'blindTurn',
        completed: false,
        instructions: "Slow down and check for oncoming traffic"
      },
      {
        id: 'checkpoint-4',
        x: 800,
        y: 200,
        width: 80,
        height: 80,
        type: 'destination',
        completed: false,
        instructions: "Reach your destination safely"
      }
    ];
    
    // Create obstacles
    const newObstacles: Obstacle[] = [
      {
        id: 'car-1',
        x: 300,
        y: 150,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'left',
        speed: 2,
        dangerous: true
      },
      {
        id: 'car-2',
        x: 500,
        y: 350,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'right',
        speed: 3,
        dangerous: true
      },
      {
        id: 'traffic-light-1',
        x: 400,
        y: 120,
        width: 30,
        height: 60,
        type: 'trafficLight',
        state: 'red',
        dangerous: false
      },
      {
        id: 'pedestrian-1',
        x: 250,
        y: 250,
        width: 20,
        height: 40,
        type: 'pedestrian',
        direction: 'down',
        speed: 1,
        dangerous: false
      },
      {
        id: 'crosswalk-1',
        x: 200,
        y: 280,
        width: 80,
        height: 40,
        type: 'crosswalk',
        dangerous: false
      },
      {
        id: 'hazard-1',
        x: 550,
        y: 280,
        width: 30,
        height: 30,
        type: 'hazard',
        dangerous: true
      }
    ];
    
    // Create challenges
    const newChallenges: Challenge[] = [
      {
        id: 'challenge-1',
        type: 'decision',
        question: "You're approaching a crosswalk with pedestrians waiting. What should you do?",
        options: [
          "Speed up to pass before they start crossing",
          "Slow down and stop to let them cross",
          "Maintain speed and honk to warn them",
          "Change lanes to avoid stopping"
        ],
        correctAnswer: 1,
        explanation: "Always yield to pedestrians at crosswalks. Stopping to let them cross is the safe and legal action.",
        completed: false,
        timeLimit: 15
      },
      {
        id: 'challenge-2',
        type: 'awareness',
        question: "You see a ball roll into the street. What should you anticipate?",
        options: [
          "Nothing, it's just a ball",
          "A child might run after it",
          "Someone will come pick it up later",
          "The wind will blow it away"
        ],
        correctAnswer: 1,
        explanation: "When you see a ball or toy in the street, always anticipate that a child might follow it without checking for traffic.",
        completed: false,
        timeLimit: 15
      },
      {
        id: 'challenge-3',
        type: 'reaction',
        question: "The traffic light ahead turns yellow as you approach. What's the safest action?",
        options: [
          "Speed up to make it through",
          "Maintain speed and proceed through",
          "Brake hard to stop immediately",
          "Slow down and prepare to stop if safe to do so"
        ],
        correctAnswer: 3,
        explanation: "When a light turns yellow, you should slow down and prepare to stop if it's safe to do so. Only proceed if stopping would be dangerous.",
        completed: false,
        timeLimit: 15
      }
    ];
    
    setCheckpoints(newCheckpoints);
    setObstacles(newObstacles);
    setChallenges(newChallenges);
  };
  
  // Start game loop
  const startGameLoop = () => {
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver && !showTutorial && !currentChallenge) {
        updateGameState();
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Update game state
  const updateGameState = () => {
    // Update player position based on keyboard input
    updatePlayerPosition();
    
    // Update obstacles
    updateObstacles();
    
    // Check collisions
    checkCollisions();
    
    // Check checkpoints
    checkCheckpoints();
    
    // Check if level is complete
    checkLevelCompletion();
  };
  
  // Update player position
  const updatePlayerPosition = () => {
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      let newDirection = prev.direction;
      let isMoving = false;
      
      // Handle keyboard input
      if (keyStates['arrowup'] || keyStates['w']) {
        newY = Math.max(0, prev.y - prev.speed);
        newDirection = 'up';
        isMoving = true;
      }
      if (keyStates['arrowdown'] || keyStates['s']) {
        newY = Math.min(canvasRef.current?.clientHeight || 400 - prev.height, prev.y + prev.speed);
        newDirection = 'down';
        isMoving = true;
      }
      if (keyStates['arrowleft'] || keyStates['a']) {
        newX = Math.max(0, prev.x - prev.speed);
        newDirection = 'left';
        isMoving = true;
      }
      if (keyStates['arrowright'] || keyStates['d']) {
        newX = Math.min(canvasRef.current?.clientWidth || 800 - prev.width, prev.x + prev.speed);
        newDirection = 'right';
        isMoving = true;
      }
      
      return {
        ...prev,
        x: newX,
        y: newY,
        direction: newDirection,
        isMoving
      };
    });
  };
  
  // Update obstacles
  const updateObstacles = () => {
    setObstacles(prev => {
      return prev.map(obstacle => {
        if (obstacle.type === 'trafficLight') {
          // Randomly change traffic light state
          if (Math.random() < 0.005) { // 0.5% chance per frame
            const states = ['red', 'yellow', 'green'] as const;
            const currentIndex = states.indexOf(obstacle.state as any);
            const nextIndex = (currentIndex + 1) % states.length;
            return { ...obstacle, state: states[nextIndex] };
          }
          return obstacle;
        }
        
        if (obstacle.direction && obstacle.speed) {
          // Move obstacle
          let newX = obstacle.x;
          let newY = obstacle.y;
          
          switch (obstacle.direction) {
            case 'up':
              newY -= obstacle.speed;
              if (newY < -obstacle.height) newY = canvasRef.current?.clientHeight || 400;
              break;
            case 'down':
              newY += obstacle.speed;
              if (newY > (canvasRef.current?.clientHeight || 400)) newY = -obstacle.height;
              break;
            case 'left':
              newX -= obstacle.speed;
              if (newX < -obstacle.width) newX = canvasRef.current?.clientWidth || 800;
              break;
            case 'right':
              newX += obstacle.speed;
              if (newX > (canvasRef.current?.clientWidth || 800)) newX = -obstacle.width;
              break;
          }
          
          return { ...obstacle, x: newX, y: newY };
        }
        
        return obstacle;
      });
    });
  };
  
  // Check collisions
  const checkCollisions = () => {
    // Check collisions with obstacles
    obstacles.forEach(obstacle => {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        // Handle collision based on obstacle type
        handleObstacleCollision(obstacle);
      }
    });
  };
  
  // Handle collision with obstacle
  const handleObstacleCollision = (obstacle: Obstacle) => {
    if (obstacle.dangerous) {
      // Collision with dangerous obstacle - lose a life
      setGameState(prev => {
        const newLives = prev.lives - 1;
        
        // Show fail message
        setFailMessage('Collision! -1 life');
        setShowFailMessage(true);
        setTimeout(() => setShowFailMessage(false), 1500);
        
        if (newLives <= 0) {
          return { ...prev, lives: 0, isGameOver: true };
        }
        
        return { ...prev, lives: newLives, violations: prev.violations + 1 };
      });
      
      // Reset player position
      setPlayer(prev => ({
        ...prev,
        x: 50,
        y: 300
      }));
    } else if (obstacle.type === 'trafficLight') {
      // Check if player is obeying traffic light
      if (obstacle.state === 'red' && player.isMoving) {
        // Running a red light - lose points
        setGameState(prev => {
          // Show fail message
          setFailMessage('Red light violation! -20 points');
          setShowFailMessage(true);
          setTimeout(() => setShowFailMessage(false), 1500);
          
          return { 
            ...prev, 
            score: Math.max(0, prev.score - 20),
            violations: prev.violations + 1
          };
        });
      }
    }
  };
  
  // Check checkpoints
  const checkCheckpoints = () => {
    setCheckpoints(prev => {
      let updatedCheckpoints = [...prev];
      let checkpointCompleted = false;
      
      updatedCheckpoints = updatedCheckpoints.map(checkpoint => {
        // Skip already completed checkpoints
        if (checkpoint.completed) return checkpoint;
        
        // Check if player is at checkpoint
        if (
          player.x < checkpoint.x + checkpoint.width &&
          player.x + player.width > checkpoint.x &&
          player.y < checkpoint.y + checkpoint.height &&
          player.y + player.height > checkpoint.y
        ) {
          checkpointCompleted = true;
          
          // Show success message
          setSuccessMessage(`Checkpoint reached! +50 points`);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          // Trigger challenge
          const uncompletedChallenges = challenges.filter(c => !c.completed);
          if (uncompletedChallenges.length > 0) {
            const randomChallenge = uncompletedChallenges[Math.floor(Math.random() * uncompletedChallenges.length)];
            setCurrentChallenge(randomChallenge);
            setSelectedAnswer(null);
            setShowChallengeResult(false);
          }
          
          return { ...checkpoint, completed: true };
        }
        
        return checkpoint;
      });
      
      if (checkpointCompleted) {
        // Update game state
        setGameState(prev => ({
          ...prev,
          score: prev.score + 50,
          checkpointsCompleted: prev.checkpointsCompleted + 1
        }));
      }
      
      return updatedCheckpoints;
    });
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Check if all checkpoints are completed
    const allCheckpointsCompleted = checkpoints.every(c => c.completed);
    
    if (allCheckpointsCompleted && !gameState.isLevelComplete) {
      setGameState(prev => {
        // Level complete bonus
        const levelBonus = prev.level * 100;
        const timeBonus = prev.timeLeft * 2;
        const safetyBonus = Math.max(0, 300 - (prev.violations * 50));
        const totalBonus = levelBonus + timeBonus + safetyBonus;
        
        // Show success message
        setSuccessMessage(`Level Complete! +${totalBonus} bonus points!`);
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          const finalScore = prev.score + totalBonus;
          const maxPossibleScore = 1000; // Adjust based on your scoring system
          const percentage = Math.min(100, Math.round((finalScore / maxPossibleScore) * 100));
          onComplete(percentage);
        }, 2000);
        
        return {
          ...prev,
          score: prev.score + totalBonus,
          isLevelComplete: true,
          isGameOver: true
        };
      });
    }
  };
  
  // Handle challenge answer
  const handleChallengeAnswer = (answerIndex: number) => {
    if (!currentChallenge) return;
    
    setSelectedAnswer(answerIndex);
    setShowChallengeResult(true);
    
    // Check if answer is correct
    const isCorrect = answerIndex === currentChallenge.correctAnswer;
    
    if (isCorrect) {
      // Award points for correct answer
      setGameState(prev => ({
        ...prev,
        score: prev.score + 30,
        challengesCompleted: prev.challengesCompleted + 1
      }));
      
      // Show success message
      setSuccessMessage('Correct answer! +30 points');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 1500);
    } else {
      // Penalty for wrong answer
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 10),
        violations: prev.violations + 1
      }));
      
      // Show fail message
      setFailMessage('Incorrect answer! -10 points');
      setShowFailMessage(true);
      setTimeout(() => setShowFailMessage(false), 1500);
    }
    
    // Close challenge after delay
    setTimeout(() => {
      setChallenges(prev => 
        prev.map(c => 
          c.id === currentChallenge.id ? { ...c, completed: true } : c
        )
      );
      setCurrentChallenge(null);
    }, 3000);
  };
  
  // Handle touch controls for mobile
  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`arrow${direction}`]: true }));
  };
  
  const handleTouchEnd = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`arrow${direction}`]: false }));
  };
  
  // Start game
  const startGame = () => {
    setShowTutorial(false);
    setGameStarted(true);
  };
  
  // Restart game
  const restartGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      level: 1,
      timeLeft: 300,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyTips: [
        "Always look both ways before crossing",
        "Stop at red lights and stop signs",
        "Use crosswalks when available",
        "Wear a helmet when cycling",
        "Avoid distractions while walking or driving",
        "Yield to pedestrians at crosswalks",
        "Signal before turning or changing lanes",
        "Maintain a safe following distance",
        "Adjust speed for weather conditions",
        "Check blind spots before changing lanes"
      ],
      currentTip: 0,
      violations: 0,
      checkpointsCompleted: 0,
      challengesCompleted: 0
    });
    
    setShowTutorial(true);
    setGameStarted(false);
    setCurrentChallenge(null);
  };
  
  // Toggle pause
  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Get tutorial content
  const getTutorialContent = () => {
    const tutorials = [
      {
        title: "Welcome to Road Safety Quest!",
        content: "Learn road safety principles while navigating through a virtual city. Your goal is to reach your destination safely by following traffic rules and making smart decisions.",
        image: "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Choose Your Character",
        content: "Select whether you want to play as a pedestrian, cyclist, or driver. Each character has different abilities and challenges.",
        image: null
      },
      {
        title: "Game Objectives",
        content: "Navigate through checkpoints, avoid hazards, and complete safety challenges. Remember the core principles: awareness, responsibility, respect, and preparation.",
        image: "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Controls & Challenges",
        content: isMobile 
          ? "Use the on-screen arrow buttons to move. At checkpoints, you'll face safety challenges that test your knowledge."
          : "Use arrow keys or WASD to move. At checkpoints, you'll face safety challenges that test your knowledge.",
        image: null
      },
      {
        title: "Ready to Play?",
        content: "Remember, safety first! Your goal is to navigate safely while following all traffic rules. Good luck!",
        image: null
      }
    ];
    
    return tutorials[tutorialStep];
  };
  
  // Character selection screen
  const renderCharacterSelection = () => {
    const characters = [
      { 
        type: 'pedestrian' as const, 
        name: 'Pedestrian', 
        icon: <User className="h-8 w-8" />, 
        description: "Slower movement but can navigate tight spaces. Focus on crosswalk safety.",
        color: "from-blue-500 to-cyan-500"
      },
      { 
        type: 'cyclist' as const, 
        name: 'Cyclist', 
        icon: <Bike className="h-8 w-8" />, 
        description: "Medium speed with moderate maneuverability. Must follow bike lane rules.",
        color: "from-green-500 to-emerald-500"
      },
      { 
        type: 'driver' as const, 
        name: 'Driver', 
        icon: <Car className="h-8 w-8" />, 
        description: "Fastest but must follow strict road rules. Watch for pedestrians and signals.",
        color: "from-purple-500 to-pink-500"
      }
    ];
    
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Character</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {characters.map((character) => (
            <motion.button
              key={character.type}
              onClick={() => setSelectedCharacter(character.type)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-6 rounded-xl transition-all duration-200 ${
                selectedCharacter === character.type
                  ? `bg-gradient-to-r ${character.color} text-white shadow-lg`
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedCharacter === character.type
                    ? 'bg-white/20'
                    : `bg-gradient-to-r ${character.color} bg-opacity-10`
                }`}>
                  {character.icon}
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{character.name}</div>
                  <p className="text-sm mt-2 opacity-90">{character.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render game UI
  const renderGameUI = () => {
    if (showTutorial) {
      const tutorial = getTutorialContent();
      
      return (
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl mb-6"
          >
            🏙️
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {tutorial.title}
          </h2>
          
          {tutorial.image && (
            <div className="mb-6">
              <img 
                src={tutorial.image} 
                alt="Tutorial" 
                className="w-full max-w-md mx-auto h-48 object-cover rounded-xl"
              />
            </div>
          )}
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {tutorial.content}
          </p>
          
          {tutorialStep === 1 && renderCharacterSelection()}
          
          <div className="flex justify-center space-x-4 mt-6">
            {tutorialStep > 0 && (
              <button
                onClick={() => setTutorialStep(prev => prev - 1)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
            )}
            
            {tutorialStep < 4 ? (
              <button
                onClick={() => setTutorialStep(prev => prev + 1)}
                className="px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                Next
              </button>
            ) : (
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                <Play className="h-5 w-5" />
                <span>Start Quest</span>
              </motion.button>
            )}
          </div>
        </div>
      );
    }
    
    if (gameState.isGameOver) {
      const finalScore = gameState.score;
      const maxPossibleScore = 1000; // Adjust based on your scoring system
      const percentage = Math.min(100, Math.max(0, Math.round((finalScore / maxPossibleScore) * 100)));
      
      return (
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl mb-6"
          >
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : '👍'}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Quest Complete!
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{gameState.score}</div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{gameState.checkpointsCompleted}</div>
              <div className="text-sm text-gray-600">Checkpoints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{gameState.challengesCompleted}</div>
              <div className="text-sm text-gray-600">Challenges Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{percentage}%</div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Road Safety Assessment:</h3>
            <p className="text-blue-800 text-sm">
              {percentage >= 80 
                ? "Excellent! You've demonstrated outstanding knowledge of road safety principles. Your careful navigation and rule-following would make you a model road user."
                : percentage >= 60 
                ? "Good job! You have a solid understanding of road safety, but there's room for improvement in following all rules consistently."
                : "You've completed the quest, but should review road safety rules more carefully. Remember that following rules keeps everyone safe on the road."}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={restartGame}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            
            <button
              onClick={() => onComplete(percentage)}
              className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
            >
              <Trophy className="h-4 w-4" />
              <span>Continue</span>
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Game HUD */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{gameState.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {'❤️'.repeat(gameState.lives)}
              </div>
              <div className="text-sm text-gray-600">Lives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{gameState.checkpointsCompleted}</div>
              <div className="text-sm text-gray-600">Checkpoints</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className={`text-lg font-bold ${gameState.timeLeft <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                {gameState.timeLeft}s
              </span>
            </div>
            
            <button
              onClick={togglePause}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {gameState.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Safety Tip */}
        <div className="mb-6 bg-blue-50 rounded-xl p-3 border border-blue-200">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <span className="font-medium">Safety Tip:</span> {gameState.safetyTips[gameState.currentTip]}
            </p>
          </div>
        </div>
        
        {/* Game Canvas */}
        <div 
          ref={canvasRef}
          className="relative bg-gray-200 rounded-3xl overflow-hidden shadow-2xl mb-6" 
          style={{ height: '400px' }}
        >
          {/* City background */}
          <div className="absolute inset-0 bg-gray-700">
            {/* Roads */}
            <div className="absolute top-1/2 left-0 right-0 h-20 bg-gray-600 transform -translate-y-1/2">
              {/* Road markings */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2 dashed-line"></div>
            </div>
            
            <div className="absolute left-1/4 top-0 bottom-0 w-20 bg-gray-600 transform -translate-x-1/2">
              {/* Road markings */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
            </div>
            
            <div className="absolute left-3/4 top-0 bottom-0 w-20 bg-gray-600 transform -translate-x-1/2">
              {/* Road markings */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
            </div>
          </div>
          
          {/* Start and destination markers */}
          <div className="absolute left-10 top-300 bg-green-500 rounded-full p-3 shadow-lg">
            <Home className="h-6 w-6 text-white" />
          </div>
          
          <div className="absolute right-10 top-200 bg-red-500 rounded-full p-3 shadow-lg">
            <Flag className="h-6 w-6 text-white" />
          </div>
          
          {/* Render checkpoints */}
          {checkpoints.map(checkpoint => (
            <div
              key={checkpoint.id}
              className={`absolute rounded-lg border-2 ${
                checkpoint.completed ? 'border-green-500 bg-green-100/30' : 'border-blue-500 bg-blue-100/30'
              }`}
              style={{
                left: checkpoint.x,
                top: checkpoint.y,
                width: checkpoint.width,
                height: checkpoint.height
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {checkpoint.type === 'crosswalk' && (
                  <div className="text-2xl">🚶</div>
                )}
                {checkpoint.type === 'trafficSignal' && (
                  <div className="text-2xl">🚦</div>
                )}
                {checkpoint.type === 'blindTurn' && (
                  <div className="text-2xl">⚠️</div>
                )}
                {checkpoint.type === 'destination' && (
                  <div className="text-2xl">🏁</div>
                )}
                {checkpoint.completed && (
                  <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Render obstacles */}
          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="absolute"
              style={{
                left: obstacle.x,
                top: obstacle.y,
                width: obstacle.width,
                height: obstacle.height,
                transform: obstacle.direction === 'left' ? 'scaleX(-1)' : 'none'
              }}
            >
              {obstacle.type === 'car' && (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 rounded-lg">
                  🚗
                </div>
              )}
              
              {obstacle.type === 'pedestrian' && (
                <div className="w-full h-full flex items-center justify-center">
                  🚶
                </div>
              )}
              
              {obstacle.type === 'trafficLight' && (
                <div className="w-full h-full bg-gray-800 rounded-lg flex flex-col items-center justify-center p-1">
                  <div className={`w-4 h-4 rounded-full mb-1 ${obstacle.state === 'red' ? 'bg-red-500' : 'bg-red-900'}`}></div>
                  <div className={`w-4 h-4 rounded-full mb-1 ${obstacle.state === 'yellow' ? 'bg-yellow-500' : 'bg-yellow-900'}`}></div>
                  <div className={`w-4 h-4 rounded-full ${obstacle.state === 'green' ? 'bg-green-500' : 'bg-green-900'}`}></div>
                </div>
              )}
              
              {obstacle.type === 'crosswalk' && (
                <div className="w-full h-full bg-white/50 flex items-center justify-center">
                  <div className="w-full h-full bg-white/50 flex flex-col">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-1 bg-white/80 m-1"></div>
                    ))}
                  </div>
                </div>
              )}
              
              {obstacle.type === 'hazard' && (
                <div className="w-full h-full flex items-center justify-center bg-yellow-500 rounded-lg">
                  ⚠️
                </div>
              )}
            </div>
          ))}
          
          {/* Render player */}
          <div
            className="absolute transition-all duration-100"
            style={{
              left: player.x,
              top: player.y,
              width: player.width,
              height: player.height,
              transform: `rotate(${
                player.direction === 'right' ? 0 :
                player.direction === 'down' ? 90 :
                player.direction === 'left' ? 180 :
                player.direction === 'up' ? 270 : 0
              }deg)`
            }}
          >
            <div className={`w-full h-full flex items-center justify-center rounded-lg ${
              player.type === 'pedestrian' ? 'bg-blue-500' :
              player.type === 'cyclist' ? 'bg-green-500' : 'bg-purple-500'
            }`}>
              {player.type === 'pedestrian' && '🚶'}
              {player.type === 'cyclist' && '🚴'}
              {player.type === 'driver' && '🚗'}
            </div>
          </div>
          
          {/* Mobile controls */}
          {isMobile && (
            <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2">
              <div className="col-start-2">
                <button
                  onTouchStart={() => handleTouchStart('up')}
                  onTouchEnd={() => handleTouchEnd('up')}
                  className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
                >
                  <ArrowUp className="h-6 w-6 text-gray-700" />
                </button>
              </div>
              <div className="col-start-1">
                <button
                  onTouchStart={() => handleTouchStart('left')}
                  onTouchEnd={() => handleTouchEnd('left')}
                  className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
              </div>
              <div className="col-start-2">
                <button
                  onTouchStart={() => handleTouchStart('down')}
                  onTouchEnd={() => handleTouchEnd('down')}
                  className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
                >
                  <ArrowDown className="h-6 w-6 text-gray-700" />
                </button>
              </div>
              <div className="col-start-3">
                <button
                  onTouchStart={() => handleTouchStart('right')}
                  onTouchEnd={() => handleTouchEnd('right')}
                  className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg active:bg-gray-200"
                >
                  <ArrowRight className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>
          )}
          
          {/* Success/Fail Messages */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                {successMessage}
              </motion.div>
            )}
            
            {showFailMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                {failMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Challenge Modal */}
          <AnimatePresence>
            {currentChallenge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Safety Challenge</h3>
                  </div>
                  
                  <p className="text-gray-800 mb-6">{currentChallenge.question}</p>
                  
                  <div className="space-y-3 mb-6">
                    {currentChallenge.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !showChallengeResult && handleChallengeAnswer(index)}
                        disabled={showChallengeResult}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          showChallengeResult
                            ? index === currentChallenge.correctAnswer
                              ? 'border-green-500 bg-green-50 text-green-900'
                              : selectedAnswer === index
                              ? 'border-red-500 bg-red-50 text-red-900'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                            : selectedAnswer === index
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            showChallengeResult
                              ? index === currentChallenge.correctAnswer
                                ? 'border-green-500 bg-green-500'
                                : selectedAnswer === index
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300'
                              : selectedAnswer === index
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {showChallengeResult && index === currentChallenge.correctAnswer && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                            {showChallengeResult && selectedAnswer === index && index !== currentChallenge.correctAnswer && (
                              <XCircle className="h-4 w-4 text-white" />
                            )}
                            {!showChallengeResult && selectedAnswer === index && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {showChallengeResult && (
                    <div className={`p-4 rounded-xl ${
                      selectedAnswer === currentChallenge.correctAnswer
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {selectedAnswer === currentChallenge.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        )}
                        <div>
                          <div className={`font-medium mb-1 ${
                            selectedAnswer === currentChallenge.correctAnswer ? 'text-green-800' : 'text-blue-800'
                          }`}>
                            {selectedAnswer === currentChallenge.correctAnswer ? 'Correct!' : 'Important Safety Information:'}
                          </div>
                          <div className={`text-sm ${
                            selectedAnswer === currentChallenge.correctAnswer ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {currentChallenge.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pause Overlay */}
          {gameState.isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
              <div className="bg-white rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Game Paused</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={togglePause}
                    className="px-6 py-2 text-white rounded-xl"
                    style={{ background: theme.primaryColor }}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl"
                  >
                    Settings
                  </button>
                </div>
                
                {showSettings && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Sound</span>
                      <button
                        onClick={toggleMute}
                        className="p-2 bg-gray-100 rounded-lg"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                    </div>
                    <button
                      onClick={restartGame}
                      className="w-full mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg"
                    >
                      Restart Game
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Game Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-900">Quest Instructions:</h3>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-blue-800 text-sm">
            Navigate through the city, reach all checkpoints, and complete safety challenges. Follow traffic rules and avoid hazards to earn points.
          </p>
          <div className="mt-2 text-xs text-blue-700">
            {isMobile 
              ? "Use the on-screen controls to navigate. Tap the buttons to move your character."
              : "Use arrow keys or WASD to move. Follow traffic rules to earn points and avoid penalties."}
          </div>
        </div>
      </div>
    );
  };
  
  return renderGameUI();
};

export default RoadSafetyQuest;