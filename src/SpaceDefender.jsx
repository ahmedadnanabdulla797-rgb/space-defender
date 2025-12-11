import React, { useState, useEffect, useCallback, useRef } from "react";
import { XCircle, Square, Move } from "lucide-react";

export default function SpaceDefender() {
  const [bullets, setBullets] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [enemies, setEnemies] = useState([]);
  const playerRef = useRef(null);
  const movement = useRef(0);
  const speed = 5;
  const enemySpeed = 2;
  const shootCooldown = 300;
  const lastShot = useRef(0);

  const createEnemy = () => {
    const x = Math.random() * window.innerWidth;
    const size = 20 + Math.random() * 20;
    return {
      id: Date.now() + Math.random(),
      x,
      y: -size,
      size
    };
  };

  const shootBullet = useCallback(() => {
    const now = Date.now();
    if (now - lastShot.current < shootCooldown) return;
    lastShot.current = now;

    const rect = playerRef.current.getBoundingClientRect();
    const newBullet = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top
    };

    setBullets((prev) => [...prev, newBullet]);
  }, []);

  const gameLoop = useCallback(() => {
    setBullets((prev) =>
      prev
        .map((b) => ({ ...b, y: b.y - 10 }))
        .filter((b) => b.y > 0)
    );

    setEnemies((prev) =>
      prev
        .map((e) => ({ ...e, y: e.y + enemySpeed }))
        .filter((e) => {
          if (playerRef.current) {
            const rect = playerRef.current.getBoundingClientRect();
            if (
              e.x < rect.right &&
              e.x + e.size > rect.left &&
              e.y < rect.bottom &&
              e.y + e.size > rect.top
            ) {
              setGameOver(true);
              return false;
            }
          }
          return e.y < window.innerHeight;
        })
    );

    setEnemies((prevEnemies) => {
      const survivors = [];
      prevEnemies.forEach((e) => {
        const hit = bullets.some(
          (b) =>
            b.x > e.x &&
            b.x < e.x + e.size &&
            b.y > e.y &&
            b.y < e.y + e.size
        );
        if (!hit) survivors.push(e);
      });
      return survivors;
    });
  }, [bullets]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        gameLoop();
        if (Math.random() < 0.02) {
          setEnemies((prev) => [...prev, createEnemy()]);
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [gameLoop, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") movement.current = -speed;
      if (e.key === "ArrowRight") movement.current = speed;
      if (e.key === " " || e.key === "ArrowUp") shootBullet();
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight")
        movement.current = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [shootBullet]);

  useEffect(() => {
    const loop = setInterval(() => {
      if (playerRef.current && !gameOver) {
        playerRef.current.style.left =
          (playerRef.current.offsetLeft + movement.current).toString() + "px";
      }
    }, 20);

    return () => clearInterval(loop);
  }, [gameOver]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <div
        ref={playerRef}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2"
      >
        <Move size={40} color="white" />
      </div>

      {bullets.map((b) => (
        <div
          key={b.id}
          className="absolute w-1 h-4 bg-yellow-400"
          style={{ left: b.x, top: b.y }}
        />
      ))}

      {enemies.map((e) => (
        <Square
          key={e.id}
          className="absolute text-red-500"
          size={e.size}
          style={{ left: e.x, top: e.y }}
        />
      ))}

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-4xl">
          GAME OVER
        </div>
      )}
    </div>
  );
}
