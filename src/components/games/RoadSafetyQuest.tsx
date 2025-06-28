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
  Gamepad
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
  type: 'pedestrian' | 'cyclist' | 'driver';
  isMoving: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'pedestrian' | 'cyclist' | 'trafficLight' | 'crosswalk' | 'pothole';
  state?: 'red' | 'yellow' | 'green' | 'walk' | 'stop';
  direction?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
  isDistracted?: boolean;
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crosswalk' | 'trafficSignal' | 'blindTurn' | 'zebraCrossing' | 'parkingZone' | 'finish';
  completed: boolean;
  challenge?: Challenge;
}

interface Challenge {
  type: 'multipleChoice' | 'reaction' | 'decision';
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation: string;
  timeLimit?: number;
}

interface SafetyTip {
  id: string;
  text: string;
  icon: string;
}

interface GameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  violations: number;
  checkpointsCompleted: number;
  currentChallenge: Challenge | null;
  showChallenge: boolean;
  challengeResult: boolean | null;
  safetyTip: SafetyTip | null;
  showSafetyTip: boolean;
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
    timeLeft: 180,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    violations: 0,
    checkpointsCompleted: 0,
    currentChallenge: null,
    showChallenge: false,
    challengeResult: null,
    safetyTip: null,
    showSafetyTip: false
  });
  
  // Game entities
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    direction: 'right',
    type: 'pedestrian',
    isMoving: false
  });
  
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
  const [playerType, setPlayerType] = useState<'pedestrian' | 'cyclist' | 'driver'>('pedestrian');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFailMessage, setShowFailMessage] = useState(false);
  const [failMessage, setFailMessage] = useState('');
  
  // Safety tips
  const safetyTips: SafetyTip[] = [
    { id: 'tip1', text: 'Always look both ways before crossing the street', icon: '👀' },
    { id: 'tip2', text: 'Wear a helmet when cycling', icon: '⛑️' },
    { id: 'tip3', text: 'Never use your phone while driving', icon: '📱' },
    { id: 'tip4', text: 'Obey traffic signals and signs', icon: '🚦' },
    { id: 'tip5', text: 'Use pedestrian crossings whenever available', icon: '🚶' },
    { id: 'tip6', text: 'Be extra cautious at intersections', icon: '🔄' },
    { id: 'tip7', text: 'Always wear a seatbelt when in a vehicle', icon: '🔒' },
    { id: 'tip8', text: 'Check your vehicle before driving', icon: '🔍' },
    { id: 'tip9', text: 'Maintain a safe distance from other vehicles', icon: '↔️' },
    { id: 'tip10', text: 'Reduce speed in bad weather conditions', icon: '🌧️' }
  ];
  
  // Challenges
  const challenges: Challenge[] = [
    {
      type: 'multipleChoice',
      question: 'What should you do at a red traffic light?',
      options: ['Keep driving slowly', 'Stop completely', 'Honk and proceed', 'Look around and proceed if clear'],
      correctAnswer: 1,
      explanation: 'Always stop completely at a red traffic light. This is a fundamental rule that helps prevent accidents at intersections.'
    },
    {
      type: 'multipleChoice',
      question: 'When should you check your vehicle?',
      options: ['Only when it breaks down', 'Once a year', 'Before every journey', 'Only before long trips'],
      correctAnswer: 2,
      explanation: 'You should check your vehicle before every journey. Regular checks help prevent breakdowns and accidents.'
    },
    {
      type: 'multipleChoice',
      question: 'What should pedestrians do before crossing the road?',
      options: ['Run quickly', 'Look at their phone', 'Look left and right', 'Follow others'],
      correctAnswer: 2,
      explanation: 'Pedestrians should always look left and right before crossing to ensure no vehicles are approaching.'
    },
    {
      type: 'multipleChoice',
      question: 'What is the main cause of road accidents?',
      options: ['Bad weather', 'Vehicle malfunction', 'Road conditions', 'Human error'],
      correctAnswer: 3,
      explanation: 'Human error is the leading cause of road accidents. Staying alert and following rules can prevent most accidents.'
    },
    {
      type: 'multipleChoice',
      question: 'What should cyclists always wear?',
      options: ['Headphones', 'Helmet', 'Sunglasses', 'Gloves'],
      correctAnswer: 1,
      explanation: 'Cyclists should always wear a helmet to protect their head in case of accidents.'
    },
    {
      type: 'decision',
      question: 'You see a ball roll into the street. What should you do?',
      options: ['Continue driving normally', 'Slow down and be prepared to stop', 'Honk loudly', 'Swerve around the ball'],
      correctAnswer: 1,
      explanation: 'Slow down and be prepared to stop. A child might follow the ball into the street.'
    },
    {
      type: 'decision',
      question: 'You\'re approaching a yellow traffic light. What should you do?',
      options: ['Speed up to get through', 'Continue at the same speed', 'Prepare to stop if safe to do so', 'Brake suddenly'],
      correctAnswer: 2,
      explanation: 'Prepare to stop if it's safe to do so. Yellow lights indicate the signal will soon turn red.'
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
      lives: 3,
      level: 1,
      timeLeft: 180,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      violations: 0,
      checkpointsCompleted: 0,
      currentChallenge: null,
      showChallenge: false,
      challengeResult: null,
      safetyTip: null,
      showSafetyTip: false
    });
    
    // Initialize player position based on type
    setPlayer({
      x: 50,
      y: 300,
      width: playerType === 'driver' ? 60 : playerType === 'cyclist' ? 50 : 40,
      height: playerType === 'driver' ? 30 : playerType === 'cyclist' ? 40 : 40,
      speed: playerType === 'driver' ? 7 : playerType === 'cyclist' ? 6 : 5,
      direction: 'right',
      type: playerType,
      isMoving: false
    });
    
    // Initialize obstacles and checkpoints
    initializeGameEntities();
    
    // Start game loop
    startGameLoop();
    
    // Show initial safety tip
    showRandomSafetyTip();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, playerType]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isGameOver || showTutorial || gameState.showChallenge) return;
      
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
  }, [gameState.isPaused, gameState.isGameOver, showTutorial, gameState.showChallenge]);
  
  // Game timer
  useEffect(() => {
    if (!gameStarted || gameState.isPaused || gameState.isGameOver || showTutorial || gameState.showChallenge) return;
    
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
  }, [gameStarted, gameState.isPaused, gameState.isGameOver, showTutorial, gameState.showChallenge]);
  
  // Initialize game entities
  const initializeGameEntities = () => {
    // Create checkpoints based on level
    const newCheckpoints: Checkpoint[] = [
      {
        id: 'checkpoint1',
        x: 200,
        y: 150,
        width: 100,
        height: 60,
        type: 'crosswalk',
        completed: false,
        challenge: challenges[0]
      },
      {
        id: 'checkpoint2',
        x: 400,
        y: 250,
        width: 100,
        height: 60,
        type: 'trafficSignal',
        completed: false,
        challenge: challenges[1]
      },
      {
        id: 'checkpoint3',
        x: 600,
        y: 150,
        width: 100,
        height: 60,
        type: 'blindTurn',
        completed: false,
        challenge: challenges[2]
      },
      {
        id: 'checkpoint4',
        x: 800,
        y: 250,
        width: 100,
        height: 60,
        type: 'zebraCrossing',
        completed: false,
        challenge: challenges[3]
      },
      {
        id: 'checkpoint5',
        x: 1000,
        y: 150,
        width: 100,
        height: 60,
        type: 'parkingZone',
        completed: false,
        challenge: challenges[4]
      },
      {
        id: 'finish',
        x: 1200,
        y: 200,
        width: 100,
        height: 100,
        type: 'finish',
        completed: false
      }
    ];
    
    // Create obstacles based on player type and level
    const newObstacles: Obstacle[] = [
      {
        id: 'trafficLight1',
        x: 200,
        y: 100,
        width: 30,
        height: 60,
        type: 'trafficLight',
        state: 'red'
      },
      {
        id: 'car1',
        x: 300,
        y: 100,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'down',
        speed: 2,
        isDistracted: true
      },
      {
        id: 'crosswalk1',
        x: 200,
        y: 200,
        width: 100,
        height: 40,
        type: 'crosswalk'
      },
      {
        id: 'pedestrian1',
        x: 350,
        y: 150,
        width: 20,
        height: 40,
        type: 'pedestrian',
        direction: 'left',
        speed: 1
      },
      {
        id: 'cyclist1',
        x: 500,
        y: 200,
        width: 40,
        height: 20,
        type: 'cyclist',
        direction: 'right',
        speed: 3
      },
      {
        id: 'pothole1',
        x: 650,
        y: 250,
        width: 30,
        height: 30,
        type: 'pothole'
      }
    ];
    
    setCheckpoints(newCheckpoints);
    setObstacles(newObstacles);
  };
  
  // Start game loop
  const startGameLoop = () => {
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver && !showTutorial && !gameState.showChallenge) {
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
        newX = Math.min(canvasRef.current?.clientWidth || 1300 - prev.width, prev.x + prev.speed);
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
              if (newX < -obstacle.width) newX = canvasRef.current?.clientWidth || 1300;
              break;
            case 'right':
              newX += obstacle.speed;
              if (newX > (canvasRef.current?.clientWidth || 1300)) newX = -obstacle.width;
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
    if (obstacle.type === 'car' && obstacle.isDistracted) {
      // Collision with distracted driver - lose a life
      setGameState(prev => {
        const newLives = prev.lives - 1;
        
        // Show fail message
        setFailMessage('Collision with distracted driver! -1 life');
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
        x: Math.max(0, prev.x - 100),
        y: prev.y
      }));
    } else if (obstacle.type === 'pothole' && player.type !== 'pedestrian') {
      // Collision with pothole - slow down
      setPlayer(prev => ({
        ...prev,
        speed: Math.max(prev.speed - 1, 2)
      }));
      
      // Show fail message
      setFailMessage('Hit a pothole! Speed reduced');
      setShowFailMessage(true);
      setTimeout(() => setShowFailMessage(false), 1500);
      
      // Restore speed after 3 seconds
      setTimeout(() => {
        setPlayer(prev => ({
          ...prev,
          speed: playerType === 'driver' ? 7 : playerType === 'cyclist' ? 6 : 5
        }));
      }, 3000);
    } else if (obstacle.type === 'trafficLight') {
      // Check if player is obeying traffic light
      if (obstacle.state === 'red' && player.isMoving) {
        // Running a red light - lose points
        setGameState(prev => {
          // Show fail message
          setFailMessage('Red light violation! -20 points');
          setShowFailMessage(true);
          setTimeout(() => setShowFailMessage(false), 1500);
          
          return { ...prev, score: Math.max(0, prev.score - 20), violations: prev.violations + 1 };
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
        
        // Check if player has reached this checkpoint
        if (
          player.x < checkpoint.x + checkpoint.width &&
          player.x + player.width > checkpoint.x &&
          player.y < checkpoint.y + checkpoint.height &&
          player.y + player.height > checkpoint.y
        ) {
          checkpointCompleted = true;
          
          // If it's the finish checkpoint
          if (checkpoint.type === 'finish') {
            setGameState(prev => ({ ...prev, isLevelComplete: true }));
            
            // Show success message
            setSuccessMessage('Level Complete! +100 bonus points!');
            setShowSuccessMessage(true);
            
            setTimeout(() => {
              const finalScore = prev.score + 100 - (prev.violations * 10);
              const maxPossibleScore = 500;
              const percentage = Math.min(100, Math.round((finalScore / maxPossibleScore) * 100));
              onComplete(percentage);
            }, 2000);
            
            return { ...checkpoint, completed: true };
          }
          
          // Trigger challenge for this checkpoint
          if (checkpoint.challenge) {
            setGameState(prev => ({
              ...prev, 
              currentChallenge: checkpoint.challenge || null,
              showChallenge: true
            }));
          }
          
          // Show success message
          setSuccessMessage('Checkpoint reached! +20 points');
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          // Update score
          setGameState(prev => ({
            ...prev, 
            score: prev.score + 20,
            checkpointsCompleted: prev.checkpointsCompleted + 1
          }));
          
          return { ...checkpoint, completed: true };
        }
        
        return checkpoint;
      });
      
      // Show a safety tip after completing a checkpoint
      if (checkpointCompleted) {
        showRandomSafetyTip();
      }
      
      return updatedCheckpoints;
    });
  };
  
  // Show random safety tip
  const showRandomSafetyTip = () => {
    const randomTip = safetyTips[Math.floor(Math.random() * safetyTips.length)];
    setGameState(prev => ({ ...prev, safetyTip: randomTip, showSafetyTip: true }));
    
    // Hide tip after 4 seconds
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showSafetyTip: false }));
    }, 4000);
  };
  
  // Handle challenge answer
  const handleChallengeAnswer = (answerIndex: number) => {
    if (!gameState.currentChallenge) return;
    
    const isCorrect = answerIndex === gameState.currentChallenge.correctAnswer;
    
    setGameState(prev => ({
      ...prev,
      challengeResult: isCorrect,
      score: isCorrect ? prev.score + 30 : Math.max(0, prev.score - 10),
      violations: isCorrect ? prev.violations : prev.violations + 1
    }));
    
    // Show result for 2 seconds, then continue game
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showChallenge: false,
        currentChallenge: null,
        challengeResult: null
      }));
    }, 2000);
  };
  
  // Handle touch controls for mobile
  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: true }));
  };
  
  const handleTouchEnd = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: false }));
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
      timeLeft: 180,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      violations: 0,
      checkpointsCompleted: 0,
      currentChallenge: null,
      showChallenge: false,
      challengeResult: null,
      safetyTip: null,
      showSafetyTip: false
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
        content: "Select your role: pedestrian, cyclist, or driver. Each has different challenges and responsibilities on the road.",
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
        title: "Traffic Rules",
        content: "Stop at red lights, yield to pedestrians, avoid obstacles, and complete safety challenges at each checkpoint.",
        image: "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Ready to Play?",
        content: "Remember, safety first! Your goal is to navigate safely while following all traffic rules. Good luck!",
        image: null
      }
    ];
    
    return tutorials[tutorialStep];
  };
  
  // Get checkpoint icon
  const getCheckpointIcon = (type: string) => {
    switch (type) {
      case 'crosswalk': return '🚶';
      case 'trafficSignal': return '🚦';
      case 'blindTurn': return '↩️';
      case 'zebraCrossing': return '🦓';
      case 'parkingZone': return '🅿️';
      case 'finish': return '🏁';
      default: return '🚩';
    }
  };
  
  // Get player icon
  const getPlayerIcon = (type: string) => {
    switch (type) {
      case 'pedestrian': return '🚶';
      case 'cyclist': return '🚴';
      case 'driver': return '🚗';
      default: return '🚶';
    }
  };
  
  // Get obstacle icon
  const getObstacleIcon = (type: string, state?: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'pedestrian': return '🚶';
      case 'cyclist': return '🚴';
      case 'trafficLight': 
        if (state === 'red') return '🔴';
        if (state === 'yellow') return '🟡';
        if (state === 'green') return '🟢';
        return '🚦';
      case 'crosswalk': return '⬜';
      case 'pothole': return '🕳️';
      default: return '⚠️';
    }
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
            🚦
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
          
          {tutorialStep === 1 && (
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
              {[
                { type: 'pedestrian', name: 'Pedestrian', icon: '🚶' },
                { type: 'cyclist', name: 'Cyclist', icon: '🚴' },
                { type: 'driver', name: 'Driver', icon: '🚗' }
              ].map((character) => (
                <motion.button
                  key={character.type}
                  onClick={() => setPlayerType(character.type as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    playerType === character.type 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-3xl mb-2">{character.icon}</div>
                  <div className="font-medium">{character.name}</div>
                </motion.button>
              ))}
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
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
                <span>Start Game</span>
              </motion.button>
            )}
          </div>
        </div>
      );
    }
    
    if (gameState.isGameOver || gameState.isLevelComplete) {
      const finalScore = gameState.score - (gameState.violations * 10);
      const maxPossibleScore = 500;
      const percentage = Math.min(100, Math.max(0, Math.round((finalScore / maxPossibleScore) * 100)));
      
      return (
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl mb-6"
          >
            {gameState.isLevelComplete ? '🏆' : '🚧'}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {gameState.isLevelComplete ? 'Journey Complete!' : 'Journey Ended'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{gameState.score}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{gameState.checkpointsCompleted}</div>
              <div className="text-sm text-gray-600">Checkpoints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{gameState.violations}</div>
              <div className="text-sm text-gray-600">Violations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
              <div className="text-sm text-gray-600">Safety Score</div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Road Safety Assessment:</h3>
            <p className="text-blue-800 text-sm">
              {percentage >= 80 
                ? "Excellent! You've demonstrated outstanding knowledge of road safety principles. Your careful navigation and rule-following would make you a model road user."
                : percentage >= 60 
                ? "Good job! You have a solid understanding of road safety, but there's room for improvement in following all rules consistently."
                : "You've completed the journey, but should review road safety rules more carefully. Remember that following rules keeps everyone safe on the road."}
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
            
            {/* Vertical roads at checkpoints */}
            {checkpoints.filter(c => c.type !== 'finish').map((checkpoint, index) => (
              <div 
                key={checkpoint.id}
                className="absolute top-0 bottom-0 w-20 bg-gray-600"
                style={{ left: checkpoint.x + checkpoint.width/2 - 10 }}
              >
                {/* Road markings */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
              </div>
            ))}
          </div>
          
          {/* Checkpoints */}
          {checkpoints.map(checkpoint => (
            <div
              key={checkpoint.id}
              className={`absolute transition-all duration-300 ${
                checkpoint.completed ? 'bg-green-200 border-green-500' : 'bg-yellow-200 border-yellow-500'
              } border-2 rounded-lg flex items-center justify-center`}
              style={{
                left: checkpoint.x,
                top: checkpoint.y,
                width: checkpoint.width,
                height: checkpoint.height
              }}
            >
              <div className="text-2xl">{getCheckpointIcon(checkpoint.type)}</div>
              {checkpoint.completed && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}
            </div>
          ))}
          
          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="absolute flex items-center justify-center"
              style={{
                left: obstacle.x,
                top: obstacle.y,
                width: obstacle.width,
                height: obstacle.height,
                transform: obstacle.direction === 'left' ? 'scaleX(-1)' : 'none'
              }}
            >
              <div className={`text-2xl ${obstacle.isDistracted ? 'animate-pulse' : ''}`}>
                {getObstacleIcon(obstacle.type, obstacle.state)}
              </div>
              {obstacle.isDistracted && (
                <div className="absolute -top-4 -right-4 text-lg">
                  📱
                </div>
              )}
            </div>
          ))}
          
          {/* Player */}
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
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-2xl">{getPlayerIcon(player.type)}</div>
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
          
          {/* Safety Tip */}
          <AnimatePresence>
            {gameState.showSafetyTip && gameState.safetyTip && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{gameState.safetyTip.icon}</span>
                  <span>{gameState.safetyTip.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
          
          {/* Challenge Overlay */}
          <AnimatePresence>
            {gameState.showChallenge && gameState.currentChallenge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
                >
                  {gameState.challengeResult === null ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Safety Challenge</h3>
                      <p className="text-gray-700 mb-6">{gameState.currentChallenge.question}</p>
                      
                      <div className="space-y-3">
                        {gameState.currentChallenge.options?.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleChallengeAnswer(index)}
                            className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 mb-4">
                        {gameState.challengeResult ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        <h3 className="text-xl font-bold text-gray-900">
                          {gameState.challengeResult ? 'Correct!' : 'Incorrect'}
                        </h3>
                      </div>
                      
                      <p className="text-gray-700 mb-4">
                        {gameState.currentChallenge.explanation}
                      </p>
                      
                      <p className="text-sm font-medium text-gray-600">
                        {gameState.challengeResult ? '+30 points' : '-10 points'}
                      </p>
                    </>
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
            <h3 className="font-bold text-blue-900">Game Instructions:</h3>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-blue-800 text-sm">
            Navigate through the city, reach checkpoints, and complete safety challenges. Follow traffic rules and avoid violations to earn a high score!
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