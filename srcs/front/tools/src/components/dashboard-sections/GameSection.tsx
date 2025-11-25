import { UserInter } from "../../interfaces/UserInterfaces";
import { useEffect, useRef } from "react";

export function GameSection({ user }: { user: UserInter | null }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    
    const canvas = canvasEl as HTMLCanvasElement; // safe
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    // Game variables
    let ballRadius = 10;
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 2;
    let dy = -2;

    let paddleHeight = 10;
    let paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let rightPressed = false;
    let leftPressed = false;

    const brickRowCount = 5;
    const brickColumnCount = 3;
    const brickWidth = 75;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    let score = 0;
    let lives = 3;

    // Brick type
    interface Brick {
      x: number;
      y: number;
      status: number;
    }

    const bricks: Brick[][] = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

    // Event handlers
    function keyDownHandler(e: KeyboardEvent) {
      if (e.code === "ArrowRight") rightPressed = true;
      else if (e.code === "ArrowLeft") leftPressed = true;
    }

    function keyUpHandler(e: KeyboardEvent) {
      if (e.code === "ArrowRight") rightPressed = false;
      else if (e.code === "ArrowLeft") leftPressed = false;
    }

    function mouseMoveHandler(e: MouseEvent) {
      const relativeX = e.clientX - canvas.offsetLeft;
      if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
      }
    }

    // Drawing functions
    function collisionDetection() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            if (
              x > b.x &&
              x < b.x + brickWidth &&
              y > b.y &&
              y < b.y + brickHeight
            ) {
              dy = -dy;
              b.status = 0;
              score++;

              if (score === brickRowCount * brickColumnCount) {
                alert("YOU WIN, CONGRATS!");
                document.location.reload();
              }
            }
          }
        }
      }
    }

    function drawBall() {
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }

    function drawPaddle() {
      ctx.beginPath();
      ctx.rect(canvas.width - canvas.width, canvas.height - paddleHeight, canvas.width, paddleHeight);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }

    function drawBricks() {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = r * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = c * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;

            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    function drawScore() {
      ctx.font = "16px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.fillText(`Score: ${score}`, 8, 20);
    }

    function drawLives() {
      ctx.font = "16px Arial";
      ctx.fillStyle = "#0095DD";
      ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBricks();
      drawBall();
      drawPaddle();
      drawScore();
      drawLives();
      collisionDetection();

      if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
      if (y + dy < ballRadius) dy = -dy;
      else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) dy = -dy;
        else {
          lives--;
          if (!lives) {
            alert("GAME OVER");
            document.location.reload();
          } else {
            x = canvas.width / 2;
            y = canvas.height - 30;
            dx = 2;
            dy = -2;
            paddleX = (canvas.width - paddleWidth) / 2;
          }
        }
      }

      if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
      else if (leftPressed && paddleX > 0) paddleX -= 7;

      x += dx;
      y += dy;

      requestAnimationFrame(draw);
    }

    // Attach event listeners
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    document.addEventListener("mousemove", mouseMoveHandler);

    draw();

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <canvas ref={canvasRef} width={400} height={400} />
    </div>
  );
}
