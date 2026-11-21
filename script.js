/* ==========================================
   MATH EXPLORER - GAME LOGIC & ENGINE
   ========================================== */

// 1. WEBAUDIO API SYNTHESIS ENGINE
class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft ascending chime for correct answer
  playCorrect() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.08;

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * duration);
      
      // Warm sound envelope
      gain.gain.setValueAtTime(0.12, now + index * duration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * duration + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * duration);
      osc.stop(now + index * duration + 0.3);
    });
  }

  // Gentle descending buzz/slide for incorrect answer
  playIncorrect() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // Softer than sawtooth, rounder
    osc.frequency.setValueAtTime(220.00, now); // A3
    osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.35); // C3 slide down

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Fanfare arpeggio for round completion
  playFanfare() {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Triumphant chord: C4 (261.63) -> G4 (392.00) -> C5 (523.25) -> E5 (659.25) -> G5 (783.99) -> C6 (1046.50)
    const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const delay = [0, 0.08, 0.16, 0.24, 0.32, 0.40];
    const duration = [0.15, 0.15, 0.15, 0.15, 0.15, 0.70];

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = index === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay[index]);
      
      gain.gain.setValueAtTime(0.12, now + delay[index]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay[index] + duration[index]);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + delay[index]);
      osc.stop(now + delay[index] + duration[index] + 0.05);
    });
  }
}

// 2. CANVAS CONFETTI EFFECT
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Small burst from a specific (x, y) coordinates (e.g. from the tapped button)
  burst(x, y, count = 25) {
    const colors = ['#f472b6', '#34d399', '#fcd34d', '#a78bfa', '#60a5fa', '#f97316'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x || this.canvas.width / 2,
        y: y || this.canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 12 - 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    }
    if (!this.animationId) {
      this.animate();
    }
  }

  // Raining down from top of the screen on game completion
  rain(durationMs = 3000) {
    const colors = ['#f472b6', '#34d399', '#fcd34d', '#a78bfa', '#60a5fa', '#f97316'];
    const startTime = Date.now();

    const spawnInterval = setInterval(() => {
      if (Date.now() - startTime > durationMs) {
        clearInterval(spawnInterval);
        return;
      }
      
      // Spawn 5 particles per tick
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: -20,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 4 + 3,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 6,
          opacity: 1,
          life: 1.0,
          decay: Math.random() * 0.005 + 0.005
        });
      }
      if (!this.animationId) {
        this.animate();
      }
    }, 80);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let active = false;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.98; // air resistance
      p.angle += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > this.canvas.height || p.x < 0 || p.x > this.canvas.width) {
        this.particles.splice(i, 1);
        continue;
      }

      active = true;
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.angle * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      
      // Confetti shape (small rectangle)
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      this.ctx.restore();
    }

    if (active) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animationId = null;
    }
  }
}

// 3. MAIN GAME CONTROLLER
class MathQuestGame {
  constructor() {
    // Engine Instantiations
    this.audio = new AudioEngine();
    this.confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));

    // Game Configuration
    this.totalQuestions = 10;
    
    // Game State
    this.difficulty = 'easy'; // easy, medium, hard
    this.score = 0;
    this.currentQIndex = 0;
    this.firstTryCorrectCount = 0; // tracking for stars calculation
    
    this.currentProblem = {
      num1: 0,
      num2: 0,
      op: '+', // '+' or '-'
      answer: 0,
      options: []
    };
    
    this.attemptsOnCurrentQ = 0;
    this.hasAnsweredCurrentQ = false;

    // Speeches/Mascot Quotes
    this.mascotQuotes = {
      intro: "Hi, I'm Mathy! Let's play a fun math game! Pick a level and press start!",
      correct: [
        "Yay! You got it right! 🌟",
        "Awesome job! High five! 👋",
        "Woohoo! You are super smart! 🚀",
        "Perfect! Keep it going! 🎈",
        "Bingo! That's correct! ✨"
      ],
      incorrect: [
        "So close! Let's try again! 🌈",
        "Oops! Don't worry, you can do it! 💖",
        "Give it another try! You got this! 🌻",
        "Almost! Think about it and try again! 🧠"
      ],
      question: [
        "Can you solve this one?",
        "What is the answer here?",
        "Let's figure this out!",
        "Think you know this one?",
        "Solve it, Explorer!"
      ]
    };

    // Cache DOM Elements
    this.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      celebration: document.getElementById('celebration-screen')
    };

    this.bindEvents();
    this.setupMascotCopy();
  }

  // Copy SVG Mascot from Menu Screen to Game Screen
  setupMascotCopy() {
    const menuMascotSvg = document.querySelector('#menu-mascot svg');
    if (menuMascotSvg) {
      const cloned = menuMascotSvg.cloneNode(true);
      document.getElementById('game-mascot').appendChild(cloned);
    }
  }

  bindEvents() {
    // Difficulty Button Selectors
    const diffButtons = document.querySelectorAll('.diff-btn');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Play click sound on audio context resume
        this.audio.resume();
        
        diffButtons.forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        this.difficulty = targetBtn.dataset.level;

        // Change mascot speech in start screen
        this.setMascotState('menu-mascot', 'thinking');
        setTimeout(() => this.setMascotState('menu-mascot', 'idle'), 1000);
      });
    });

    // Main Game Controls
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.audio.resume();
      this.startGame();
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      this.audio.resume();
      this.showScreen('start');
      this.setMascotState('menu-mascot', 'idle');
    });

    document.getElementById('replay-btn').addEventListener('click', () => {
      this.audio.resume();
      this.startGame();
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
      this.audio.resume();
      this.showScreen('start');
      this.setMascotState('menu-mascot', 'idle');
    });
  }

  showScreen(screenId) {
    Object.keys(this.screens).forEach(key => {
      this.screens[key].classList.remove('active');
    });
    this.screens[screenId].classList.add('active');
  }

  setMascotState(containerId, state) {
    const mascot = document.getElementById(containerId);
    if (!mascot) return;
    
    mascot.className = `mascot-container status-${state}`;
  }

  startGame() {
    this.score = 0;
    this.currentQIndex = 0;
    this.firstTryCorrectCount = 0;
    
    document.getElementById('score-val').textContent = this.score;
    this.showScreen('game');
    this.loadQuestion();
  }

  loadQuestion() {
    this.attemptsOnCurrentQ = 0;
    this.hasAnsweredCurrentQ = false;
    
    // Update question numbers in UI
    document.getElementById('current-q-num').textContent = this.currentQIndex + 1;
    const progressPercent = (this.currentQIndex / this.totalQuestions) * 100;
    document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;

    // Generate Problem
    this.generateMathProblem();

    // Display Problem
    const problemCard = document.getElementById('question-card');
    problemCard.classList.remove('shake');
    document.getElementById('math-problem').textContent = `${this.currentProblem.num1} ${this.currentProblem.op} ${this.currentProblem.num2} = ?`;

    // Set Mascot Speech
    const randomQuestionText = this.mascotQuotes.question[Math.floor(Math.random() * this.mascotQuotes.question.length)];
    document.getElementById('mascot-speech-text').textContent = randomQuestionText;
    this.setMascotState('game-mascot', 'thinking');

    // Populate Option Buttons
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = ''; // Clear previous

    this.currentProblem.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option;
      btn.addEventListener('click', (e) => this.handleAnswerSelection(e, option));
      optionsGrid.appendChild(btn);
    });

    // Make mascot idle after a bit of thinking
    setTimeout(() => {
      if (!this.hasAnsweredCurrentQ) {
        this.setMascotState('game-mascot', 'idle');
      }
    }, 1200);
  }

  generateMathProblem() {
    let maxNum = 10;
    if (this.difficulty === 'medium') maxNum = 20;
    if (this.difficulty === 'hard') maxNum = 50;

    let num1 = 0;
    let num2 = 0;
    // Choose operator: 50% addition, 50% subtraction
    const op = Math.random() < 0.5 ? '+' : '-';

    if (op === '+') {
      // For kids, let's keep it fun. Easy: sum <= 10. Medium: sum <= 20. Hard: sum <= 50.
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * (maxNum - num1 + 1));
      // Ensure positive values
      if (num2 === 0) num2 = 1;
    } else {
      // Subtraction: ensure result is positive (num1 >= num2)
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
    }

    const answer = op === '+' ? num1 + num2 : num1 - num2;

    // Generate 3 plausible incorrect options (unique and >= 0)
    const options = new Set();
    options.add(answer);

    while (options.size < 4) {
      let offset = Math.floor(Math.random() * 7) - 3; // range -3 to +3
      // Avoid simple zero offsets
      if (offset === 0) offset = Math.random() < 0.5 ? 4 : -4;
      
      const wrongVal = answer + offset;
      if (wrongVal >= 0 && wrongVal !== answer) {
        options.add(wrongVal);
      }
    }

    // Convert Set back to shuffled Array
    const optionsArray = Array.from(options);
    this.shuffle(optionsArray);

    this.currentProblem = { num1, num2, op, answer, options: optionsArray };
  }

  handleAnswerSelection(e, chosenVal) {
    if (this.hasAnsweredCurrentQ) return; // Prevent double clicking after correct answer is selected

    const clickedBtn = e.currentTarget;
    const isCorrect = chosenVal === this.currentProblem.answer;

    if (isCorrect) {
      this.hasAnsweredCurrentQ = true;
      clickedBtn.classList.add('correct');
      this.audio.playCorrect();

      // Trigger Confetti Burst from button location
      const rect = clickedBtn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      this.confetti.burst(x, y, 35);

      // Score handling
      if (this.attemptsOnCurrentQ === 0) {
        this.firstTryCorrectCount++;
        this.score += 10;
      } else {
        this.score += 5; // Less points for subsequent tries
      }
      document.getElementById('score-val').textContent = this.score;

      // Mascot reaction
      this.setMascotState('game-mascot', 'happy');
      const randomHappyQuote = this.mascotQuotes.correct[Math.floor(Math.random() * this.mascotQuotes.correct.length)];
      document.getElementById('mascot-speech-text').textContent = randomHappyQuote;

      // Disable other buttons
      const allButtons = document.querySelectorAll('.option-btn');
      allButtons.forEach(b => {
        if (!b.classList.contains('correct')) {
          b.style.opacity = '0.5';
          b.style.cursor = 'default';
        }
      });

      // Move to next question after a delay
      setTimeout(() => {
        this.currentQIndex++;
        if (this.currentQIndex < this.totalQuestions) {
          this.loadQuestion();
        } else {
          this.endGame();
        }
      }, 1600);

    } else {
      // Incorrect answer
      this.attemptsOnCurrentQ++;
      clickedBtn.classList.add('incorrect');
      clickedBtn.disabled = true; // disable only this wrong button so kid can try again
      
      this.audio.playIncorrect();

      // Shake question card
      const problemCard = document.getElementById('question-card');
      problemCard.classList.remove('shake');
      // trigger reflow
      void problemCard.offsetWidth;
      problemCard.classList.add('shake');

      // Mascot reaction
      this.setMascotState('game-mascot', 'incorrect');
      const randomSadQuote = this.mascotQuotes.incorrect[Math.floor(Math.random() * this.mascotQuotes.incorrect.length)];
      document.getElementById('mascot-speech-text').textContent = randomSadQuote;

      // Reset mascot state back to thinking/idle after shake finishes
      setTimeout(() => {
        if (!this.hasAnsweredCurrentQ) {
          this.setMascotState('game-mascot', 'idle');
        }
      }, 800);
    }
  }

  endGame() {
    // Fill progress bar full
    document.getElementById('progress-bar-fill').style.width = `100%`;

    // Render results in Celebration Screen
    document.getElementById('final-score-val').textContent = `${this.score} pts`;
    const accuracy = Math.round((this.firstTryCorrectCount / this.totalQuestions) * 100);
    document.getElementById('accuracy-val').textContent = `${accuracy}%`;

    // Encourage messages based on accuracy
    let motivation = '';
    let starsEarned = 1;

    if (accuracy === 100) {
      motivation = "Perfect Score! You are a Math Champion! 🏆";
      starsEarned = 3;
    } else if (accuracy >= 80) {
      motivation = "Awesome job! You've got great math skills! 🌟";
      starsEarned = 3;
    } else if (accuracy >= 50) {
      motivation = "Good job! Keep practicing and you'll do even better! 🎈";
      starsEarned = 2;
    } else {
      motivation = "Well done for trying! Let's play again to practice! 🚀";
      starsEarned = 1;
    }

    document.getElementById('summary-motivate-msg').textContent = motivation;

    // Display Stars rating
    const stars = document.querySelectorAll('.star-rating');
    stars.forEach((star, idx) => {
      star.classList.remove('earned');
      if (idx < starsEarned) {
        // Adding delay dynamically
        star.classList.add('earned');
      }
    });

    // Play celebration sound & rain confetti
    this.audio.playFanfare();
    this.confetti.rain(3500);

    setTimeout(() => {
      this.showScreen('celebration');
    }, 600);
  }

  // Standard Fisher-Yates shuffle helper
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

// Initialise Game on page load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new MathQuestGame();
});
