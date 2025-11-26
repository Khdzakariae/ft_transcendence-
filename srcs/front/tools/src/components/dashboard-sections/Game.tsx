import { UserInter } from "../../interfaces/UserInterfaces";
import { UserDataInter } from "../../interfaces/UserInterfaces";
import {useRef, useEffect} from "react";

export function Game(
	{user, user_data,}: {
		user: UserInter | null;
		user_data: UserDataInter | null;
	}): JSX.Element {
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
    
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
    
      // ---- GAME VARIABLES ----
      const ballRadius = 10;
      let x = canvas.width / 2;
      let y = canvas.height - 30;
      let dx = 2;
      let dy = -2;
    
      const paddleHeight = 10;
      const paddleWidth = 75;
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
      let lives = 300;
    
      // ---- BRICKS ----
      const bricks: { x: number; y: number; status: number }[][] = [];
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
          bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
      }
    
      // ---- DRAW FUNCS *NOW RECEIVE NARROWED canvas & ctx* ----
      function drawPaddle() {
        if (!ctx || !canvas)
          return;
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.closePath();
      }
    
      function drawBall() {
        if (!ctx || !canvas)
          return;
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.closePath();
      }
    
      function drawBricks() {
        if (!ctx || !canvas)
          return ;
        for (let c = 0; c < brickColumnCount; c++) {
          for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
              const brickX = r * (brickWidth + brickPadding) + brickOffsetLeft;
              const brickY = c * (brickHeight + brickPadding) + brickOffsetTop;
    
              bricks[c][r].x = brickX;
              bricks[c][r].y = brickY;
    
              ctx.beginPath();
              ctx.rect(brickX, brickY, brickWidth, brickHeight);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
              ctx.closePath();
            }
          }
        }
      }
    
      function drawScore() {
        if (!ctx || !canvas)
          return;
        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Score: ${score}`, 8, 20);
      }
      function collisionDetection() {
        for(var c=0; c<brickColumnCount; c++) {
            for(var r=0; r<brickRowCount; r++) {
                var b = bricks[c][r];
                if(b.status == 1) {
                    if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                        dy = -dy;
                        b.status = 0;
                        score++;
                        if(score == brickRowCount*brickColumnCount) {
                            alert("YOU WIN, CONGRATS!");
                            //document.location.reload();
                        }
                    }
                }
            }
        }
    }
      function drawLives() {
        if (!ctx || !canvas)
          return;
        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
      }
    
      function draw() {
        if (!ctx || !canvas)
          return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();
        collisionDetection();

      if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
          dx = -dx;
      }
      if(y + dy < ballRadius) {
          dy = -dy;
      }
      else if(y + dy > canvas.height-ballRadius) {
          if(x > paddleX && x < paddleX + paddleWidth) {
              dy = -dy;
          }
          else {
              lives--;
              if(!lives) {
                  alert("GAME OVER");
                  document.location.reload();
              }
              else {
                  x = canvas.width/2;
                  y = canvas.height-30;
                  dx = 2;
                  dy = -2;
                  paddleX = (canvas.width-paddleWidth)/2;
              }
          }
      }

      if(rightPressed && paddleX < canvas.width-paddleWidth) {
          paddleX += 7;
      }
      else if(leftPressed && paddleX > 0) {
          paddleX -= 7;
      }

      x += dx;
      y += dy;    
      requestAnimationFrame(draw);
    }
      draw();
    },[]);
		return (
				<canvas
      	ref={canvasRef}
      	className="
        	block 
        	bg-primary-elements 
        	p-4 sm:p-6 md:p-8
        	rounded-lg 
        	w-full 
        	max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl
        	border border-white/10
    			"/>
		);
	}