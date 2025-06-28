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
  Star
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
    timeLeft: 180,
    isPaused: false,
    isGameOver: false,
    isLevelComplete: false,
    safetyTips: [
      "Always look both ways before crossing the road",
      "Stop at red lights and wait for green",
      "Use crosswalks whenever available",
      "Wear a helmet when cycling",
      "Never use your phone while driving or crossing",
      "Wear bright clothing to be more visible",
      "Always wear your seatbelt",
      "Yield to pedestrians at crosswalks"
    ],
    currentTip: 0,
    violations: 0,
    checkpointsCompleted: 0,
    challengesCompleted: 0
  });
  
  // Game entities
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
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(0);
  const [playerType, setPlayerType] = useState<'pedestrian' | 'cyclist' | 'driver'>('pedestrian');
  
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
      timeLeft: 180,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyTips: [
        "Always look both ways before crossing the road",
        "Stop at red lights and wait for green",
        "Use crosswalks whenever available",
        "Wear a helmet when cycling",
        "Never use your phone while driving or crossing",
        "Wear bright clothing to be more visible",
        "Always wear your seatbelt",
        "Yield to pedestrians at crosswalks"
      ],
      currentTip: 0,
      violations: 0,
      checkpointsCompleted: 0,
      challengesCompleted: 0
    });
    
    // Initialize player position based on selected type
    setPlayer({
      x: 50,
      y: 300,
      width: playerType === 'driver' ? 60 : 40,
      height: playerType === 'driver' ? 30 : 40,
      speed: playerType === 'pedestrian' ? 3 : playerType === 'cyclist' ? 5 : 7,
      direction: 'right',
      isMoving: false,
      type: playerType,
      lives: 3
    });
    
    // Initialize game entities
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
      if (gameState.isPaused || gameState.isGameOver || showTutorial || currentChallenge) return;
      
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
  }, [gameState.isPaused, gameState.isGameOver, showTutorial, currentChallenge]);
  
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
  
  // Challenge timer
  useEffect(() => {
    if (!currentChallenge || showChallengeResult) return;
    
    if (challengeTimeLeft > 0) {
      const timer = setTimeout(() => setChallengeTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (challengeTimeLeft === 0) {
      // Time's up for the challenge
      handleChallengeAnswer(-1); // -1 indicates timeout
    }
  }, [currentChallenge, challengeTimeLeft, showChallengeResult]);
  
  // Rotate safety tips
  useEffect(() => {
    if (!gameStarted || gameState.isPaused || gameState.isGameOver) return;
    
    const tipInterval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        currentTip: (prev.currentTip + 1) % prev.safetyTips.length
      }));
    }, 8000);
    
    return () => clearInterval(tipInterval);
  }, [gameStarted, gameState.isPaused, gameState.isGameOver]);
  
  // Initialize game entities based on level
  const initializeGameEntities = () => {
    // Create checkpoints
    const newCheckpoints: Checkpoint[] = [
      {
        id: 'checkpoint1',
        x: 200,
        y: 300,
        width: 100,
        height: 60,
        type: 'crosswalk',
        completed: false,
        instructions: 'Use the crosswalk to cross safely'
      },
      {
        id: 'checkpoint2',
        x: 400,
        y: 200,
        width: 60,
        height: 100,
        type: 'trafficSignal',
        completed: false,
        instructions: 'Wait for the green light before proceeding'
      },
      {
        id: 'checkpoint3',
        x: 600,
        y: 300,
        width: 100,
        height: 60,
        type: 'zebraCrossing',
        completed: false,
        instructions: 'Look both ways before crossing'
      },
      {
        id: 'checkpoint4',
        x: 800,
        y: 200,
        width: 60,
        height: 100,
        type: 'blindTurn',
        completed: false,
        instructions: 'Slow down and be cautious around blind turns'
      },
      {
        id: 'checkpoint5',
        x: 1000,
        y: 300,
        width: 100,
        height: 60,
        type: 'parkingZone',
        completed: false,
        instructions: 'Park safely in designated areas'
      },
      {
        id: 'destination',
        x: 1200,
        y: 300,
        width: 80,
        height: 80,
        type: 'destination',
        completed: false,
        instructions: 'Reach your destination safely'
      }
    ];
    
    // Create obstacles
    const newObstacles: Obstacle[] = [
      // Traffic lights
      {
        id: 'trafficLight1',
        x: 400,
        y: 150,
        width: 30,
        height: 60,
        type: 'trafficLight',
        state: 'red',
        dangerous: false
      },
      // Moving cars
      {
        id: 'car1',
        x: 300,
        y: 100,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'right',
        speed: 2,
        dangerous: true
      },
      {
        id: 'car2',
        x: 500,
        y: 400,
        width: 60,
        height: 30,
        type: 'car',
        direction: 'left',
        speed: 3,
        dangerous: true
      },
      // Pedestrians
      {
        id: 'pedestrian1',
        x: 250,
        y: 350,
        width: 20,
        height: 40,
        type: 'pedestrian',
        direction: 'up',
        speed: 1,
        dangerous: false
      },
      // Cyclists
      {
        id: 'cyclist1',
        x: 700,
        y: 250,
        width: 30,
        height: 20,
        type: 'cyclist',
        direction: 'down',
        speed: 2,
        dangerous: true
      },
      // Road signs
      {
        id: 'sign1',
        x: 600,
        y: 150,
        width: 40,
        height: 40,
        type: 'sign',
        state: 'stop',
        dangerous: false
      },
      // Crosswalks
      {
        id: 'crosswalk1',
        x: 200,
        y: 280,
        width: 100,
        height: 40,
        type: 'crosswalk',
        dangerous: false
      },
      // Hazards
      {
        id: 'hazard1',
        x: 800,
        y: 350,
        width: 30,
        height: 30,
        type: 'hazard',
        dangerous: true
      }
    ];
    
    // Create challenges
    const newChallenges: Challenge[] = [
      {
        id: 'challenge1',
        type: 'reaction',
        question: 'A car is approaching fast while you're crossing. What should you do?',
        options: [
          'Continue walking slowly',
          'Run to the other side quickly',
          'Stop and go back to safety',
          'Wave at the driver to slow down'
        ],
        correctAnswer: 2,
        explanation: 'Safety first! If you notice a car approaching too fast, it's safest to return to where you started and wait for a safer opportunity to cross.',
        completed: false,
        timeLimit: 10
      },
      {
        id: 'challenge2',
        type: 'decision',
        question: 'You're at a traffic light that just turned yellow. What should you do?',
        options: [
          'Speed up to get through before it turns red',
          'Stop if you can do so safely',
          'Ignore it since yellow is just a suggestion',
          'Honk to alert other drivers'
        ],
        correctAnswer: 1,
        explanation: 'Yellow means prepare to stop. You should stop if you can do so safely, as the light will soon turn red.',
        completed: false,
        timeLimit: 10
      },
      {
        id: 'challenge3',
        type: 'awareness',
        question: 'You notice a ball rolling into the street. What should you anticipate?',
        options: [
          'Nothing, it's just a ball',
          'A child might run after it',
          'Someone will come pick it up later',
          'The ball will stop on its own'
        ],
        correctAnswer: 1,
        explanation: 'When you see a ball roll into the street, always anticipate that a child might follow it without checking for traffic. Slow down and be prepared to stop.',
        completed: false,
        timeLimit: 10
      },
      {
        id: 'challenge4',
        type: 'decision',
        question: 'You're approaching a crosswalk with pedestrians waiting. What should you do?',
        options: [
          'Continue at the same speed if you have right of way',
          'Speed up to pass before they start crossing',
          'Slow down and prepare to stop',
          'Honk to let them know you're coming'
        ],
        correctAnswer: 2,
        explanation: 'Always slow down and be prepared to stop for pedestrians waiting at crosswalks. They have the right of way at marked crosswalks.',
        completed: false,
        timeLimit: 10
      },
      {
        id: 'challenge5',
        type: 'awareness',
        question: 'What should you check before starting your vehicle?',
        options: [
          'Just that you have enough fuel',
          'Mirrors, lights, tires, and fuel',
          'That your radio is working',
          'That you have your phone with you'
        ],
        correctAnswer: 1,
        explanation: 'Before starting your vehicle, you should check your mirrors, lights, tires, and fuel level to ensure everything is working properly and safe for driving.',
        completed: false,
        timeLimit: 10
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
    
    // Randomly trigger challenges
    if (Math.random() < 0.001 && !currentChallenge) { // 0.1% chance per frame
      triggerRandomChallenge();
    }
    
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
      
      // Reset player position to last checkpoint or start
      const lastCompletedCheckpoint = checkpoints.filter(c => c.completed).pop();
      if (lastCompletedCheckpoint) {
        setPlayer(prev => ({
          ...prev,
          x: lastCompletedCheckpoint.x,
          y: lastCompletedCheckpoint.y
        }));
      } else {
        setPlayer(prev => ({
          ...prev,
          x: 50,
          y: 300
        }));
      }
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
      return prev.map(checkpoint => {
        // Check if player is at this checkpoint
        if (
          !checkpoint.completed &&
          player.x < checkpoint.x + checkpoint.width &&
          player.x + player.width > checkpoint.x &&
          player.y < checkpoint.y + checkpoint.height &&
          player.y + player.height > checkpoint.y
        ) {
          // Checkpoint reached
          setGameState(prevState => ({
            ...prevState,
            score: prevState.score + 50,
            checkpointsCompleted: prevState.checkpointsCompleted + 1
          }));
          
          // Show success message
          setSuccessMessage(`Checkpoint reached! +50 points`);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 1500);
          
          // Trigger a challenge at each checkpoint
          triggerRandomChallenge();
          
          return { ...checkpoint, completed: true };
        }
        return checkpoint;
      });
    });
  };
  
  // Trigger a random challenge
  const triggerRandomChallenge = () => {
    const incompleteChallenges = challenges.filter(c => !c.completed);
    if (incompleteChallenges.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * incompleteChallenges.length);
    const challenge = incompleteChallenges[randomIndex];
    
    setCurrentChallenge(challenge);
    setSelectedAnswer(null);
    setShowChallengeResult(false);
    setChallengeTimeLeft(challenge.timeLimit);
  };
  
  // Handle challenge answer
  const handleChallengeAnswer = (answerIndex: number) => {
    if (!currentChallenge) return;
    
    setSelectedAnswer(answerIndex);
    setShowChallengeResult(true);
    
    // Update challenge completion status
    setChallenges(prev => 
      prev.map(c => 
        c.id === currentChallenge.id ? { ...c, completed: true } : c
      )
    );
    
    // Update score based on answer
    if (answerIndex === currentChallenge.correctAnswer) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 100,
        challengesCompleted: prev.challengesCompleted + 1
      }));
      
      // Show success message
      setSuccessMessage('Correct answer! +100 points');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 1500);
    } else if (answerIndex !== -1) { // Not a timeout
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 30),
        violations: prev.violations + 1
      }));
      
      // Show fail message
      setFailMessage('Incorrect answer! -30 points');
      setShowFailMessage(true);
      setTimeout(() => setShowFailMessage(false), 1500);
    } else { // Timeout
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 20),
        violations: prev.violations + 1
      }));
      
      // Show fail message
      setFailMessage('Time's up! -20 points');
      setShowFailMessage(true);
      setTimeout(() => setShowFailMessage(false), 1500);
    }
    
    // Close challenge after showing result
    setTimeout(() => {
      setCurrentChallenge(null);
    }, 3000);
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Check if destination checkpoint is reached
    const destinationCheckpoint = checkpoints.find(c => c.type === 'destination');
    
    if (destinationCheckpoint?.completed) {
      setGameState(prev => {
        // Level complete bonus
        const checkpointBonus = prev.checkpointsCompleted * 50;
        const challengeBonus = prev.challengesCompleted * 100;
        const timeBonus = prev.timeLeft * 2;
        const safetyBonus = Math.max(0, 500 - (prev.violations * 50));
        const totalBonus = checkpointBonus + challengeBonus + timeBonus + safetyBonus;
        
        // Show success message
        setSuccessMessage(`Level Complete! +${totalBonus} bonus points!`);
        setShowSuccessMessage(true);
        
        // Game complete
        setTimeout(() => {
          const finalScore = prev.score + totalBonus;
          const maxPossibleScore = 2000; // Adjust based on your scoring system
          const percentage = Math.min(100, Math.round((finalScore / maxPossibleScore) * 100));
          onComplete(percentage);
        }, 3000);
        
        return {
          ...prev,
          score: prev.score + totalBonus,
          isGameOver: true,
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
      timeLeft: 180,
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      safetyTips: [
        "Always look both ways before crossing the road",
        "Stop at red lights and wait for green",
        "Use crosswalks whenever available",
        "Wear a helmet when cycling",
        "Never use your phone while driving or crossing",
        "Wear bright clothing to be more visible",
        "Always wear your seatbelt",
        "Yield to pedestrians at crosswalks"
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
        content: "Learn traffic rules while having fun. Navigate through the city, complete checkpoints, and follow traffic rules to succeed!",
        image: "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Choose Your Character",
        content: "Select whether you want to be a pedestrian, cyclist, or driver. Each has different speeds and responsibilities.",
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
        content: "Stop at red lights, yield to pedestrians, use crosswalks, and obey all traffic signs. Breaking rules will cost you points and lives!",
        image: "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=400"
      },
      {
        title: "Challenges",
        content: "You'll face decision challenges at checkpoints. Answer correctly to earn bonus points and demonstrate your safety knowledge!",
        image: null
      },
      {
        title: "Ready to Play?",
        content: "Remember, safety first! Your goal is to navigate from home to your destination while following all traffic rules. Good luck!",
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
      case 'destination': return '🏁';
      default: return '⭐';
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
      case 'sign': 
        if (state === 'stop') return '🛑';
        if (state === 'yield') return '⚠️';
        return '🚸';
      case 'crosswalk': return '⬜';
      case 'hazard': return '⚠️';
      default: return '❓';
    }
  };
  
  // Get player icon
  const getPlayerIcon = (type: string) => {
    switch (type) {
      case 'pedestrian': return '🚶';
      case 'cyclist': return '🚴';
      case 'driver': return '🚗';
      default: return '👤';
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
          
          {/* Character selection */}
          {tutorialStep === 1 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.button
                onClick={() => setPlayerType('pedestrian')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  playerType === 'pedestrian' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-2">🚶</div>
                <div className="font-bold">Pedestrian</div>
                <div className="text-sm text-gray-600">Slow but safe</div>
              </motion.button>
              
              <motion.button
                onClick={() => setPlayerType('cyclist')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  playerType === 'cyclist' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-2">🚴</div>
                <div className="font-bold">Cyclist</div>
                <div className="text-sm text-gray-600">Balanced speed</div>
              </motion.button>
              
              <motion.button
                onClick={() => setPlayerType('driver')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  playerType === 'driver' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-2">🚗</div>
                <div className="font-bold">Driver</div>
                <div className="text-sm text-gray-600">Fast but challenging</div>
              </motion.button>
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
        </div>
      );
    }
    
    if (gameState.isGameOver) {
      const isSuccess = gameState.isLevelComplete;
      const finalScore = gameState.score;
      const maxPossibleScore = 2000; // Adjust based on your scoring system
      const percentage = Math.min(100, Math.max(0, Math.round((finalScore / maxPossibleScore) * 100)));
      
      return (
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl mb-6"
          >
            {isSuccess ? '🏆' : '😢'}
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isSuccess ? 'Journey Complete!' : 'Game Over'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{finalScore}</div>
              <div className="text-sm text-gray-600">Final Score</div>
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
                : "You've completed the game, but should review road safety rules more carefully. Remember that following rules keeps everyone safe on the road."}
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
          style={{ height: '500px' }}
        >
          {/* Road background */}
          <div className="absolute inset-0 bg-gray-700">
            {/* Horizontal road */}
            <div className="absolute top-1/2 left-0 right-0 h-80 bg-gray-600 transform -translate-y-1/2">
              {/* Road markings */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-yellow-400 transform -translate-y-1/2 dashed-line"></div>
            </div>
            
            {/* Vertical roads at checkpoints */}
            {checkpoints.map((checkpoint, index) => (
              <div 
                key={index}
                className="absolute bg-gray-600"
                style={{
                  left: checkpoint.x + checkpoint.width/2 - 40,
                  top: 0,
                  bottom: 0,
                  width: 80
                }}
              >
                {/* Road markings */}
                <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-white transform -translate-x-1/2 dashed-line"></div>
              </div>
            ))}
          </div>
          
          {/* Checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <div
              key={index}
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
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </div>
          ))}
          
          {/* Obstacles */}
          {obstacles.map((obstacle, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center text-2xl"
              style={{
                left: obstacle.x,
                top: obstacle.y,
                width: obstacle.width,
                height: obstacle.height,
                transform: obstacle.direction === 'left' ? 'scaleX(-1)' : 'none'
              }}
            >
              {getObstacleIcon(obstacle.type, obstacle.state)}
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
              {getPlayerIcon(player.type)}
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
          
          {/* Challenge Popup */}
          <AnimatePresence>
            {currentChallenge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center p-6"
              >
                <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Safety Challenge</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-red-500" />
                      <span className={`font-bold ${challengeTimeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                        {challengeTimeLeft}s
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-lg font-medium text-gray-800 mb-6">
                    {currentChallenge.question}
                  </p>
                  
                  {!showChallengeResult ? (
                    <div className="space-y-3">
                      {currentChallenge.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleChallengeAnswer(index)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-sm">{String.fromCharCode(65 + index)}</span>
                            </div>
                            <span>{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl ${
                      selectedAnswer === currentChallenge.correctAnswer
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {selectedAnswer === currentChallenge.correctAnswer ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-700">Correct!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="font-bold text-red-700">
                              {selectedAnswer === -1 ? "Time's up!" : "Incorrect!"}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-gray-700">
                        {currentChallenge.explanation}
                      </p>
                      
                      {selectedAnswer !== currentChallenge.correctAnswer && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-700">
                              Correct answer: {currentChallenge.options[currentChallenge.correctAnswer]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
        
        {/* Safety Tip */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Safety Tip:</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={gameState.currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-blue-800"
            >
              {gameState.safetyTips[gameState.currentTip]}
            </motion.p>
          </AnimatePresence>
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
            Navigate through the city, reach all checkpoints, and arrive at your destination. Follow traffic rules, avoid collisions, and answer safety challenges correctly!
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