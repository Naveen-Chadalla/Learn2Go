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
  User,
  Bike,
  Car,
  CheckCircle,
  XCircle,
  MapPin,
  Flag,
  Award,
  Zap,
  Shield,
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
  type: 'pedestrian' | 'cyclist' | 'driver';
  isMoving: boolean;
  lives: number;
  score: number;
  safetyGear: boolean;
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crosswalk' | 'traffic_light' | 'blind_turn' | 'parking' | 'intersection';
  completed: boolean;
  question?: SafetyQuestion;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'pedestrian' | 'cyclist' | 'pothole' | 'construction';
  direction?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
  active: boolean;
}

interface SafetyQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  principle: 'awareness' | 'responsibility' | 'respect' | 'preparation';
}

interface SafetyTip {
  text: string;
  principle: 'awareness' | 'responsibility' | 'respect' | 'preparation';
  icon: React.ReactNode;
}

interface GameState {
  phase: 'character_select' | 'instructions' | 'playing' | 'checkpoint' | 'game_over' | 'victory';
  level: number;
  timeLeft: number;
  isPaused: boolean;
  currentCheckpoint: number;
  showTip: boolean;
  currentTip: SafetyTip | null;
  violations: number;
  safeActions: number;
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
    phase: 'character_select',
    level: 1,
    timeLeft: 300,
    isPaused: false,
    currentCheckpoint: 0,
    showTip: false,
    currentTip: null,
    violations: 0,
    safeActions: 0
  });
  
  // Player state
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    direction: 'right',
    type: 'pedestrian',
    isMoving: false,
    lives: 3,
    score: 0,
    safetyGear: false
  });
  
  // Game entities
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  
  // UI state
  const [showHelp, setShowHelp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyStates, setKeyStates] = useState<{[key: string]: boolean}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  
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
  
  // Initialize game data
  useEffect(() => {
    initializeSafetyTips();
    initializeCheckpoints();
  }, []);
  
  // Initialize safety tips
  const initializeSafetyTips = () => {
    const tips: SafetyTip[] = [
      {
        text: "Always look both ways before crossing the street, even at crosswalks with signals.",
        principle: "awareness",
        icon: <Eye className="h-6 w-6 text-blue-500" />
      },
      {
        text: "Wear appropriate safety gear - helmets for cyclists, seatbelts for drivers.",
        principle: "preparation",
        icon: <Shield className="h-6 w-6 text-green-500" />
      },
      {
        text: "Yield to pedestrians at crosswalks - it's not just polite, it's the law.",
        principle: "respect",
        icon: <Heart className="h-6 w-6 text-red-500" />
      },
      {
        text: "Never use your phone while driving, cycling, or crossing the street.",
        principle: "responsibility",
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />
      },
      {
        text: "Maintain your vehicle regularly to prevent breakdowns and accidents.",
        principle: "preparation",
        icon: <Settings className="h-6 w-6 text-green-500" />
      },
      {
        text: "Signal your intentions when driving or cycling to help others anticipate your moves.",
        principle: "respect",
        icon: <Heart className="h-6 w-6 text-red-500" />
      },
      {
        text: "Stay visible - wear bright colors when walking or cycling, especially at night.",
        principle: "awareness",
        icon: <Eye className="h-6 w-6 text-blue-500" />
      },
      {
        text: "Follow traffic signals and signs - they're designed to keep everyone safe.",
        principle: "responsibility",
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />
      }
    ];
    
    setSafetyTips(tips);
  };
  
  // Initialize checkpoints with safety questions
  const initializeCheckpoints = () => {
    const checkpointData: Checkpoint[] = [
      {
        id: 'crosswalk',
        x: 200,
        y: 150,
        width: 100,
        height: 60,
        type: 'crosswalk',
        completed: false,
        question: {
          text: "You're approaching a crosswalk and the pedestrian signal is flashing. What should you do?",
          options: [
            "Run across quickly before the light changes",
            "Wait for the next full walk signal",
            "Cross if there are no cars coming",
            "Follow the crowd regardless of the signal"
          ],
          correctIndex: 1,
          explanation: "When a pedestrian signal is flashing, it means 'don't start crossing'. Wait for the next full walk signal to ensure you have enough time to cross safely.",
          principle: "responsibility"
        }
      },
      {
        id: 'traffic_light',
        x: 400,
        y: 250,
        width: 80,
        height: 80,
        type: 'traffic_light',
        completed: false,
        question: {
          text: "You're cycling and approaching a yellow traffic light. What's the safest action?",
          options: [
            "Speed up to get through before it turns red",
            "Stop if it's safe to do so",
            "Ignore it since you're on a bike",
            "Swerve around any cars that are stopping"
          ],
          correctIndex: 1,
          explanation: "Yellow means prepare to stop. Cyclists must follow the same traffic signals as vehicles. Stop if it's safe to do so, otherwise complete your crossing.",
          principle: "responsibility"
        }
      },
      {
        id: 'blind_turn',
        x: 600,
        y: 150,
        width: 80,
        height: 80,
        type: 'blind_turn',
        completed: false,
        question: {
          text: "You're driving and approaching a blind curve. What should you do?",
          options: [
            "Maintain your current speed",
            "Move to the center of the road for a better view",
            "Slow down and stay in your lane",
            "Honk your horn continuously while turning"
          ],
          correctIndex: 2,
          explanation: "When approaching a blind curve, slow down and stay in your lane. This gives you more time to react to unexpected hazards and reduces the risk of a collision.",
          principle: "awareness"
        }
      },
      {
        id: 'intersection',
        x: 300,
        y: 400,
        width: 100,
        height: 100,
        type: 'intersection',
        completed: false,
        question: {
          text: "You arrive at a four-way stop at the same time as another vehicle to your right. Who goes first?",
          options: [
            "You go first because you're ready",
            "The vehicle on the right goes first",
            "Whoever is driving faster",
            "The larger vehicle has right of way"
          ],
          correctIndex: 1,
          explanation: "At a four-way stop, when two vehicles arrive at the same time, the vehicle on the right has the right of way. This is a standard rule that helps prevent confusion and accidents.",
          principle: "respect"
        }
      },
      {
        id: 'parking',
        x: 500,
        y: 350,
        width: 120,
        height: 60,
        type: 'parking',
        completed: false,
        question: {
          text: "Before starting your car after it's been parked, what should you check?",
          options: [
            "Just your mirrors",
            "Your social media notifications",
            "All mirrors, blind spots, and that your path is clear",
            "That your radio is set to your favorite station"
          ],
          correctIndex: 2,
          explanation: "Before moving your vehicle, check all mirrors, blind spots, and ensure your path is clear. This preparation helps prevent accidents with pedestrians, cyclists, or other vehicles that might be passing by.",
          principle: "preparation"
        }
      }
    ];
    
    setCheckpoints(checkpointData);
  };
  
  // Initialize obstacles
  const initializeObstacles = () => {
    const obstacleData: Obstacle[] = [
      {
        id: 'car1',
        x: 300,
        y: 200,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'right',
        speed: 2,
        active: true
      },
      {
        id: 'pedestrian1',
        x: 250,
        y: 150,
        width: 20,
        height: 30,
        type: 'pedestrian',
        direction: 'down',
        speed: 1,
        active: true
      },
      {
        id: 'cyclist1',
        x: 400,
        y: 300,
        width: 30,
        height: 20,
        type: 'cyclist',
        direction: 'left',
        speed: 3,
        active: true
      },
      {
        id: 'pothole1',
        x: 350,
        y: 250,
        width: 30,
        height: 30,
        type: 'pothole',
        active: true
      },
      {
        id: 'construction1',
        x: 500,
        y: 200,
        width: 80,
        height: 40,
        type: 'construction',
        active: true
      }
    ];
    
    setObstacles(obstacleData);
  };
  
  // Start game
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      timeLeft: 300,
      isPaused: false
    }));
    
    initializeObstacles();
    startGameLoop();
  };
  
  // Start game loop
  const startGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    const gameLoop = () => {
      updateGameState();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Update game state
  const updateGameState = () => {
    if (gameState.isPaused || gameState.phase !== 'playing') return;
    
    // Update player position
    updatePlayerPosition();
    
    // Update obstacles
    updateObstacles();
    
    // Check for collisions
    checkCollisions();
    
    // Check for checkpoint interactions
    checkCheckpoints();
    
    // Update timer
    updateTimer();
  };
  
  // Update player position based on keyboard/touch input
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
        newY = Math.min(canvasRef.current?.clientHeight || 500 - prev.height, prev.y + prev.speed);
        newDirection = 'down';
        isMoving = true;
      }
      if (keyStates['ArrowLeft'] || keyStates['a']) {
        newX = Math.max(0, prev.x - prev.speed);
        newDirection = 'left';
        isMoving = true;
      }
      if (keyStates['ArrowRight'] || keyStates['d']) {
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
        if (!obstacle.active || !obstacle.direction || !obstacle.speed) {
          return obstacle;
        }
        
        let newX = obstacle.x;
        let newY = obstacle.y;
        
        switch (obstacle.direction) {
          case 'up':
            newY -= obstacle.speed;
            if (newY < -obstacle.height) {
              newY = canvasRef.current?.clientHeight || 500;
            }
            break;
          case 'down':
            newY += obstacle.speed;
            if (newY > (canvasRef.current?.clientHeight || 500)) {
              newY = -obstacle.height;
            }
            break;
          case 'left':
            newX -= obstacle.speed;
            if (newX < -obstacle.width) {
              newX = canvasRef.current?.clientWidth || 800;
            }
            break;
          case 'right':
            newX += obstacle.speed;
            if (newX > (canvasRef.current?.clientWidth || 800)) {
              newX = -obstacle.width;
            }
            break;
        }
        
        return { ...obstacle, x: newX, y: newY };
      });
    });
  };
  
  // Check for collisions with obstacles
  const checkCollisions = () => {
    obstacles.forEach(obstacle => {
      if (!obstacle.active) return;
      
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        // Collision detected
        handleCollision(obstacle);
      }
    });
  };
  
  // Handle collision with obstacle
  const handleCollision = (obstacle: Obstacle) => {
    // Only handle collision if player is moving
    if (!player.isMoving) return;
    
    // Reduce lives
    setPlayer(prev => ({
      ...prev,
      lives: prev.lives - 1,
      x: 100, // Reset position
      y: 300
    }));
    
    // Show safety tip
    showRandomSafetyTip();
    
    // Increment violations
    setGameState(prev => ({
      ...prev,
      violations: prev.violations + 1
    }));
    
    // Check if game over
    if (player.lives <= 1) {
      setGameState(prev => ({
        ...prev,
        phase: 'game_over'
      }));
    }
  };
  
  // Check for checkpoint interactions
  const checkCheckpoints = () => {
    const currentCheckpoint = checkpoints[gameState.currentCheckpoint];
    
    if (
      currentCheckpoint &&
      !currentCheckpoint.completed &&
      player.x < currentCheckpoint.x + currentCheckpoint.width &&
      player.x + player.width > currentCheckpoint.x &&
      player.y < currentCheckpoint.y + currentCheckpoint.height &&
      player.y + player.height > currentCheckpoint.y
    ) {
      // Checkpoint reached
      setGameState(prev => ({
        ...prev,
        phase: 'checkpoint',
        isPaused: true
      }));
    }
  };
  
  // Update timer
  const updateTimer = () => {
    setGameState(prev => {
      if (prev.timeLeft <= 0) {
        return {
          ...prev,
          phase: 'game_over'
        };
      }
      
      return {
        ...prev,
        timeLeft: prev.timeLeft - 0.016 // Approximately 60fps
      };
    });
  };
  
  // Show random safety tip
  const showRandomSafetyTip = () => {
    const randomTip = safetyTips[Math.floor(Math.random() * safetyTips.length)];
    
    setGameState(prev => ({
      ...prev,
      showTip: true,
      currentTip: randomTip
    }));
    
    // Hide tip after 3 seconds
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        showTip: false,
        currentTip: null
      }));
    }, 3000);
  };
  
  // Handle checkpoint question answer
  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };
  
  // Submit answer for checkpoint question
  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentCheckpoint = checkpoints[gameState.currentCheckpoint];
    const isCorrect = selectedAnswer === currentCheckpoint.question?.correctIndex;
    
    setFeedbackCorrect(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      // Increment score
      setPlayer(prev => ({
        ...prev,
        score: prev.score + 100
      }));
      
      // Increment safe actions
      setGameState(prev => ({
        ...prev,
        safeActions: prev.safeActions + 1
      }));
    } else {
      // Decrement score
      setPlayer(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 50)
      }));
      
      // Increment violations
      setGameState(prev => ({
        ...prev,
        violations: prev.violations + 1
      }));
    }
    
    // Show feedback for 3 seconds
    setTimeout(() => {
      setShowFeedback(false);
      
      // Mark checkpoint as completed
      setCheckpoints(prev => 
        prev.map((cp, idx) => 
          idx === gameState.currentCheckpoint ? { ...cp, completed: true } : cp
        )
      );
      
      // Move to next checkpoint or victory
      if (gameState.currentCheckpoint < checkpoints.length - 1) {
        setGameState(prev => ({
          ...prev,
          currentCheckpoint: prev.currentCheckpoint + 1,
          phase: 'playing',
          isPaused: false
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          phase: 'victory'
        }));
      }
      
      setSelectedAnswer(null);
    }, 3000);
  };
  
  // Handle character selection
  const selectCharacter = (type: 'pedestrian' | 'cyclist' | 'driver') => {
    setPlayer(prev => ({
      ...prev,
      type,
      safetyGear: false,
      speed: type === 'pedestrian' ? 4 : type === 'cyclist' ? 6 : 5
    }));
    
    setGameState(prev => ({
      ...prev,
      phase: 'instructions'
    }));
  };
  
  // Toggle safety gear
  const toggleSafetyGear = () => {
    setPlayer(prev => ({
      ...prev,
      safetyGear: !prev.safetyGear,
      score: !prev.safetyGear ? prev.score + 50 : prev.score - 50
    }));
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.phase !== 'playing') return;
      
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
  }, [gameState.phase]);
  
  // Game timer
  useEffect(() => {
    if (gameState.phase !== 'playing' || gameState.isPaused) return;
    
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(timer);
          return { ...prev, phase: 'game_over' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState.phase, gameState.isPaused]);
  
  // Clean up game loop on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);
  
  // Handle touch controls for mobile
  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`arrow${direction}`]: true }));
  };
  
  const handleTouchEnd = (direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyStates(prev => ({ ...prev, [`arrow${direction}`]: false }));
  };
  
  // Restart game
  const restartGame = () => {
    setGameState({
      phase: 'character_select',
      level: 1,
      timeLeft: 300,
      isPaused: false,
      currentCheckpoint: 0,
      showTip: false,
      currentTip: null,
      violations: 0,
      safeActions: 0
    });
    
    setPlayer({
      x: 100,
      y: 300,
      width: 40,
      height: 40,
      speed: 5,
      direction: 'right',
      type: 'pedestrian',
      isMoving: false,
      lives: 3,
      score: 0,
      safetyGear: false
    });
    
    setCheckpoints(prev => 
      prev.map(cp => ({ ...cp, completed: false }))
    );
    
    setSelectedAnswer(null);
    setShowFeedback(false);
  };
  
  // Complete game and return to lesson
  const completeGame = () => {
    // Calculate final score percentage
    const maxPossibleScore = checkpoints.length * 100 + 50; // 100 per checkpoint + 50 for safety gear
    const percentage = Math.min(100, Math.round((player.score / maxPossibleScore) * 100));
    
    // Pass score back to parent component
    onComplete(percentage);
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get character icon
  const getCharacterIcon = (type: 'pedestrian' | 'cyclist' | 'driver') => {
    switch (type) {
      case 'pedestrian':
        return <User className="h-6 w-6" />;
      case 'cyclist':
        return <Bike className="h-6 w-6" />;
      case 'driver':
        return <Car className="h-6 w-6" />;
    }
  };
  
  // Get checkpoint icon
  const getCheckpointIcon = (type: string) => {
    switch (type) {
      case 'crosswalk':
        return '🚶';
      case 'traffic_light':
        return '🚦';
      case 'blind_turn':
        return '↩️';
      case 'intersection':
        return '➕';
      case 'parking':
        return '🅿️';
      default:
        return '📍';
    }
  };
  
  // Get obstacle icon
  const getObstacleIcon = (type: string) => {
    switch (type) {
      case 'car':
        return '🚗';
      case 'pedestrian':
        return '🚶';
      case 'cyclist':
        return '🚴';
      case 'pothole':
        return '🕳️';
      case 'construction':
        return '🚧';
      default:
        return '⚠️';
    }
  };
  
  // Get principle color
  const getPrincipleColor = (principle: string) => {
    switch (principle) {
      case 'awareness':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'responsibility':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'respect':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'preparation':
        return 'text-green-600 bg-green-100 border-green-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };
  
  // Render character selection screen
  const renderCharacterSelection = () => {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🛣️
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Road Safety Quest</h2>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Choose your character to begin your journey through the city. Each character faces unique challenges!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.button
            onClick={() => selectCharacter('pedestrian')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 hover:bg-blue-100 transition-colors"
          >
            <div className="text-5xl mb-4">🚶</div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">Pedestrian</h3>
            <p className="text-blue-600 text-sm">
              Navigate the city on foot. Focus on crosswalks, traffic signals, and staying visible.
            </p>
            <div className="mt-4 text-xs text-blue-500 bg-blue-50 p-2 rounded-lg">
              <strong>Speed:</strong> Slow • <strong>Challenges:</strong> Crossing roads, visibility
            </div>
          </motion.button>
          
          <motion.button
            onClick={() => selectCharacter('cyclist')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 hover:bg-green-100 transition-colors"
          >
            <div className="text-5xl mb-4">🚴</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Cyclist</h3>
            <p className="text-green-600 text-sm">
              Ride through the city on your bike. Balance speed with safety and follow cycling rules.
            </p>
            <div className="mt-4 text-xs text-green-500 bg-green-50 p-2 rounded-lg">
              <strong>Speed:</strong> Fast • <strong>Challenges:</strong> Traffic rules, safety gear
            </div>
          </motion.button>
          
          <motion.button
            onClick={() => selectCharacter('driver')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 hover:bg-orange-100 transition-colors"
          >
            <div className="text-5xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-orange-800 mb-2">Driver</h3>
            <p className="text-orange-600 text-sm">
              Drive a car through city streets. Focus on traffic laws, parking, and vehicle safety.
            </p>
            <div className="mt-4 text-xs text-orange-500 bg-orange-50 p-2 rounded-lg">
              <strong>Speed:</strong> Medium • <strong>Challenges:</strong> Traffic laws, parking
            </div>
          </motion.button>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 max-w-2xl mx-auto">
          <p>
            <strong>Game Objective:</strong> Navigate safely from home to your destination by following road safety principles: 
            awareness, responsibility, respect, and preparation.
          </p>
        </div>
      </div>
    );
  };
  
  // Render instructions screen
  const renderInstructions = () => {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          {player.type === 'pedestrian' ? '🚶' : player.type === 'cyclist' ? '🚴' : '🚗'}
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Play</h2>
        
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Game Instructions</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-left">
              <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Your Mission
              </h4>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li>• Navigate through the city safely</li>
                <li>• Visit all 5 checkpoints in order</li>
                <li>• Answer safety questions correctly</li>
                <li>• Avoid collisions with obstacles</li>
                <li>• Reach your destination before time runs out</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 text-left">
              <h4 className="font-bold text-green-800 mb-2 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Scoring System
              </h4>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• +100 points for each correct answer</li>
                <li>• +50 points for using safety gear</li>
                <li>• -50 points for incorrect answers</li>
                <li>• -1 life for collisions with obstacles</li>
                <li>• Game ends when you run out of lives or time</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4 text-left mb-6">
            <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Controls
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="text-yellow-700">
                <p className="font-medium mb-1">Keyboard:</p>
                <ul className="space-y-1">
                  <li>• ↑ or W: Move up</li>
                  <li>• ↓ or S: Move down</li>
                  <li>• ← or A: Move left</li>
                  <li>• → or D: Move right</li>
                  <li>• Space: Interact / Answer</li>
                </ul>
              </div>
              <div className="text-yellow-700">
                <p className="font-medium mb-1">Mobile:</p>
                <ul className="space-y-1">
                  <li>• On-screen arrow buttons to move</li>
                  <li>• Tap checkpoints to interact</li>
                  <li>• Tap options to select answers</li>
                </ul>
              </div>
            </div>
          </div>
          
          {player.type !== 'pedestrian' && (
            <div className="flex items-center justify-between bg-red-50 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-600 mr-2" />
                <div className="text-left">
                  <h4 className="font-bold text-red-800">Safety Gear</h4>
                  <p className="text-sm text-red-700">
                    {player.type === 'cyclist' ? 
                      "Wearing a helmet is essential for cycling safety!" : 
                      "Always wear your seatbelt when driving!"}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={toggleSafetyGear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  player.safetyGear ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {player.safetyGear ? 'Safety Gear On ✓' : 'Wear Safety Gear'}
              </motion.button>
            </div>
          )}
          
          <div className="flex justify-center">
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center space-x-2"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
            >
              <Play className="h-5 w-5" />
              <span>Start Your Journey</span>
            </motion.button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            <strong>Remember:</strong> The goal is to learn and practice road safety principles. 
            Take your time and make safe choices!
          </p>
        </div>
      </div>
    );
  };
  
  // Render game screen
  const renderGameScreen = () => {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Game HUD */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{player.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {'❤️'.repeat(player.lives)}
              </div>
              <div className="text-sm text-gray-600">Lives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {gameState.currentCheckpoint + 1}/{checkpoints.length}
              </div>
              <div className="text-sm text-gray-600">Checkpoint</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className={`text-lg font-bold ${gameState.timeLeft <= 60 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(gameState.timeLeft)}
              </span>
            </div>
            
            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {gameState.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
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
          {/* City background */}
          <div className="absolute inset-0 bg-gray-300">
            {/* Roads */}
            <div className="absolute top-1/3 left-0 right-0 h-20 bg-gray-700"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-20 bg-gray-700"></div>
            <div className="absolute top-2/3 left-0 right-0 h-20 bg-gray-700"></div>
            
            {/* Road markings */}
            <div className="absolute top-1/3 left-0 right-0 h-1 bg-yellow-400 transform translate-y-10"></div>
            <div className="absolute top-2/3 left-0 right-0 h-1 bg-yellow-400 transform translate-y-10"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-yellow-400 transform translate-x-10"></div>
          </div>
          
          {/* Checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.id}
              className={`absolute flex items-center justify-center ${
                checkpoint.completed ? 'opacity-50' : 
                index === gameState.currentCheckpoint ? 'animate-pulse' : 'opacity-70'
              }`}
              style={{
                left: checkpoint.x,
                top: checkpoint.y,
                width: checkpoint.width,
                height: checkpoint.height,
                zIndex: 10
              }}
            >
              <div className={`text-4xl ${
                index === gameState.currentCheckpoint ? 'scale-125' : ''
              }`}>
                {getCheckpointIcon(checkpoint.type)}
              </div>
              {index === gameState.currentCheckpoint && (
                <div className="absolute -bottom-6 text-xs font-bold bg-white px-2 py-1 rounded-lg shadow-md">
                  Checkpoint {index + 1}
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
                zIndex: 20,
                transform: obstacle.direction === 'left' ? 'scaleX(-1)' : 'none'
              }}
            >
              <div className="text-2xl">
                {getObstacleIcon(obstacle.type)}
              </div>
            </div>
          ))}
          
          {/* Player */}
          <div
            className="absolute flex items-center justify-center transition-all duration-100"
            style={{
              left: player.x,
              top: player.y,
              width: player.width,
              height: player.height,
              zIndex: 30,
              transform: `rotate(${
                player.direction === 'right' ? 0 :
                player.direction === 'down' ? 90 :
                player.direction === 'left' ? 180 :
                player.direction === 'up' ? 270 : 0
              }deg)`
            }}
          >
            <div className="relative">
              <div className="text-3xl">
                {player.type === 'pedestrian' ? '🚶' : 
                 player.type === 'cyclist' ? '🚴' : '🚗'}
              </div>
              {player.safetyGear && (
                <div className="absolute -top-2 -right-2 text-sm">
                  {player.type === 'cyclist' ? '⛑️' : '🦺'}
                </div>
              )}
            </div>
          </div>
          
          {/* Safety Tip */}
          <AnimatePresence>
            {gameState.showTip && gameState.currentTip && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-md p-4 rounded-xl shadow-lg border ${
                  getPrincipleColor(gameState.currentTip.principle)
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {gameState.currentTip.icon}
                  </div>
                  <div>
                    <div className="font-bold mb-1">
                      Safety Tip: {gameState.currentTip.principle.charAt(0).toUpperCase() + gameState.currentTip.principle.slice(1)}
                    </div>
                    <p className="text-sm">{gameState.currentTip.text}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mobile Controls */}
          {isMobile && (
            <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2 z-40">
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
          
          {/* Pause Overlay */}
          {gameState.isPaused && gameState.phase === 'playing' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Game Paused</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                    className="px-6 py-2 text-white rounded-xl"
                    style={{ background: theme.primaryColor }}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl"
                  >
                    Help
                  </button>
                </div>
                
                {showHelp && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2">How to Play</h4>
                    <ul className="text-sm text-gray-600 text-left space-y-1">
                      <li>• Use arrow keys or WASD to move</li>
                      <li>• Reach checkpoints to answer safety questions</li>
                      <li>• Avoid obstacles to prevent losing lives</li>
                      <li>• Complete all checkpoints before time runs out</li>
                    </ul>
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
            <h3 className="font-bold text-blue-900">Current Objective:</h3>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-blue-800 text-sm">
            Navigate to the {getCheckpointIcon(checkpoints[gameState.currentCheckpoint]?.type || 'crosswalk')} checkpoint 
            {gameState.currentCheckpoint + 1} to answer a safety question. Avoid obstacles and follow road safety rules!
          </p>
          <div className="mt-2 text-xs text-blue-700">
            {isMobile 
              ? "Use the on-screen controls to navigate. Tap to interact with checkpoints."
              : "Use arrow keys or WASD to move. Approach checkpoints to interact with them."}
          </div>
        </div>
      </div>
    );
  };
  
  // Render checkpoint question
  const renderCheckpointQuestion = () => {
    const currentCheckpoint = checkpoints[gameState.currentCheckpoint];
    const question = currentCheckpoint.question;
    
    if (!question) return null;
    
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">
              {getCheckpointIcon(currentCheckpoint.type)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Safety Checkpoint</h3>
              <p className="text-gray-600">Answer correctly to continue your journey</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl mb-6 ${getPrincipleColor(question.principle)}`}>
            <div className="font-bold mb-2">
              {question.principle.charAt(0).toUpperCase() + question.principle.slice(1)} Principle
            </div>
            <p>{question.text}</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-xl mb-6 ${
                  feedbackCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {feedbackCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <div className={`font-bold ${feedbackCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      {feedbackCorrect ? 'Correct!' : 'Not quite right'}
                    </div>
                    <p className={`text-sm ${feedbackCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={submitAnswer}
            disabled={selectedAnswer === null || showFeedback}
            whileHover={{ scale: selectedAnswer !== null && !showFeedback ? 1.05 : 1 }}
            whileTap={{ scale: selectedAnswer !== null && !showFeedback ? 0.95 : 1 }}
            className="w-full text-white py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            Submit Answer
          </motion.button>
        </div>
      </div>
    );
  };
  
  // Render game over screen
  const renderGameOver = () => {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          😢
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Journey Incomplete</h2>
        <p className="text-gray-600 mb-6 text-lg">
          {player.lives <= 0 
            ? "You've run out of lives! Road safety requires constant vigilance."
            : "You've run out of time! Being punctual is important, but safety comes first."}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{player.score}</div>
            <div className="text-sm text-gray-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{gameState.currentCheckpoint}/{checkpoints.length}</div>
            <div className="text-sm text-gray-600">Checkpoints Reached</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{gameState.violations}</div>
            <div className="text-sm text-gray-600">Safety Violations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{gameState.safeActions}</div>
            <div className="text-sm text-gray-600">Safe Actions</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Safety Lessons:</h3>
          <p className="text-blue-800 text-sm">
            Remember that road safety is about being aware of your surroundings, taking responsibility for your actions, 
            respecting other road users, and being prepared for your journey. Try again and apply these principles!
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={restartGame}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={completeGame}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <Trophy className="h-4 w-4" />
            <span>Continue</span>
          </button>
        </div>
      </div>
    );
  };
  
  // Render victory screen
  const renderVictory = () => {
    // Calculate final score percentage
    const maxPossibleScore = checkpoints.length * 100 + 50; // 100 per checkpoint + 50 for safety gear
    const percentage = Math.min(100, Math.round((player.score / maxPossibleScore) * 100));
    
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🏆
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Journey Complete!</h2>
        <p className="text-gray-600 mb-6 text-lg">
          Congratulations! You've successfully navigated through the city while applying road safety principles.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{player.score}</div>
            <div className="text-sm text-gray-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{formatTime(300 - gameState.timeLeft)}</div>
            <div className="text-sm text-gray-600">Completion Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{gameState.violations}</div>
            <div className="text-sm text-gray-600">Safety Violations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Safety Rating</div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Road Safety Principles Mastered:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="font-bold text-blue-800 flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                Awareness
              </div>
              <p className="text-blue-700">
                Being alert and observant of your surroundings at all times
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <div className="font-bold text-yellow-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Responsibility
              </div>
              <p className="text-yellow-700">
                Taking ownership of your actions and following rules
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <div className="font-bold text-red-800 flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                Respect
              </div>
              <p className="text-red-700">
                Considering and accommodating other road users
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="font-bold text-green-800 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Preparation
              </div>
              <p className="text-green-700">
                Planning ahead and ensuring you're ready for your journey
              </p>
            </div>
          </div>
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
            onClick={completeGame}
            className="flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            <Trophy className="h-4 w-4" />
            <span>Complete Lesson</span>
          </button>
        </div>
      </div>
    );
  };
  
  // Main render function
  const renderContent = () => {
    switch (gameState.phase) {
      case 'character_select':
        return renderCharacterSelection();
      case 'instructions':
        return renderInstructions();
      case 'playing':
        return renderGameScreen();
      case 'checkpoint':
        return renderCheckpointQuestion();
      case 'game_over':
        return renderGameOver();
      case 'victory':
        return renderVictory();
      default:
        return renderCharacterSelection();
    }
  };
  
  return (
    <div className="min-h-[500px]">
      {renderContent()}
    </div>
  );
};

export default RoadSafetyQuest;