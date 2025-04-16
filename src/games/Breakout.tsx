import { useRef, useEffect, useState } from "react";

const resoWidth = 1280;
const resoHeight = 600;

const blockCountPerRow = 4;
const blockCountPerCol = 8;
const blockColor = "green";
const blockGap = 2;
const blockWidth = Math.floor(resoWidth / blockCountPerCol);
const blockHeight = 32;
const ballDims = 20;
const oneOverSqrt2 = 0.70710678118; // 1 / Math.sqrt(2)
const ballSpeed = 500; // pixels per second

interface v2f {
  x: number;
  y: number;
};

interface aabb {
  min: v2f;
  max: v2f;
};

const collisionOccured = (a: aabb, b: aabb): v2f | null => {

  //if ((a.max.x < b.min.x) || (a.min.x > b.max.x)) return false;
  //if ((a.max.y < b.min.y) || (a.min.y > b.max.y)) return false;
  //return true;
  const aCenter = {
    x: (a.min.x + a.max.x) * 0.5,
    y: (a.min.y + a.max.y) * 0.5,
  };
  const bCenter = {
    x: (b.min.x + b.max.x) * 0.5,
    y: (b.min.y + b.max.y) * 0.5,
  };
  const dx = aCenter.x - bCenter.x;
  const dy = aCenter.y - bCenter.y;
  const absDX = Math.abs(dx);
  const absDY = Math.abs(dy);
  // If the distance between the centers of the rects are greater than the sum of their half widths, then they are not colliding
  // Easy to see if you draw the AABBs on paper.
  const xOverlap = ((a.max.x - a.min.x) * 0.5 + (b.max.x - b.min.x) * 0.5) - absDX;
  const yOverlap = ((a.max.y - a.min.y) * 0.5 + (b.max.y - b.min.y) * 0.5) - absDY;

  if (xOverlap <= 0 || yOverlap <= 0) {
    return null;
  }

  let dirMultiplier: v2f;

  if (xOverlap < yOverlap) {
    dirMultiplier = { x: Math.sign(dx), y: 1 };
  } else {
    dirMultiplier = { x: 1, y: -Math.sign(dy) };
  }

  return dirMultiplier;
};

// YOINK: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
const roundedRect =
  (ctx: CanvasRenderingContext2D,
   { x, y }: v2f,
   width: number,
   height: number,
   radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

// Programming Real-Time stuff in React is a MISTAKE.
const Breakout = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const [leftArrowDown, setLeftArrowDown] = useState<boolean>(false);
  const [rightArrowDown, setRightArrowDown] = useState<boolean>(false);
  const [upArrowDown, setUpArrowDown] = useState<boolean>(false);

  const playerP = useRef<v2f>(
    {
      x: Math.floor((resoWidth - blockWidth) * 0.5),
      y: Math.floor(resoHeight - blockHeight - 10),
    }
  );

  const [playerdP, setPlayerdP] = useState<v2f>({ x: 0, y: 0 });

  const ballP = useRef<v2f>(
    {
      x: Math.floor((resoWidth - ballDims) * 0.5),
      y: Math.floor(resoHeight - ballDims - 60),
    }
  );

  const ballDir = useRef<v2f>({ x: oneOverSqrt2, y: -oneOverSqrt2 });

  const gameHasStarted = useRef<boolean>(false);

  const gameLoop = (timestamp: DOMHighResTimeStamp) => {
    const canvas = canvasRef.current;
    const currentSecs = timestamp / 1000;
    if (timerRef.current === null) {
      timerRef.current = currentSecs;
    }

    const delta = currentSecs - timerRef.current;
    timerRef.current = currentSecs;

    if (canvas) {
      canvas.width = resoWidth;
      canvas.height = resoHeight;
      canvas.style.border = "1px solid black";
      const ctx = canvas.getContext("2d");

      const drag = 0.94;
      const dragSwitch = 0.70;
      let playerX = playerP.current.x + playerdP.x;

      const ddP = 40 * delta;
      let newdPX = playerdP.x;
    
      if (rightArrowDown) {
        if (newdPX < 0) {
          newdPX = (newdPX * dragSwitch + ddP);
        } else {
          newdPX = (newdPX + ddP);
        }
      }
      
      if (leftArrowDown) {
        if (newdPX > 0) {
          newdPX = (newdPX * dragSwitch - ddP);
        } else {
          newdPX = (newdPX - ddP);
        }
      }

      if (upArrowDown) {
        gameHasStarted.current = true;
      }

      newdPX *= drag;

      // TODO: think of a better way for "bounding" on the wall.
      const avoidMultipleBoundHack = 0.4;
      if (newdPX > 0) {
        if (playerX + blockWidth > resoWidth) {
          newdPX *= -avoidMultipleBoundHack;
          playerX = resoWidth - blockWidth;
        }
      } else if (newdPX < 0) {
        if (playerX < 0) {
          newdPX *= -avoidMultipleBoundHack;
          playerX = 0;
        }
      }

      setPlayerdP((prev: v2f) => ({ ...prev, x: newdPX }));
      playerP.current.x = playerX;

      if (!gameHasStarted.current) {
        ballP.current.x = playerX + (blockWidth - ballDims) * 0.5;
        ballP.current.y = playerP.current.y - ballDims - 10;
      } else {
        let newBallX = ballP.current.x + ballDir.current.x * ballSpeed * delta;
        let newBallY = ballP.current.y + ballDir.current.y * ballSpeed * delta;

        const ballAABB: aabb = {
          min: { x: newBallX, y: newBallY },
          max: { x: newBallX + ballDims, y: newBallY + ballDims },
        };

        let hasHitSomething = false;
        for (let row = 0; (row < blockCountPerRow) && !hasHitSomething; row++) {
          for (let col = 0; col < blockCountPerCol; col++) {
            
            const x = col * blockWidth + col * blockGap;
            const y = row * blockHeight + row * blockGap;

            const blockAABB: aabb = {
              min: { x, y },
              max: { x: x + blockWidth, y: y + blockHeight }
            };

            const dirMultiplier = collisionOccured(ballAABB, blockAABB);
            if (dirMultiplier !== null) {
              ballDir.current.x *= dirMultiplier.x;
              ballDir.current.y *= dirMultiplier.y;
              hasHitSomething = true;
              break;
            }
          }
        }

        if (!hasHitSomething) {
          if ((newBallX < 0) || (newBallX + ballDims > resoWidth)) {
            ballDir.current.x *= -1;
          }
        }

        const playerAABB: aabb = {
          min: { x: playerP.current.x, y: playerP.current.y },
          max: { x: playerP.current.x + blockWidth, y: playerP.current.y + blockHeight },
        };
        const dirMultiplier = collisionOccured(playerAABB, ballAABB);
        if (dirMultiplier !== null) {
          ballDir.current.x *= dirMultiplier.x;
          ballDir.current.y *= dirMultiplier.y;
        }

        newBallX = ballP.current.x + ballDir.current.x * ballSpeed * delta;
        newBallY = ballP.current.y + ballDir.current.y * ballSpeed * delta;
        
        ballP.current.x = newBallX;
        ballP.current.y = newBallY;
      }

      if (ctx) {
        ctx.fillStyle = blockColor;
        for (let row = 0; row < blockCountPerRow; row++) {
          for (let col = 0; col < blockCountPerCol; col++) {
            
            ctx.fillRect(col * blockWidth + col * blockGap,
                         row * blockHeight + row * blockGap,
                         blockWidth, blockHeight);
          }
        }

        ctx.fillStyle = "red";
        ctx.fillRect(playerP.current.x, playerP.current.y, blockWidth, blockHeight)

        ctx.fillStyle = "blue";
        roundedRect(ctx, ballP.current, ballDims, ballDims, ballDims * 0.5);
      }
    }
  };

  useEffect(() => {
    const getKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": {
          setUpArrowDown(true);
        } break;

        case "ArrowLeft": {
          setLeftArrowDown(true);
        } break;

        case "ArrowRight": {
          setRightArrowDown(true);
        } break;
      }
    };

    const getKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": {
          setUpArrowDown(false);
        } break;

        case "ArrowLeft": {
          setLeftArrowDown(false);
        } break;

        case "ArrowRight": {
          setRightArrowDown(false);
        } break;
      }
    };
    
    document.addEventListener("keyup", getKeyUp);
    document.addEventListener("keydown", getKeyDown);

    // https://stackoverflow.com/questions/6131051/is-it-possible-to-find-out-what-is-the-monitor-frame-rate-in-javascript
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
    const id = window.requestAnimationFrame(gameLoop);
    return () => {
      document.removeEventListener("keyup", getKeyUp);
      document.removeEventListener("keydown", getKeyDown);
      window.cancelAnimationFrame(id);
    };
  }, [rightArrowDown, leftArrowDown, upArrowDown, playerdP]);

  return (
    <div>
      <h2>Breakout Game</h2>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default Breakout;