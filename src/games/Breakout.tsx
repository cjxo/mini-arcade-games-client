import { useRef, useEffect, useState } from "react";

const resoWidth = 1280;
const resoHeight = 600;

const blockCountPerRow = 10;
const blockCountPerCol = 4;
const blockColor = "green";
const blockGap = 2;
const blockWidth = Math.floor(resoWidth / blockCountPerRow);
const blockHeight = 32;
const ballDims = 20;

interface v2f {
  x: number;
  y: number;
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
  const playerP = useRef<v2f>(
    {
      x: Math.floor((resoWidth - blockWidth) * 0.5),
      y: Math.floor(resoHeight - blockHeight - 10),
    }
  );

  const [playerdP, setPlayerdP] = useState<v2f>(
    {
      x: 0,
      y: 0,
    }
  );

  const ballP = useRef<v2f>(
    {
      x: Math.floor((resoWidth - ballDims) * 0.5),
      y: Math.floor(resoHeight - ballDims - 60),
    }
  );

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

      if (ctx) {
        ctx.fillStyle = blockColor;
        for (let row = 0; row < blockCountPerCol; row++) {
          for (let col = 0; col < blockCountPerRow; col++) {
            
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
      if (e.key === "ArrowLeft") {
        setLeftArrowDown(true);
      } else if (e.key === "ArrowRight") {
        setRightArrowDown(true);
      }
    };

    const getKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLeftArrowDown(false);
      } else if (e.key === "ArrowRight") {
        setRightArrowDown(false);
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
  }, [rightArrowDown, leftArrowDown, playerdP]);

  return (
    <div>
      <h2>Breakout Game</h2>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default Breakout;