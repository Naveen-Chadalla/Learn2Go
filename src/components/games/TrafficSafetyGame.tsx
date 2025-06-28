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
  Settings
} from 'lucide-react';

interface TrafficSafetyGameProps {
  topic: string;
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

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'pedestrian' | 'trafficLight' | 'sign' | 'roadwork';
  state?: 'red' | 'yellow' | 'green' | 'walk' | 'stop';
  direction?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'point' | 'bonus' | 'life';
  value: number;
  collected: boolean;
}

interface GameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
}

const TrafficSafetyGame: React.FC<TrafficSafetyGameProps> = ({ 
  topic, 
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
    timeLeft: 120,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false
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
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  
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
  
  // Initialize game based on topic
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
      timeLeft: 120,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false
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
    
    // Initialize obstacles and collectibles based on topic
    initializeGameEntities(topic.toLowerCase());
    
    // Start game loop
    startGameLoop();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, topic]);
  
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
  
  // Initialize game entities based on topic
  const initializeGameEntities = (topic: string) => {
    let newObstacles: Obstacle[] = [];
    let newCollectibles: Collectible[] = [];
    
    // Common collectibles
    for (let i = 0; i < 10; i++) {
      newCollectibles.push({
        id: `collectible-${i}`,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 300,
        width: 20,
        height: 20,
        type: 'point',
        value: 10,
        collected: false
      });
    }
    
    // Topic-specific obstacles
    if (topic.includes('traffic signal') || topic.includes('light')) {
      // Traffic lights scenario
      newObstacles = [
        {
          id: 'traffic-light-1',
          x: 300,
          y: 150,
          width: 30,
          height: 60,
          type: 'trafficLight',
          state: 'red'
        },
        {
          id: 'traffic-light-2',
          x: 500,
          y: 250,
          width: 30,
          height: 60,
          type: 'trafficLight',
          state: 'green'
        },
        {
          id: 'car-1',
          x: 200,
          y: 150,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'right',
          speed: 2
        },
        {
          id: 'car-2',
          x: 600,
          y: 250,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'left',
          speed: 2
        }
      ];
    } else if (topic.includes('pedestrian') || topic.includes('crosswalk')) {
      // Pedestrian crossing scenario
      newObstacles = [
        {
          id: 'crosswalk-1',
          x: 300,
          y: 200,
          width: 200,
          height: 60,
          type: 'sign',
          state: 'walk'
        },
        {
          id: 'pedestrian-1',
          x: 250,
          y: 150,
          width: 20,
          height: 40,
          type: 'pedestrian',
          direction: 'right',
          speed: 1
        },
        {
          id: 'pedestrian-2',
          x: 350,
          y: 300,
          width: 20,
          height: 40,
          type: 'pedestrian',
          direction: 'left',
          speed: 1
        },
        {
          id: 'car-1',
          x: 100,
          y: 200,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'right',
          speed: 3
        }
      ];
    } else if (topic.includes('speed') || topic.includes('limit')) {
      // Speed limit scenario
      newObstacles = [
        {
          id: 'speed-sign-1',
          x: 200,
          y: 100,
          width: 40,
          height: 40,
          type: 'sign',
          state: '30'
        },
        {
          id: 'speed-sign-2',
          x: 500,
          y: 100,
          width: 40,
          height: 40,
          type: 'sign',
          state: '50'
        },
        {
          id: 'car-1',
          x: 300,
          y: 150,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'right',
          speed: 4
        },
        {
          id: 'car-2',
          x: 400,
          y: 250,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'left',
          speed: 6
        }
      ];
    } else if (topic.includes('road sign') || topic.includes('sign')) {
      // Road signs scenario
      newObstacles = [
        {
          id: 'stop-sign',
          x: 200,
          y: 150,
          width: 40,
          height: 40,
          type: 'sign',
          state: 'stop'
        },
        {
          id: 'yield-sign',
          x: 400,
          y: 250,
          width: 40,
          height: 40,
          type: 'sign',
          state: 'yield'
        },
        {
          id: 'no-entry-sign',
          x: 600,
          y: 150,
          width: 40,
          height: 40,
          type: 'sign',
          state: 'no-entry'
        },
        {
          id: 'car-1',
          x: 100,
          y: 200,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'right',
          speed: 3
        }
      ];
    } else {
      // Default mixed scenario
      newObstacles = [
        {
          id: 'traffic-light-1',
          x: 300,
          y: 150,
          width: 30,
          height: 60,
          type: 'trafficLight',
          state: 'red'
        },
        {
          id: 'pedestrian-1',
          x: 400,
          y: 200,
          width: 20,
          height: 40,
          type: 'pedestrian',
          direction: 'right',
          speed: 1
        },
        {
          id: 'car-1',
          x: 200,
          y: 250,
          width: 60,
          height: 30,
          type: 'car',
          direction: 'right',
          speed: 2
        },
        {
          id: 'roadwork-1',
          x: 500,
          y: 300,
          width: 40,
          height: 40,
          type: 'roadwork'
        }
      ];
    }
    
    setObstacles(newObstacles);
    setCollectibles(newCollectibles);
  };
  
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
    
    // Check collisions with collectibles
    setCollectibles(prev => {
      let scoreIncrease = 0;
      
      const updated = prev.map(collectible => {
        if (
          !collectible.collected &&
          player.x < collectible.x + collectible.width &&
          player.x + player.width > collectible.x &&
          player.y < collectible.y + collectible.height &&
          player.y + player.height > collectible.y
        ) {
          // Collect the item
          scoreIncrease += collectible.value;
          
          // Show success message
          setSuccessMessage(`+${collectible.value} points!`);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          return { ...collectible, collected: true };
        }
        return collectible;
      });
      
      // Update score
      if (scoreIncrease > 0) {
        setGameState(prev => ({
          ...prev,
          score: prev.score + scoreIncrease
        }));
      }
      
      return updated;
    });
  };
  
  // Handle collision with obstacle
  const handleObstacleCollision = (obstacle: Obstacle) => {
    if (obstacle.type === 'car') {
      // Collision with car - lose a life
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
          
          return { ...prev, score: Math.max(0, prev.score - 20) };
        });
      } else if (obstacle.state === 'green' && !player.isMoving) {
        // Stopped at green light - small penalty
        setGameState(prev => {
          // Show fail message
          setFailMessage('Impeding traffic! -5 points');
          setShowFailMessage(true);
          setTimeout(() => setShowFailMessage(false), 1500);
          
          return { ...prev, score: Math.max(0, prev.score - 5) };
        });
      }
    }
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Check if all collectibles are collected
    const allCollected = collectibles.every(c => c.collected);
    
    if (allCollected) {
      setGameState(prev => {
        // Level complete bonus
        const levelBonus = prev.level * 50;
        const timeBonus = prev.timeLeft * 2;
        const totalBonus = levelBonus + timeBonus;
        
        // Show success message
        setSuccessMessage(`Level Complete! +${totalBonus} bonus points!`);
        setShowSuccessMessage(true);
        
        if (prev.level >= 3) {
          // Game complete
          setTimeout(() => {
            const finalScore = prev.score + totalBonus;
            const maxPossibleScore = 1000; // Adjust based on your scoring system
            const percentage = Math.min(100, Math.round((finalScore / maxPossibleScore) * 100));
            onComplete(percentage);
          }, 2000);
          
          return {
            ...prev,
            score: prev.score + totalBonus,
            isGameOver: true
          };
        }
        
        // Prepare for next level
        setTimeout(() => {
          setShowSuccessMessage(false);
          initializeGameEntities(topic.toLowerCase());
        }, 2000);
        
        return {
          ...prev,
          score: prev.score + totalBonus,
          level: prev.level + 1,
          isLevelComplete: true
        };
      });
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
      timeLeft: 120,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false
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
        title: "Welcome to Traffic Safety Game!",
        content: "Learn traffic rules while having fun. Navigate through the city, collect points, and follow traffic rules to succeed!",
        image: "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400"
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
        content: "Stop at red lights, yield to pedestrians, follow speed limits, and obey all traffic signs. Breaking rules will cost you points and lives!",
        image: "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Scoring System",
        content: "Collect coins for points. Follow traffic rules for bonuses. Complete levels for time and level bonuses. Avoid violations that reduce your score!",
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
            {topic.includes('traffic light') ? '🚦' : 
             topic.includes('pedestrian') ? '🚶' : 
             topic.includes('speed') ? '🚗' : 
             topic.includes('sign') ? '🛑' : '🎮'}
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
            Game Complete!
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{gameState.score}</div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{gameState.level}</div>
              <div className="text-sm text-gray-600">Level Reached</div>
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
            <h3 className="font-bold text-blue-900 mb-2">Traffic Safety Assessment:</h3>
            <p className="text-blue-800 text-sm">
              {percentage >= 80 
                ? "Excellent! You've demonstrated outstanding knowledge of traffic safety rules. Your careful navigation and rule-following would make you a model road user."
                : percentage >= 60 
                ? "Good job! You have a solid understanding of traffic safety, but there's room for improvement in following all rules consistently."
                : "You've completed the game, but should review traffic safety rules more carefully. Remember that following rules keeps everyone safe on the road."}
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
              <div className="text-2xl font-bold text-blue-600">{gameState.level}</div>
              <div className="text-sm text-gray-600">Level</div>
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
            
            {/* Vertical road */}
            <div className="absolute left-1/2 top-0 bottom-0 w-20 bg-gray-600 transform -translate-x-1/2">
              {/* Road markings */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
            </div>
          </div>
          
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
              
              {obstacle.type === 'sign' && (
                <div className="w-full h-full flex items-center justify-center bg-red-500 rounded-lg text-white font-bold">
                  {obstacle.state === 'stop' && 'STOP'}
                  {obstacle.state === 'yield' && '⚠️'}
                  {obstacle.state === 'no-entry' && '⛔'}
                  {obstacle.state === 'walk' && '🚶'}
                  {obstacle.state === '30' && '30'}
                  {obstacle.state === '50' && '50'}
                </div>
              )}
              
              {obstacle.type === 'roadwork' && (
                <div className="w-full h-full flex items-center justify-center">
                  🚧
                </div>
              )}
            </div>
          ))}
          
          {/* Render collectibles */}
          {collectibles.map(collectible => !collectible.collected && (
            <div
              key={collectible.id}
              className="absolute"
              style={{
                left: collectible.x,
                top: collectible.y,
                width: collectible.width,
                height: collectible.height
              }}
            >
              {collectible.type === 'point' && (
                <div className="w-full h-full flex items-center justify-center text-yellow-500 animate-pulse">
                  🪙
                </div>
              )}
              
              {collectible.type === 'bonus' && (
                <div className="w-full h-full flex items-center justify-center text-blue-500 animate-pulse">
                  ⭐
                </div>
              )}
              
              {collectible.type === 'life' && (
                <div className="w-full h-full flex items-center justify-center text-red-500 animate-pulse">
                  ❤️
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
            <div className="w-full h-full flex items-center justify-center bg-green-500 rounded-lg">
              🚙
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
            {topic.includes('traffic light') 
              ? "Stop at red lights, proceed with caution on yellow, and go on green. Collect coins while following traffic rules!"
              : topic.includes('pedestrian')
              ? "Yield to pedestrians at crosswalks. Never hit a pedestrian! Collect coins while following safety rules."
              : topic.includes('speed')
              ? "Follow posted speed limits. Slow down in school zones and residential areas. Collect coins safely!"
              : "Follow all traffic signs and signals. Yield when required. Collect coins while driving safely!"}
          </p>
          <div className="mt-2 text-xs text-blue-700">
            {isMobile 
              ? "Use the on-screen controls to navigate. Tap the buttons to move your vehicle."
              : "Use arrow keys or WASD to move. Follow traffic rules to earn points and avoid penalties."}
          </div>
        </div>
      </div>
    );
  };
  
  return renderGameUI();
};

export default TrafficSafetyGame;