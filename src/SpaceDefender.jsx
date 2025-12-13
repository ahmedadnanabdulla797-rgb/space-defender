import React, { useState, useEffect, useRef } from "react";
import { Rocket, Heart, Sun, Moon, Volume2, VolumeX } from "lucide-react";

export default function SpaceDefender() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  const [gameState, setGameState] = useState("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  /* ✅ Permanent High Score */
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("space_highscore")) || 0
  );

  /* 🌙 Eye-care UI */
  const [darkMode, setDarkMode] = useState(true);
  const [muted, setMuted] = useState(false);

  const gameRef = useRef({
    ship: { x: 200, y: 360, width: 40, height: 40, speed: 6 },
    bullets: [],
    asteroids: [],
    keys: {},
    lastAsteroidTime: 0,
    animationId: null
  });

  /* 🎯 LEVEL SYSTEM */
  useEffect(() => {
    if (score >= 800) setLevel(5);
    else if (score >= 500) setLevel(4);
    else if (score >= 300) setLevel(3);
    else if (score >= 150) setLevel(2);
  }, [score]);

  /* 🎮 GAME LOOP */
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const game = gameRef.current;

    /* ✅ Hi-DPI responsive canvas */
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.min(window.innerWidth * 0.95, 960);
      const height = width * 0.56;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      game.ship.y = height - 60;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const shoot = () => {
      game.bullets.push({
        x: game.ship.x + game.ship.width / 2 - 2,
        y: game.ship.y,
        speed: 10
      });
    };

    const keyDown = e => {
      game.keys[e.key] = true;
      if (e.key === " ") shoot();
    };
    const keyUp = e => (game.keys[e.key] = false);

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const loop = time => {
      /* 🌌 Eye-care background */
      ctx.fillStyle = darkMode ? "#0f172a" : "#eef2ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      /* ✨ Stars */
      ctx.fillStyle = darkMode ? "#94a3b8" : "#64748b";
      for (let i = 0; i < 40; i++) {
        ctx.fillRect(
          (i * 97) % canvas.width,
          (i * 61 + time * 0.03) % canvas.height,
          2,
          2
        );
      }

      /* 🚀 Ship movement */
      if ((game.keys.ArrowLeft || game.keys.a) && game.ship.x > 0)
        game.ship.x -= game.ship.speed;
      if (
        (game.keys.ArrowRight || game.keys.d) &&
        game.ship.x < canvas.width - game.ship.width
      )
        game.ship.x += game.ship.speed;

      /* 🚀 Ship */
      ctx.fillStyle = "#5eead4";
      ctx.beginPath();
      ctx.moveTo(game.ship.x + 20, game.ship.y);
      ctx.lineTo(game.ship.x, game.ship.y + 40);
      ctx.lineTo(game.ship.x + 40, game.ship.y + 40);
      ctx.fill();

      /* 🔫 Bullets */
      game.bullets = game.bullets.filter(b => {
        b.y -= b.speed;
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(b.x, b.y, 4, 14);
        return b.y > -20;
      });

      /* ☄️ Asteroids */
      if (time - game.lastAsteroidTime > 1200 - level * 150) {
        game.lastAsteroidTime = time;
        const size = 28 + Math.random() * 22;
        game.asteroids.push({
          x: Math.random() * (canvas.width - size),
          y: -size,
          size,
          speed: 1.5 + level * 0.35,
          points: 10
        });
      }

      game.asteroids = game.asteroids.filter(a => {
        a.y += a.speed;
        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (
          a.y > game.ship.y &&
          a.x > game.ship.x &&
          a.x < game.ship.x + game.ship.width
        ) {
          setLives(l => l - 1);
          return false;
        }
        return a.y < canvas.height + 50;
      });

      /* 💥 Collision */
      game.bullets.forEach((b, bi) =>
        game.asteroids.forEach((a, ai) => {
          if (Math.abs(b.x - a.x) < a.size / 2) {
            game.bullets.splice(bi, 1);
            game.asteroids.splice(ai, 1);
            setScore(s => s + a.points);
          }
        })
      );

      /* ☠ Game over */
      if (lives <= 0) {
        const newHigh = Math.max(score, highScore);
        localStorage.setItem("space_highscore", newHigh);
        setHighScore(newHigh);
        setGameState("gameover");
        return;
      }

      game.animationId = requestAnimationFrame(loop);
    };

    game.animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(game.animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [gameState, darkMode, lives, level]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setLevel(1);
    gameRef.current.bullets = [];
    gameRef.current.asteroids = [];
  };

  /* 🎵 Music */
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.25;
    muted ? audioRef.current.pause() : audioRef.current.play();
  }, [muted, gameState]);

  return (
    <div className={`min-h-screen flex flex-col items-center p-3 ${darkMode ? "bg-slate-950" : "bg-slate-100"}`}>
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/audio/2022/10/19/audio_7d8bcb47d7.mp3" />

      {/* HUD */}
      <div className="flex gap-4 text-sm text-white mb-2 items-center">
        <span>Score: {score}</span>
        <span>High: {highScore}</span>
        <span>Level {level}</span>
        <span className="flex gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} size={14} fill="red" />
          ))}
        </span>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* MENU */}
      {gameState !== "playing" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white z-10">
          <div className="text-center">
            <Rocket size={64} className="mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Space Defender</h1>
            <p className="mb-4 opacity-80">High Score: {highScore}</p>
            <button onClick={startGame} className="bg-teal-500 px-8 py-3 rounded-lg text-xl">
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        className="rounded-xl border border-teal-400 shadow-xl"
      />
    </div>
  );
}
