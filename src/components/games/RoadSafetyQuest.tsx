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
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Flag,
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
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'start' | 'crosswalk' | 'traffic_light' | 'yield' | 'stop' | 'finish';
  completed: boolean;
  message: string;
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

interface SafetyTip {
  id: string;
  text: string;
  icon: React.ReactNode;
}

interface GameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  safetyTipsCollected: string[];
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
    timeLeft: 30,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    checkpointsCompleted: 0,
    totalCheckpoints: 5,
    safetyTipsCollected: []
  });
  
  // Game entities
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    direction: 'right',
    isMoving: false
  });
  
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  
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
  const [currentTip, setCurrentTip] = useState<SafetyTip | null>(null);
  const [showTip, setShowTip] = useState(false);
  
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
  
  // Initialize safety tips
  useEffect(() => {
    initializeSafetyTips();
  }, []);
  
  const initializeSafetyTips = () => {
    const tips: SafetyTip[] = [
      {
        id: 'awareness',
        text: 'Always be aware of your surroundings when crossing the road.',
        icon: <Eye className="h-6 w-6 text-blue-500" />
      },
      {
        id: 'signals',
        text: 'Obey traffic signals and wait for the green light before crossing.',
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />
      },
      {
        id: 'look',
        text: 'Look both ways before crossing any street.',
        icon: <ArrowLeft className="h-6 w-6 text-green-500" />
      },
      {
        id: 'crosswalk',
        text: 'Always use crosswalks when available.',
        icon: <MapPin className="h-6 w-6 text-red-500" />
      },
      {
        id: 'distraction',
        text: 'Avoid distractions like phones while walking near roads.',
        icon: <XCircle className="h-6 w-6 text-red-500" />
      }
    ];
    
    setSafetyTips(tips);
  };
  
  // Initialize game based on level
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
      timeLeft: 30,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      checkpointsCompleted: 0,
      totalCheckpoints: 5,
      safetyTipsCollected: []
    });
    
    // Initialize player position
    setPlayer({
      x: 50,
      y: 300,
      width: 40,
      height: 40,
      speed: 5,
      direction: 'right',
      isMoving: false
    });
    
    // Initialize checkpoints
    const initialCheckpoints: Checkpoint[] = [
      {
        id: 'start',
        x: 50,
        y: 300,
        width: 60,
        height: 60,
        type: 'start',
        completed: true,
        message: 'Start your journey safely!'
      },
      {
        id: 'crosswalk',
        x: 200,
        y: 150,
        width: 80,
        height: 60,
        type: 'crosswalk',
        completed: false,
        message: 'Use the crosswalk to cross safely!'
      },
      {
        id: 'traffic_light',
        x: 400,
        y: 250,
        width: 60,
        height: 80,
        type: 'traffic_light',
        completed: false,
        message: 'Wait for the green light!'
      },
      {
        id: 'yield',
        x: 600,
        y: 150,
        width: 60,
        height: 60,
        type: 'yield',
        completed: false,
        message: 'Yield to oncoming traffic!'
      },
      {
        id: 'stop',
        x: 800,
        y: 250,
        width: 60,
        height: 60,
        type: 'stop',
        completed: false,
        message: 'Stop completely before proceeding!'
      },
      {
        id: 'finish',
        x: 950,
        y: 300,
        width: 60,
        height: 60,
        type: 'finish',
        completed: false,
        message: 'Congratulations! You\'ve reached your destination safely!'
      }
    ];
    
    setCheckpoints(initialCheckpoints);
    
    // Initialize obstacles
    const initialObstacles: Obstacle[] = [
      {
        id: 'car1',
        x: 300,
        y: 200,
        width: 80,
        height: 40,
        type: 'car',
        direction: 'left',
        speed: 3,
        active: true
      },
      {
        id: 'car2',
        x: 500,
        y: 350,
        width: 80,
        height: 40,
        type: 'car',
        direction: 'right',
        speed: 2,
        active: true
      },
      {
        id: 'pedestrian1',
        x: 250,
        y: 100,
        width: 30,
        height: 30,
        type: 'pedestrian',
        direction: 'down',
        speed: 1,
        active: true
      },
      {
        id: 'cyclist1',
        x: 700,
        y: 200,
        width: 40,
        height: 30,
        type: 'cyclist',
        direction: 'up',
        speed: 2,
        active: true
      },
      {
        id: 'pothole',
        x: 350,
        y: 300,
        width: 30,
        height: 30,
        type: 'pothole',
        active: true
      },
      {
        id: 'construction',
        x: 650,
        y: 250,
        width: 100,
        height: 40,
        type: 'construction',
        active: true
      }
    ];
    
    setObstacles(initialObstacles);
    
    // Start game loop
    startGameLoop();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isGameOver || showTutorial) return;
      
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
  }, [gameState.isPaused, gameState.isGameOver, showTutorial]);
  
  // Game timer
  useEffect(() => {
    if (!gameStarted || gameState.isPaused || gameState.isGameOver || showTutorial) return;
    
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
  }, [gameStarted, gameState.isPaused, gameState.isGameOver, showTutorial]);
  
  // Start game loop
  const startGameLoop = () => {
    const gameLoop = () => {
      if (!gameState.isPaused && !gameState.isGameOver && !showTutorial) {
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
        newX = Math.min(canvasRef.current?.clientWidth || 1000 - prev.width, prev.x + prev.speed);
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
            if (newY < -obstacle.height) newY = canvasRef.current?.clientHeight || 400;
            break;
          case 'down':
            newY += obstacle.speed;
            if (newY > (canvasRef.current?.clientHeight || 400)) newY = -obstacle.height;
            break;
          case 'left':
            newX -= obstacle.speed;
            if (newX < -obstacle.width) newX = canvasRef.current?.clientWidth || 1000;
            break;
          case 'right':
            newX += obstacle.speed;
            if (newX > (canvasRef.current?.clientWidth || 1000)) newX = -obstacle.width;
            break;
        }
        
        return { ...obstacle, x: newX, y: newY };
      });
    });
  };
  
  // Check collisions
  const checkCollisions = () => {
    // Check collisions with obstacles
    obstacles.forEach(obstacle => {
      if (
        obstacle.active &&
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
    if (obstacle.type === 'car' || obstacle.type === 'cyclist') {
      // Collision with car or cyclist - lose a life
      setGameState(prev => {
        const newLives = prev.lives - 1;
        
        // Show fail message
        setFailMessage('Collision! -1 life');
        setShowFailMessage(true);
        setTimeout(() => setShowFailMessage(false), 1500);
        
        if (newLives <= 0) {
          return { ...prev, lives: 0, isGameOver: true };
        }
        
        return { ...prev, lives: newLives };
      });
      
      // Reset player position to last checkpoint
      const lastCompletedCheckpoint = [...checkpoints]
        .filter(c => c.completed)
        .sort((a, b) => checkpoints.indexOf(b) - checkpoints.indexOf(a))[0];
      
      if (lastCompletedCheckpoint) {
        setPlayer(prev => ({
          ...prev,
          x: lastCompletedCheckpoint.x,
          y: lastCompletedCheckpoint.y
        }));
      }
    } else if (obstacle.type === 'pothole') {
      // Slow down player
      setPlayer(prev => ({
        ...prev,
        speed: Math.max(2, prev.speed - 1)
      }));
      
      // Show message
      setFailMessage('Pothole! Speed reduced');
      setShowFailMessage(true);
      setTimeout(() => {
        setShowFailMessage(false);
        setPlayer(prev => ({
          ...prev,
          speed: 5 // Reset speed after a delay
        }));
      }, 3000);
    }
    
    // Deactivate obstacle temporarily
    setObstacles(prev => 
      prev.map(o => 
        o.id === obstacle.id ? { ...o, active: false } : o
      )
    );
    
    // Reactivate obstacle after a delay
    setTimeout(() => {
      setObstacles(prev => 
        prev.map(o => 
          o.id === obstacle.id ? { ...o, active: true } : o
        )
      );
    }, 2000);
  };
  
  // Check checkpoints
  const checkCheckpoints = () => {
    checkpoints.forEach((checkpoint, index) => {
      if (
        !checkpoint.completed &&
        player.x < checkpoint.x + checkpoint.width &&
        player.x + player.width > checkpoint.x &&
        player.y < checkpoint.y + checkpoint.height &&
        player.y + player.height > checkpoint.y
      ) {
        // Check if this is the next checkpoint in sequence
        const prevCheckpointCompleted = index === 0 || checkpoints[index - 1].completed;
        
        if (prevCheckpointCompleted) {
          // Complete checkpoint
          setCheckpoints(prev => 
            prev.map((c, i) => 
              i === index ? { ...c, completed: true } : c
            )
          );
          
          // Update game state
          setGameState(prev => ({
            ...prev,
            checkpointsCompleted: prev.checkpointsCompleted + 1,
            score: prev.score + 20
          }));
          
          // Show success message
          setSuccessMessage(`Checkpoint reached! +20 points`);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          // Show safety tip
          if (safetyTips.length > 0) {
            const randomTip = safetyTips[Math.floor(Math.random() * safetyTips.length)];
            setCurrentTip(randomTip);
            setShowTip(true);
            setTimeout(() => setShowTip(false), 4000);
            
            // Add to collected tips if not already collected
            if (!gameState.safetyTipsCollected.includes(randomTip.id)) {
              setGameState(prev => ({
                ...prev,
                safetyTipsCollected: [...prev.safetyTipsCollected, randomTip.id],
                score: prev.score + 10
              }));
            }
          }
        }
      }
    });
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    const finishCheckpoint = checkpoints.find(c => c.type === 'finish');
    
    if (finishCheckpoint?.completed) {
      setGameState(prev => ({
        ...prev,
        isLevelComplete: true
      }));
      
      // Calculate final score
      const timeBonus = gameState.timeLeft * 2;
      const livesBonus = gameState.lives * 50;
      const tipsBonus = gameState.safetyTipsCollected.length * 15;
      const totalScore = gameState.score + timeBonus + livesBonus + tipsBonus;
      
      // Show success message
      setSuccessMessage(`Level Complete! +${timeBonus + livesBonus + tipsBonus} bonus points!`);
      setShowSuccessMessage(true);
      
      // Complete the game after a delay
      setTimeout(() => {
        const finalScore = Math.min(100, Math.round((totalScore / 500) * 100));
        onComplete(finalScore);
      }, 3000);
    }
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
      timeLeft: 30,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      checkpointsCompleted: 0,
      totalCheckpoints: 5,
      safetyTipsCollected: []
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
        content: "Learn road safety principles while navigating through a virtual city. Complete checkpoints, avoid hazards, and collect safety tips to succeed!",
        image: null
      },
      {
        title: "Game Controls",
        content: isMobile 
          ? "Use the on-screen arrow buttons to move your character. Navigate carefully through traffic and follow all safety rules."
          : "Use the arrow keys or WASD to move your character. Navigate carefully through traffic and follow all safety rules.",
        image: null
      },
      {
        title: "Safety First!",
        content: "Stop at red lights, use crosswalks, yield to traffic, and watch out for hazards. Breaking safety rules will cost you lives!",
        image: null
      },
      {
        title: "Checkpoints & Tips",
        content: "Complete checkpoints in order and collect safety tips for bonus points. Reach the finish line with the highest score possible!",
        image: null
      },
      {
        title: "Ready to Play?",
        content: "Remember, safety first! Your goal is to navigate through the city while following all traffic rules. Good luck!",
        image: null
      }
    ];
    
    return tutorials[tutorialStep];
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
            🛣️
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {tutorial.title}
          </h2>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {tutorial.content}
          </p>
          
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
                <span>Start Quest</span>
              </motion.button>
            )}
          </div>
        </div>
      );
    }
    
    if (gameState.isGameOver) {
      const finalScore = gameState.score;
      const maxPossibleScore = 500; // Adjust based on your scoring system
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
            {gameState.lives <= 0 ? 'Game Over!' : 'Quest Complete!'}
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
              <div className="text-2xl font-bold text-purple-600 mb-1">{gameState.lives}</div>
              <div className="text-sm text-gray-600">Lives Remaining</div>
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
              <div className="text-2xl font-bold text-blue-600">{gameState.checkpointsCompleted}/{gameState.totalCheckpoints}</div>
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
            {/* Horizontal roads */}
            <div className="absolute top-1/4 left-0 right-0 h-20 bg-gray-600"></div>
            <div className="absolute top-3/4 left-0 right-0 h-20 bg-gray-600"></div>
            
            {/* Vertical roads */}
            <div className="absolute left-1/4 top-0 bottom-0 w-20 bg-gray-600"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-20 bg-gray-600"></div>
            
            {/* Road markings */}
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-yellow-400 transform translate-y-10"></div>
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-yellow-400 transform translate-y-10"></div>
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-yellow-400 transform translate-x-10"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-yellow-400 transform translate-x-10"></div>
            
            {/* Crosswalks */}
            <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/30 flex flex-col justify-center">
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white"></div>
            </div>
            <div className="absolute top-3/4 left-3/4 w-20 h-20 bg-white/30 flex flex-col justify-center">
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white mb-1"></div>
              <div className="h-2 bg-white"></div>
            </div>
          </div>
          
          {/* Render checkpoints */}
          {checkpoints.map(checkpoint => (
            <div
              key={checkpoint.id}
              className="absolute"
              style={{
                left: checkpoint.x,
                top: checkpoint.y,
                width: checkpoint.width,
                height: checkpoint.height
              }}
            >
              {checkpoint.type === 'start' && (
                <div className="w-full h-full flex items-center justify-center bg-green-500 rounded-full animate-pulse">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
              )}
              
              {checkpoint.type === 'crosswalk' && (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 rounded-lg">
                  <div className="text-white text-2xl">🚶</div>
                </div>
              )}
              
              {checkpoint.type === 'traffic_light' && (
                <div className="w-full h-full flex items-center justify-center bg-yellow-500 rounded-lg">
                  <div className="text-white text-2xl">🚦</div>
                </div>
              )}
              
              {checkpoint.type === 'yield' && (
                <div className="w-full h-full flex items-center justify-center bg-orange-500 rounded-full">
                  <div className="text-white text-2xl">⚠️</div>
                </div>
              )}
              
              {checkpoint.type === 'stop' && (
                <div className="w-full h-full flex items-center justify-center bg-red-500 rounded-lg">
                  <div className="text-white text-2xl">🛑</div>
                </div>
              )}
              
              {checkpoint.type === 'finish' && (
                <div className="w-full h-full flex items-center justify-center bg-purple-500 rounded-full animate-pulse">
                  <Flag className="h-8 w-8 text-white" />
                </div>
              )}
              
              {checkpoint.completed && (
                <div className="absolute -top-4 -right-4 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Render obstacles */}
          {obstacles.map(obstacle => (
            obstacle.active && (
              <div
                key={obstacle.id}
                className="absolute transition-all duration-100"
                style={{
                  left: obstacle.x,
                  top: obstacle.y,
                  width: obstacle.width,
                  height: obstacle.height,
                  transform: obstacle.direction === 'left' ? 'scaleX(-1)' : 'none'
                }}
              >
                {obstacle.type === 'car' && (
                  <div className="w-full h-full flex items-center justify-center bg-red-500 rounded-lg">
                    <div className="text-white text-2xl">🚗</div>
                  </div>
                )}
                
                {obstacle.type === 'pedestrian' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-2xl">🚶</div>
                  </div>
                )}
                
                {obstacle.type === 'cyclist' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-2xl">🚴</div>
                  </div>
                )}
                
                {obstacle.type === 'pothole' && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-full">
                    <div className="text-white text-xl">⚫</div>
                  </div>
                )}
                
                {obstacle.type === 'construction' && (
                  <div className="w-full h-full flex items-center justify-center bg-orange-500 rounded-lg">
                    <div className="text-white text-2xl">🚧</div>
                  </div>
                )}
              </div>
            )
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
              <div className="text-white text-2xl">🚶</div>
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
          
          {/* Safety Tip Popup */}
          <AnimatePresence>
            {showTip && currentTip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl border-2 border-blue-300 max-w-xs"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <h3 className="font-bold text-blue-900">Safety Tip</h3>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {currentTip.icon}
                  </div>
                  <p className="text-gray-700">{currentTip.text}</p>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-sm text-blue-500 font-medium">+10 points</span>
                </div>
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
            Navigate through the city by visiting checkpoints in order. Follow all traffic rules: use crosswalks, obey traffic lights, yield when required, and stop at stop signs. Avoid collisions with vehicles, cyclists, and hazards!
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