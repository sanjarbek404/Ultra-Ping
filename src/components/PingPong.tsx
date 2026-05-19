import React, { useEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 8;
const PLAYER_SPEED = 7;
const AI_SPEED = 4.8;
const WINNING_SCORE = 11;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

type GameStatus = 'start' | 'playing' | 'gameover';

export default function PingPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const playerScoreRef = useRef<HTMLDivElement>(null);
  const aiScoreRef = useRef<HTMLDivElement>(null);
  
  const [status, setStatus] = useState<GameStatus>('start');
  const [winner, setWinner] = useState<string>('');
  
  const state = useRef({
    status: 'start' as GameStatus,
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 0, vy: 0, speed: 7 },
    player: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 },
    ai: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 },
    keys: { w: false, s: false, up: false, down: false },
    particles: [] as Particle[],
    shake: 0
  });

  const resetBall = (playerScored: boolean) => {
    state.current.ball.x = CANVAS_WIDTH / 2;
    state.current.ball.y = CANVAS_HEIGHT / 2;
    state.current.ball.speed = 7;
    const dirX = playerScored ? 1 : -1;
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    state.current.ball.vx = dirX * state.current.ball.speed * Math.cos(angle);
    state.current.ball.vy = state.current.ball.speed * Math.sin(angle);
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        maxLife: Math.random() * 20 + 10,
        color
      });
    }
    state.current.shake = 8;
  };

  const update = () => {
    if (state.current.status !== 'playing') return;

    const s = state.current;

    // Player movement
    if (s.keys.up || s.keys.w) s.player.y = Math.max(0, s.player.y - PLAYER_SPEED);
    if (s.keys.down || s.keys.s) s.player.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.player.y + PLAYER_SPEED);

    // AI movement
    const aiCenter = s.ai.y + PADDLE_HEIGHT / 2;
    if (s.ball.vy > 0 || s.ball.x > CANVAS_WIDTH / 3) {
       if (aiCenter < s.ball.y - 12) {
         s.ai.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.ai.y + AI_SPEED);
       } else if (aiCenter > s.ball.y + 12) {
         s.ai.y = Math.max(0, s.ai.y - AI_SPEED);
       }
    }

    // Ball movement
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Top/Bottom boundaries
    if (s.ball.y - BALL_SIZE < 0) {
       s.ball.y = BALL_SIZE;
       s.ball.vy *= -1;
       createParticles(s.ball.x, 0, '#38bdf8', 5);
    } else if (s.ball.y + BALL_SIZE > CANVAS_HEIGHT) {
       s.ball.y = CANVAS_HEIGHT - BALL_SIZE;
       s.ball.vy *= -1;
       createParticles(s.ball.x, CANVAS_HEIGHT, '#38bdf8', 5);
    }

    // Paddle Collisions (Left)
    if (
      s.ball.x - BALL_SIZE < PADDLE_WIDTH + 20 &&
      s.ball.y > s.player.y &&
      s.ball.y < s.player.y + PADDLE_HEIGHT &&
      s.ball.vx < 0
    ) {
      s.ball.x = PADDLE_WIDTH + 20 + BALL_SIZE;
      s.ball.vx *= -1;
      const hitPoint = (s.ball.y - (s.player.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
      const angle = hitPoint * (Math.PI / 3);
      s.ball.speed = Math.min(s.ball.speed + 0.5, 16);
      s.ball.vx = s.ball.speed * Math.cos(angle);
      s.ball.vy = s.ball.speed * Math.sin(angle);
      createParticles(PADDLE_WIDTH + 20, s.ball.y, '#38bdf8', 15);
    }

    // Paddle Collisions (Right)
    if (
      s.ball.x + BALL_SIZE > CANVAS_WIDTH - (PADDLE_WIDTH + 20) &&
      s.ball.y > s.ai.y &&
      s.ball.y < s.ai.y + PADDLE_HEIGHT &&
      s.ball.vx > 0
    ) {
      s.ball.x = CANVAS_WIDTH - (PADDLE_WIDTH + 20) - BALL_SIZE;
      s.ball.vx *= -1;
      const hitPoint = (s.ball.y - (s.ai.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
      const angle = hitPoint * (Math.PI / 3);
      s.ball.speed = Math.min(s.ball.speed + 0.5, 16);
      s.ball.vx = -s.ball.speed * Math.cos(angle);
      s.ball.vy = s.ball.speed * Math.sin(angle);
      createParticles(CANVAS_WIDTH - (PADDLE_WIDTH + 20), s.ball.y, '#f43f5e', 15);
    }

    // Scoring
    if (s.ball.x < -BALL_SIZE * 2) {
      s.ai.score++;
      if (aiScoreRef.current) aiScoreRef.current.innerText = s.ai.score.toString().padStart(2, '0');
      if (s.ai.score >= WINNING_SCORE) {
        s.status = 'gameover';
        setStatus('gameover');
        setWinner('CPU');
      } else {
        createParticles(20, s.ball.y, '#f43f5e', 30);
        resetBall(false);
      }
    } else if (s.ball.x > CANVAS_WIDTH + BALL_SIZE * 2) {
      s.player.score++;
      if (playerScoreRef.current) playerScoreRef.current.innerText = s.player.score.toString().padStart(2, '0');
      if (s.player.score >= WINNING_SCORE) {
        s.status = 'gameover';
        setStatus('gameover');
        setWinner('Player');
      } else {
        createParticles(CANVAS_WIDTH - 20, s.ball.y, '#38bdf8', 30);
        resetBall(true);
      }
    }

    // Particles update
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    if (s.shake > 0) s.shake -= 1;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = state.current;

    // Background clear for transparent or dark background trail
    ctx.fillStyle = 'rgba(2, 6, 23, 0.3)'; // Match slate-950 for trail
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    if (s.shake > 0) {
      const dx = (Math.random() - 0.5) * s.shake;
      const dy = (Math.random() - 0.5) * s.shake;
      ctx.translate(dx, dy);
    }

    // Net
    for (let i = 0; i <= CANVAS_HEIGHT; i += 40) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 1, i, 2, 20);
    }

    const drawGlowRect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
    };

    // Paddles
    drawGlowRect(20, s.player.y, PADDLE_WIDTH, PADDLE_HEIGHT, '#38bdf8');
    drawGlowRect(CANVAS_WIDTH - PADDLE_WIDTH - 20, s.ai.y, PADDLE_WIDTH, PADDLE_HEIGHT, '#f43f5e');

    // Ball
    if (s.status === 'playing') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Particles
    for (const p of s.particles) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const gameLoop = () => {
    update();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.current.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.current.keys.down = true;
      
      // Prevent default scrolling when using arrow keys
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.current.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.current.keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startGame = () => {
    state.current.player.score = 0;
    state.current.ai.score = 0;
    if (playerScoreRef.current) playerScoreRef.current.innerText = '00';
    if (aiScoreRef.current) aiScoreRef.current.innerText = '00';
    state.current.particles = [];
    resetBall(true);
    state.current.status = 'playing';
    setStatus('playing');
    setWinner('');
  };

  const [fps, setFps] = useState(60);

  // Measure FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const countFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(countFps);
    };
    
    const rafId = requestAnimationFrame(countFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Header / Scoreboard */}
      <div className="w-full max-w-[900px] px-8 py-6 flex justify-between items-center z-10">
          <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] text-sky-400 font-bold mb-1">O'yinchi</span>
              <div ref={playerScoreRef} className="text-6xl font-black tabular-nums leading-none tracking-tighter">00</div>
          </div>
          
          <div className="text-center">
              <h1 className="text-sm uppercase tracking-[0.5em] opacity-50 mb-2">Ultra Ping</h1>
              <div className="h-1 w-24 bg-sky-500 mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-[0.3em] text-rose-500 font-bold mb-1">Sun'iy Ong</span>
              <div ref={aiScoreRef} className="text-6xl font-black tabular-nums leading-none tracking-tighter">00</div>
          </div>
      </div>

      {/* Main Game Container */}
      <div className="relative w-full max-w-[900px] aspect-[9/5] game-border rounded-xl flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain block"
        />
        
        {/* Overlay / Start UI */}
        {status === 'start' && (
          <button onClick={startGame} className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300 w-full text-left group">
              <div className="text-center group-hover:scale-105 transition-transform duration-300">
                  <p className="text-sky-400 text-xs tracking-widest uppercase mb-4">Tayyormisiz?</p>
                  <h2 className="text-4xl font-light mb-8">BO'SHLASH UCHUN BOSING</h2>
                  <div className="grid grid-cols-2 gap-8 text-left max-w-sm mx-auto">
                      <div className="border-l border-white/20 pl-4">
                          <p className="text-[10px] uppercase opacity-40">Boshqarish</p>
                          <p className="text-xs">W / S tugmalari</p>
                      </div>
                      <div className="border-l border-white/20 pl-4">
                          <p className="text-[10px] uppercase opacity-40">Maqsad</p>
                          <p className="text-xs">11 ball to'plash</p>
                      </div>
                  </div>
              </div>
          </button>
        )}

        {status === 'gameover' && (
          <button onClick={startGame} className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300 w-full group">
              <div className="text-center group-hover:scale-105 transition-transform duration-300">
                  <p className={`text-xs tracking-widest uppercase mb-4 ${winner === 'Player' ? 'text-sky-400' : 'text-rose-500'}`}>
                    O'yin Tugadi
                  </p>
                  <h2 className="text-4xl font-light mb-8 uppercase tracking-widest">
                    {winner === 'Player' ? "Siz Yutdingiz!" : "CPU Yutdi!"}
                  </h2>
                  <div className="grid grid-cols-2 gap-8 text-left max-w-sm mx-auto">
                      <div className="border-l border-white/20 pl-4">
                          <p className="text-[10px] uppercase opacity-40">Natija</p>
                          <p className="text-xs">{state.current.player.score} - {state.current.ai.score}</p>
                      </div>
                      <div className="border-l border-white/20 pl-4">
                          <p className="text-[10px] uppercase opacity-40">Davom etish</p>
                          <p className="text-xs">Qaytadan o'ynash uchun bosing</p>
                      </div>
                  </div>
              </div>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-[900px] px-8 py-6 flex justify-between items-end opacity-40">
          <div className="text-[10px] uppercase">
              <p>Ping: <span className="text-green-400">2ms</span></p>
              <p>FPS: <span>{fps}</span></p>
          </div>
          <div className="text-[10px] uppercase tracking-widest">
              &copy; 2024 Minimalist Labs / V.1.0
          </div>
      </div>
    </div>
  );
}
