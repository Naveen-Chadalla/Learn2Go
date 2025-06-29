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
  Heart
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
  type: 'car' | 'pedestrian' | 'trafficLight' | 'sign' | 'crosswalk' | 'intersection';
  state?: 'red' | 'yellow' | 'green' | 'walk' | 'stop';
  direction?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
  behavior?: 'distracted' | 'normal' | 'reckless';
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crosswalk' | 'trafficSignal' | 'blindTurn' | 'zebraCrossing' | 'parkingZone' | 'destination';
  completed: boolean;
  task?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface GameState {
  score: number;
  level: number;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  safetyViolations: number;
  currentCheckpoint: number;
}

interface SafetyTip {
  id: string;
  text: string;
  category: 'awareness' | 'responsibility' | 'respect' | 'preparation';
  icon: React.ReactNode;
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
    level: 1,
    timeLeft: 120,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    safetyViolations: 0,
    currentCheckpoint: 0
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
  const [showCheckpointTask, setShowCheckpointTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<Checkpoint['task'] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showTaskResult, setShowTaskResult] = useState(false);
  const [isTaskCorrect, setIsTaskCorrect] = useState(false);
  const [playerType, setPlayerType] = useState<'pedestrian' | 'cyclist' | 'driver'>('pedestrian');
  
  // Safety tips
  const safetyTips: SafetyTip[] = [
    {
      id: 'awareness1',
      text: 'Always be alert at intersections - they are high-risk areas for accidents.',
      category: 'awareness',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
    },
    {
      id: 'responsibility1',
      text: 'You are responsible for your safety and the safety of others on the road.',
      category: 'responsibility',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    {
      id: 'respect1',
      text: 'Respect all road users - pedestrians, cyclists, and drivers all have rights.',
      category: 'respect',
      icon: <Heart className="h-5 w-5 text-red-500" />
    },
    {
      id: 'preparation1',
      text: 'Always check your vehicle before driving - brakes, lights, and tires.',
      category: 'preparation',
      icon: <Settings className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'awareness2',
      text: 'Avoid distractions like phones while walking, cycling, or driving.',
      category: 'awareness',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  ];
  
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
  
  // Initialize game based on player type
  useEffect(() => {
    if (!gameStarted) return;
    
    // Clear any existing game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Reset game state
    setGameState({
      score: 0,
      level: 1,
      timeLeft: 120,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyViolations: 0,
      currentCheckpoint: 0
    });
    
    // Initialize player position based on type
    setPlayer({
      x: 50,
      y: 300,
      width: playerType === 'driver' ? 60 : playerType === 'cyclist' ? 50 : 40,
      height: playerType === 'driver' ? 30 : playerType === 'cyclist' ? 40 : 40,
      speed: playerType === 'driver' ? 7 : playerType === 'cyclist' ? 6 : 5,
      direction: 'right',
      isMoving: false,
      type: playerType,
      lives: 3
    });
    
    // Initialize obstacles and checkpoints
    initializeGameEntities();
    
    // Start game loop
    startGameLoop();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, playerType]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isGameOver || showTutorial || showCheckpointTask) return;
      
      setKeyStates(prev => ({ ...prev, [e.key]: true }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeyStates(prev => ({ ...prev, [e.key]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPaused, gameState.isGameOver, showTutorial, showCheckpointTask]);
  
  // Game timer
  useEffect(() => {
    if (!gameStarted || gameState.isPaused || gameState.isGameOver || showTutorial || showCheckpointTask) return;
    
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
  }, [gameStarted, gameState.isPaused, gameState.isGameOver, showTutorial, showCheckpointTask]);
  
  // Initialize game entities
  const initializeGameEntities = () => {
    // Create checkpoints based on level
    const levelCheckpoints: Checkpoint[] = [
      {
        id: 'crosswalk1',
        x: 200,
        y: 300,
        width: 100,
        height: 60,
        type: 'crosswalk',
        completed: false,
        task: {
          question: "What should you do before crossing a road?",
          options: [
            "Run across quickly",
            "Look at your phone while crossing",
            "Look both ways, then cross",
            "Cross without checking for traffic"
          ],
          correctIndex: 2,
          explanation: "Always look both ways before crossing to ensure no vehicles are approaching."
        }
      },
      {
        id: 'trafficSignal1',
        x: 400,
        y: 200,
        width: 80,
        height: 80,
        type: 'trafficSignal',
        completed: false,
        task: {
          question: "What does a red traffic light mean?",
          options: [
            "Slow down",
            "Stop completely",
            "Speed up to get through",
            "Look around and proceed if clear"
          ],
          correctIndex: 1,
          explanation: "A red traffic light means you must stop completely and wait until it turns green."
        }
      },
      {
        id: 'blindTurn1',
        x: 600,
        y: 300,
        width: 80,
        height: 80,
        type: 'blindTurn',
        completed: false,
        task: {
          question: "When approaching a blind turn, you should:",
          options: [
            "Maintain your speed",
            "Slow down and be prepared to stop",
            "Honk continuously",
            "Change lanes quickly"
          ],
          correctIndex: 1,
          explanation: "Always slow down at blind turns as you cannot see oncoming traffic or obstacles."
        }
      },
      {
        id: 'zebraCrossing1',
        x: 800,
        y: 200,
        width: 100,
        height: 60,
        type: 'zebraCrossing',
        completed: false,
        task: {
          question: "At a zebra crossing with pedestrians waiting, you should:",
          options: [
            "Drive through quickly",
            "Stop and let pedestrians cross",
            "Honk to make them wait",
            "Slow down but continue if you're in a hurry"
          ],
          correctIndex: 1,
          explanation: "Always stop at zebra crossings when pedestrians are waiting to cross."
        }
      },
      {
        id: 'parkingZone1',
        x: 1000,
        y: 300,
        width: 80,
        height: 100,
        type: 'parkingZone',
        completed: false,
        task: {
          question: "When parking your vehicle, you should:",
          options: [
            "Park anywhere convenient",
            "Park in designated areas only",
            "Double park if no spaces are available",
            "Park blocking a driveway if it's just for a minute"
          ],
          correctIndex: 1,
          explanation: "Always park in designated areas to ensure safety and avoid obstructing traffic."
        }
      },
      {
        id: 'destination',
        x: 1200,
        y: 250,
        width: 80,
        height: 80,
        type: 'destination',
        completed: false
      }
    ];
    
    // Create obstacles based on player type and level
    const levelObstacles: Obstacle[] = [
      {
        id: 'car1',
        x: 300,
        y: 150,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'left',
        speed: 3,
        behavior: 'normal'
      },
      {
        id: 'car2',
        x: 500,
        y: 350,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'right',
        speed: 2,
        behavior: 'distracted'
      },
      {
        id: 'pedestrian1',
        x: 250,
        y: 250,
        width: 20,
        height: 40,
        type: 'pedestrian',
        direction: 'down',
        speed: 1,
        behavior: 'normal'
      },
      {
        id: 'trafficLight1',
        x: 400,
        y: 150,
        width: 20,
        height: 40,
        type: 'trafficLight',
        state: 'red'
      },
      {
        id: 'sign1',
        x: 600,
        y: 150,
        width: 30,
        height: 30,
        type: 'sign',
        state: 'stop'
      },
      {
        id: 'crosswalk1',
        x: 200,
        y: 280,
        width: 100,
        height: 40,
        type: 'crosswalk'
      },
      {
        id: 'intersection1',
        x: 400,
        y: 200,
        width: 80,
        height: 80,
        type: 'intersection'
      }
    ];
    
    setCheckpoints(levelCheckpoints);
    setObstacles(levelObstacles);
  };
  
  // Start game loop
  const startGameLoop = () => {
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver && !showTutorial && !showCheckpointTask) {
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
    
    // Check level completion
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
      if (keyStates['ArrowUp'] || keyStates['w']) {
        newY = Math.max(0, prev.y - prev.speed);
        newDirection = 'up';
        isMoving = true;
      }
      if (keyStates['ArrowDown'] || keyStates['s']) {
        newY = Math.min(canvasRef.current?.clientHeight || 400 - prev.height, prev.y + prev.speed);
        newDirection = 'down';
        isMoving = true;
      }
      if (keyStates['ArrowLeft'] || keyStates['a']) {
        newX = Math.max(0, prev.x - prev.speed);
        newDirection = 'left';
        isMoving = true;
      }
      if (keyStates['ArrowRight'] || keyStates['d']) {
        newX = Math.min(canvasRef.current?.clientWidth || 1200 - prev.width, prev.x + prev.speed);
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
              if (newX < -obstacle.width) newX = canvasRef.current?.clientWidth || 1200;
              break;
            case 'right':
              newX += obstacle.speed;
              if (newX > (canvasRef.current?.clientWidth || 1200)) newX = -obstacle.width;
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
    // Only handle collisions with cars and other moving obstacles
    if (obstacle.type === 'car' && obstacle.behavior === 'distracted') {
      // Collision with distracted driver - lose a life
      setPlayer(prev => {
        const newLives = prev.lives - 1;
        
        // Show fail message
        setFailMessage('Collision with distracted driver! -1 life');
        setShowFailMessage(true);
        setTimeout(() => setShowFailMessage(false), 1500);
        
        if (newLives <= 0) {
          setGameState(prev => ({ ...prev, isGameOver: true }));
        }
        
        return { ...prev, lives: newLives };
      });
      
      // Reset player position to last checkpoint
      const lastCompletedCheckpoint = checkpoints
        .filter(c => c.completed)
        .sort((a, b) => checkpoints.indexOf(b) - checkpoints.indexOf(a))[0];
      
      if (lastCompletedCheckpoint) {
        setPlayer(prev => ({
          ...prev,
          x: lastCompletedCheckpoint.x,
          y: lastCompletedCheckpoint.y
        }));
      } else {
        // Reset to start position
        setPlayer(prev => ({
          ...prev,
          x: 50,
          y: 300
        }));
      }
      
      // Add safety violation
      setGameState(prev => ({
        ...prev,
        safetyViolations: prev.safetyViolations + 1,
        score: Math.max(0, prev.score - 20)
      }));
    } else if (obstacle.type === 'trafficLight') {
      // Check if player is obeying traffic light
      if (obstacle.state === 'red' && player.isMoving && player.type === 'driver') {
        // Running a red light - lose points
        setGameState(prev => {
          // Show fail message
          setFailMessage('Red light violation! -20 points');
          setShowFailMessage(true);
          setTimeout(() => setShowFailMessage(false), 1500);
          
          return { 
            ...prev, 
            score: Math.max(0, prev.score - 20),
            safetyViolations: prev.safetyViolations + 1
          };
        });
      }
    }
  };
  
  // Check checkpoints
  const checkCheckpoints = () => {
    checkpoints.forEach((checkpoint, index) => {
      if (!checkpoint.completed && 
          player.x < checkpoint.x + checkpoint.width &&
          player.x + player.width > checkpoint.x &&
          player.y < checkpoint.y + checkpoint.height &&
          player.y + player.height > checkpoint.y) {
        
        // Player reached a checkpoint
        if (checkpoint.task) {
          // Show task/question
          setCurrentTask(checkpoint.task);
          setShowCheckpointTask(true);
          setSelectedAnswer(null);
          setShowTaskResult(false);
          setGameState(prev => ({ ...prev, isPaused: true }));
          setGameState(prev => ({ ...prev, currentCheckpoint: index }));
        } else {
          // Mark checkpoint as completed
          setCheckpoints(prev => 
            prev.map((c, i) => 
              i === index ? { ...c, completed: true } : c
            )
          );
          
          // Show success message
          setSuccessMessage('Checkpoint reached! +50 points');
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          // Update score
          setGameState(prev => ({
            ...prev,
            score: prev.score + 50,
            currentCheckpoint: index
          }));
        }
      }
    });
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Check if destination checkpoint is reached
    const destinationCheckpoint = checkpoints.find(c => c.type === 'destination');
    
    if (destinationCheckpoint && 
        player.x < destinationCheckpoint.x + destinationCheckpoint.width &&
        player.x + player.width > destinationCheckpoint.x &&
        player.y < destinationCheckpoint.y + destinationCheckpoint.height &&
        player.y + player.height > destinationCheckpoint.y) {
      
      // Level complete
      setGameState(prev => ({
        ...prev,
        isLevelComplete: true,
        isPaused: true
      }));
      
      // Calculate final score
      const timeBonus = gameState.timeLeft * 2;
      const safetyBonus = Math.max(0, 100 - (gameState.safetyViolations * 20));
      const finalScore = gameState.score + timeBonus + safetyBonus;
      
      // Update score
      setGameState(prev => ({
        ...prev,
        score: finalScore,
        isGameOver: true
      }));
      
      // Show success message
      setSuccessMessage(`Destination reached! Level complete!`);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        // Complete the game
        const percentage = Math.min(100, Math.round((finalScore / 1000) * 100));
        onComplete(percentage);
      }, 2000);
    }
  };
  
  // Handle touch controls for mobile
  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: true }));
  };
  
  const handleTouchEnd = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: false }));
  };
  
  // Handle checkpoint task
  const handleTaskAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };
  
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentTask) return;
    
    const isCorrect = selectedAnswer === currentTask.correctIndex;
    setIsTaskCorrect(isCorrect);
    setShowTaskResult(true);
    
    if (isCorrect) {
      // Award points for correct answer
      setGameState(prev => ({
        ...prev,
        score: prev.score + 30
      }));
    } else {
      // Penalty for wrong answer
      setGameState(prev => ({
        ...prev,
        safetyViolations: prev.safetyViolations + 1,
        score: Math.max(0, prev.score - 10)
      }));
    }
  };
  
  const handleContinueAfterTask = () => {
    // Mark current checkpoint as completed
    setCheckpoints(prev => 
      prev.map((c, i) => 
        i === gameState.currentCheckpoint ? { ...c, completed: true } : c
      )
    );
    
    // Hide task and resume game
    setShowCheckpointTask(false);
    setGameState(prev => ({ ...prev, isPaused: false }));
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
      level: 1,
      timeLeft: 120,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyViolations: 0,
      currentCheckpoint: 0
    });
    
    setShowTutorial(true);
    setGameStarted(false);
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
        content: "Learn road safety principles while having fun. Navigate through the city, complete checkpoints, and follow traffic rules to reach your destination safely!",
        image: "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Choose Your Character",
        content: "Select your role: Pedestrian, Cyclist, or Driver. Each has different challenges and responsibilities on the road.",
        image: null
      },
      {
        title: "Game Controls",
        content: isMobile 
          ? "Use the on-screen arrow buttons to move your character. Tap the buttons to navigate through traffic."
          : "Use the arrow keys or WASD to move your character. Navigate carefully through traffic and follow all rules.",
        image: null
      },
      {
        title: "Road Safety Principles",
        content: "Remember the core principles: Awareness, Responsibility, Respect, and Preparation. These will guide you to make safe choices.",
        image: "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Checkpoints & Challenges",
        content: "At each checkpoint, you'll face a road safety challenge or question. Answer correctly to earn points and advance.",
        image: null
      },
      {
        title: "Ready to Play?",
        content: "Remember: Stay alert, be responsible, show respect to all road users, and always be prepared. Good luck!",
        image: null
      }
    ];
    
    return tutorials[tutorialStep];
  };
  
  // Character selection screen
  const renderCharacterSelection = () => {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Choose Your Character</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setPlayerType('pedestrian')}
            className={`p-4 rounded-xl transition-all ${
              playerType === 'pedestrian' 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="text-4xl mb-2 text-center">🚶</div>
            <div className="text-sm font-medium text-center">Pedestrian</div>
          </button>
          
          <button
            onClick={() => setPlayerType('cyclist')}
            className={`p-4 rounded-xl transition-all ${
              playerType === 'cyclist' 
                ? 'bg-green-100 border-2 border-green-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="text-4xl mb-2 text-center">🚴</div>
            <div className="text-sm font-medium text-center">Cyclist</div>
          </button>
          
          <button
            onClick={() => setPlayerType('driver')}
            className={`p-4 rounded-xl transition-all ${
              playerType === 'driver' 
                ? 'bg-purple-100 border-2 border-purple-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="text-4xl mb-2 text-center">🚗</div>
            <div className="text-sm font-medium text-center">Driver</div>
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Character Details:</h4>
          {playerType === 'pedestrian' && (
            <p className="text-sm text-gray-600">
              As a pedestrian, you'll learn about crossing roads safely, using sidewalks, and being visible to drivers.
            </p>
          )}
          {playerType === 'cyclist' && (
            <p className="text-sm text-gray-600">
              As a cyclist, you'll learn about bike lanes, signaling turns, wearing safety gear, and sharing the road.
            </p>
          )}
          {playerType === 'driver' && (
            <p className="text-sm text-gray-600">
              As a driver, you'll learn about traffic signals, yielding right-of-way, safe following distances, and avoiding distractions.
            </p>
          )}
        </div>
        
        <div className="text-center">
          <button
            onClick={() => setTutorialStep(tutorialStep + 1)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </button>
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
            {tutorialStep === 0 ? '🚦' : 
             tutorialStep === 1 ? '👤' : 
             tutorialStep === 2 ? '🎮' : 
             tutorialStep === 3 ? '🛑' : 
             tutorialStep === 4 ? '🏁' : '🚀'}
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
          
          {tutorialStep !== 1 && (
            <div className="flex justify-center space-x-4">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(prev => prev - 1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
              )}
              
              {tutorialStep < 5 ? (
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
                  <span>Start Game</span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (gameState.isGameOver) {
      const finalScore = gameState.score;
      const maxPossibleScore = 1000; // Adjust based on your scoring system
      const percentage = Math.min(100, Math.round((finalScore / maxPossibleScore) * 100));
      
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
            {gameState.isLevelComplete ? "Journey Complete!" : "Game Over"}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{gameState.score}</div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{checkpoints.filter(c => c.completed).length}</div>
              <div className="text-sm text-gray-600">Checkpoints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{gameState.safetyViolations}</div>
              <div className="text-sm text-gray-600">Violations</div>
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
                ? "Excellent! You've demonstrated outstanding knowledge of road safety principles. Your awareness, responsibility, respect, and preparation would make you a model road user."
                : percentage >= 60 
                ? "Good job! You have a solid understanding of road safety, but there's room for improvement in consistently applying all safety principles."
                : "You've completed the journey, but should review road safety principles more carefully. Remember that awareness, responsibility, respect, and preparation are key to staying safe."}
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
    
    if (showCheckpointTask && currentTask) {
      return (
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-4xl mb-4"
            >
              🚦
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Road Safety Challenge</h3>
            <p className="text-gray-600">Answer correctly to proceed!</p>
          </div>
          
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4">{currentTask.question}</h4>
            
            <div className="space-y-3">
              {currentTask.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleTaskAnswer(index)}
                  disabled={showTaskResult}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    showTaskResult
                      ? index === currentTask.correctIndex
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : index === selectedAnswer
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                      : selectedAnswer === index
                      ? 'bg-blue-50 border-blue-500 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      showTaskResult
                        ? index === currentTask.correctIndex
                          ? 'bg-green-500 text-white'
                          : index === selectedAnswer
                          ? 'bg-red-500 text-white'
                          : 'border-2 border-gray-300'
                        : selectedAnswer === index
                        ? 'bg-blue-500 text-white'
                        : 'border-2 border-gray-300'
                    }`}>
                      {showTaskResult && index === currentTask.correctIndex && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {showTaskResult && index === selectedAnswer && index !== currentTask.correctIndex && (
                        <XCircle className="h-4 w-4" />
                      )}
                      {!showTaskResult && selectedAnswer === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {showTaskResult ? (
            <div className="mb-6">
              <div className={`p-4 rounded-xl ${isTaskCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isTaskCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600" />
                  )}
                  <span className={`font-medium ${isTaskCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                    {isTaskCorrect ? 'Correct! +30 points' : 'Important Safety Information:'}
                  </span>
                </div>
                <p className={`text-sm ${isTaskCorrect ? 'text-green-700' : 'text-blue-700'}`}>
                  {currentTask.explanation}
                </p>
              </div>
              
              <div className="text-center mt-6">
                <button
                  onClick={handleContinueAfterTask}
                  className="px-6 py-3 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                >
                  Continue Journey
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="px-6 py-3 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                Submit Answer
              </button>
            </div>
          )}
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
                {'❤️'.repeat(player.lives)}
              </div>
              <div className="text-sm text-gray-600">Lives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{checkpoints.filter(c => c.completed).length}/{checkpoints.length}</div>
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
        
        {/* Game Canvas */}
        <div 
          ref={canvasRef}
          className="relative bg-gray-200 rounded-3xl overflow-hidden shadow-2xl mb-6" 
          style={{ height: '400px' }}
        >
          {/* Road background */}
          <div className="absolute inset-0 bg-gray-700">
            {/* Horizontal road */}
            <div className="absolute top-1/2 left-0 right-0 h-20 bg-gray-600 transform -translate-y-1/2">
              {/* Road markings */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2 dashed-line"></div>
            </div>
            
            {/* Vertical roads at intersections */}
            {obstacles.filter(o => o.type === 'intersection').map((intersection, index) => (
              <div 
                key={`intersection-${index}`}
                className="absolute bg-gray-600"
                style={{
                  left: intersection.x,
                  top: 0,
                  width: intersection.width,
                  height: '100%'
                }}
              >
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
              </div>
            ))}
            
            {/* Crosswalks */}
            {obstacles.filter(o => o.type === 'crosswalk').map((crosswalk, index) => (
              <div 
                key={`crosswalk-${index}`}
                className="absolute bg-white/70"
                style={{
                  left: crosswalk.x,
                  top: crosswalk.y,
                  width: crosswalk.width,
                  height: crosswalk.height
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-white h-full"
                    style={{
                      left: `${i * 20}%`,
                      width: '10%'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Render obstacles */}
          {obstacles.map((obstacle, index) => (
            <div
              key={`obstacle-${index}`}
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
                <div className={`w-full h-full flex items-center justify-center rounded-lg ${
                  obstacle.behavior === 'distracted' ? 'bg-red-500' : 
                  obstacle.behavior === 'reckless' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
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
              
              {obstacle.type === 'sign' && (
                <div className="w-full h-full flex items-center justify-center bg-red-500 rounded-lg text-white font-bold">
                  {obstacle.state === 'stop' && 'STOP'}
                  {obstacle.state === 'yield' && '⚠️'}
                  {obstacle.state === 'no-entry' && '⛔'}
                </div>
              )}
            </div>
          ))}
          
          {/* Render checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <div
              key={`checkpoint-${index}`}
              className={`absolute border-2 ${
                checkpoint.completed ? 'border-green-500 bg-green-100/30' : 
                checkpoint.type === 'destination' ? 'border-purple-500 bg-purple-100/30 animate-pulse' : 
                'border-yellow-500 bg-yellow-100/30'
              } rounded-lg`}
              style={{
                left: checkpoint.x,
                top: checkpoint.y,
                width: checkpoint.width,
                height: checkpoint.height
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {checkpoint.type === 'crosswalk' && '🚶'}
                {checkpoint.type === 'trafficSignal' && '🚦'}
                {checkpoint.type === 'blindTurn' && '↩️'}
                {checkpoint.type === 'zebraCrossing' && '🦓'}
                {checkpoint.type === 'parkingZone' && '🅿️'}
                {checkpoint.type === 'destination' && '🏁'}
              </div>
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
            <div className="w-full h-full flex items-center justify-center bg-green-500 rounded-lg">
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
          
          {/* Pause Overlay */}
          {gameState.isPaused && !showCheckpointTask && (
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
        
        {/* Safety Tip */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-900">Safety Tip:</h3>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {safetyTips[gameState.level % safetyTips.length].icon}
            <p className="text-blue-800 text-sm">
              {safetyTips[gameState.level % safetyTips.length].text}
            </p>
          </div>
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