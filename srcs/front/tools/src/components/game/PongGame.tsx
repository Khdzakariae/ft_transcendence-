import { useEffect, useRef, useState, useCallback } from "react";

interface GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  player1Y: number;
  player2Y: number;
  player1Score: number;
  player2Score: number;
  isPaused: boolean;
  isGameOver: boolean;
  winner: string | null;
}

interface PongGameProps {
  gameId: string;
  playerId: string;
  opponentId: string;
  playerName: string;
  opponentName: string;
  isPlayer1: boolean;
  onGameEnd: (winner: string, playerScore: number, opponentScore: number) => void;
  onDisconnect: () => void;
  socket: WebSocket | null;
  reconnectAttempts?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 4;

export function PongGame({
  gameId,
  playerId,
  opponentId,
  playerName,
  opponentName,
  isPlayer1,
  onGameEnd,
  onDisconnect,
  socket,
  reconnectAttempts = 0,
}: PongGameProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const isConnectedRef = useRef(true);
  const pauseReasonRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lagWarning, setLagWarning] = useState(false);

  const initialGameState: GameState = {
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelocityX: isPlayer1 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED,
    ballVelocityY: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
    player1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player1Score: 0,
    player2Score: 0,
    isPaused: false,
    isGameOver: false,
    winner: null,
  };

  const gameStateRef = useRef<GameState>(initialGameState);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysPressed.current.add("up");
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysPressed.current.add("down");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysPressed.current.delete("up");
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysPressed.current.delete("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Send paddle position to server
  const sendPaddlePosition = useCallback(
    (y: number) => {
      if (
        socket &&
        socket.readyState === WebSocket.OPEN &&
        !gameState.isPaused &&
        !gameState.isGameOver
      ) {
        socket.send(
          JSON.stringify({
            type: "paddle_move",
            gameId,
            playerId,
            paddleY: y,
            timestamp: Date.now(),
          })
        );
      }
    },
    [socket, gameId, playerId, gameState.isPaused, gameState.isGameOver]
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "game_state":
            const newState = {
              ballX: data.ballX,
              ballY: data.ballY,
              ballVelocityX: data.ballVelocityX,
              ballVelocityY: data.ballVelocityY,
              player1Y: data.player1Y,
              player2Y: data.player2Y,
              player1Score: data.player1Score,
              player2Score: data.player2Score,
              isPaused: data.isPaused || false,
              isGameOver: data.isGameOver || false,
              winner: data.winner || null,
            };
            setGameState((prev) => ({ ...prev, ...newState }));
            gameStateRef.current = { ...gameStateRef.current, ...newState };
            if (data.pauseReason) {
              pauseReasonRef.current = data.pauseReason;
            } else {
              pauseReasonRef.current = null;
            }
            setIsConnected(true);
            isConnectedRef.current = true;
            setLagWarning(false);
            break;

          case "game_over":
            setGameState((prev) => ({
              ...prev,
              isGameOver: true,
              winner: data.winner,
              player1Score: data.player1Score,
              player2Score: data.player2Score,
            }));
            onGameEnd(data.winner, data.player1Score, data.player2Score);
            break;

          case "opponent_disconnected":
            pauseReasonRef.current = "Opponent disconnected. Waiting for reconnection...";
            setGameState((prev) => ({ ...prev, isPaused: true }));
            break;

          case "opponent_reconnected":
            pauseReasonRef.current = null;
            setGameState((prev) => ({ ...prev, isPaused: false }));
            break;

          case "lag_detected":
            setLagWarning(true);
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    const handleClose = () => {
      setIsConnected(false);
      isConnectedRef.current = false;
      pauseReasonRef.current = "Connection lost. Attempting to reconnect...";
      setGameState((prev) => {
        const newState = { ...prev, isPaused: true };
        gameStateRef.current = newState;
        return newState;
      });
    };

    const handleOpen = () => {
      setIsConnected(true);
      isConnectedRef.current = true;
      pauseReasonRef.current = null;
      setGameState((prev) => {
        const newState = { ...prev, isPaused: false };
        gameStateRef.current = newState;
        return newState;
      });
    };

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("open", handleOpen);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("open", handleOpen);
    };
  }, [socket, gameId, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (gameState.isGameOver || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = Date.now();
    let lastPaddleUpdate = 0;
    const PADDLE_UPDATE_THROTTLE = 16; // Throttle paddle updates to ~60fps

    const gameLoop = () => {
      // Use refs to avoid stale closures
      const currentState = gameStateRef.current;
      const currentIsConnected = isConnectedRef.current;
      const currentPauseReason = pauseReasonRef.current;

      // Check if game ended
      if (currentState.isGameOver) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      // Check for lag
      if (deltaTime > 50) {
        setLagWarning(true);
      } else if (deltaTime < 30) {
        setLagWarning(false);
      }

      // Update local paddle position based on input and send to server
      // Server is source of truth, but we update locally for responsiveness
      if (!currentState.isPaused && !currentState.isGameOver && currentIsConnected) {
        const currentPaddleY = isPlayer1 ? currentState.player1Y : currentState.player2Y;
        let newPaddleY = currentPaddleY;

        if (keysPressed.current.has("up")) {
          newPaddleY = Math.max(0, currentPaddleY - PADDLE_SPEED);
        }
        if (keysPressed.current.has("down")) {
          newPaddleY = Math.min(
            CANVAS_HEIGHT - PADDLE_HEIGHT,
            currentPaddleY + PADDLE_SPEED
          );
        }

        // Throttle paddle position updates to prevent spam
        if (newPaddleY !== currentPaddleY && (now - lastPaddleUpdate) >= PADDLE_UPDATE_THROTTLE) {
          lastPaddleUpdate = now;
          sendPaddlePosition(newPaddleY);
          // Optimistically update local state for smooth movement
          // Server will correct this in the next game_state update
          setGameState((prev) => ({
            ...prev,
            [isPlayer1 ? "player1Y" : "player2Y"]: newPaddleY,
          }));
        }
      }

      // Draw game
      
      ctx.fillStyle = "#0B0033";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#00FFFF";
      ctx.fillRect(10, currentState.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(
        CANVAS_WIDTH - 10 - PADDLE_WIDTH,
        currentState.player2Y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.fillStyle = "#FF6B00";
      ctx.beginPath();
      ctx.arc(currentState.ballX, currentState.ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw scores
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "48px Oswald";
      ctx.textAlign = "center";
      ctx.fillText(
        currentState.player1Score.toString(),
        CANVAS_WIDTH / 4,
        60
      );
      ctx.fillText(
        currentState.player2Score.toString(),
        (3 * CANVAS_WIDTH) / 4,
        60
      );

      // Draw player names
      ctx.font = "20px Kanit";
      ctx.fillText(playerName, CANVAS_WIDTH / 4, 90);
      ctx.fillText(opponentName, (3 * CANVAS_WIDTH) / 4, 90);

      // Draw pause overlay
      if (currentState.isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "36px Oswald";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        if (currentPauseReason) {
          ctx.font = "18px Kanit";
          ctx.fillText(
            currentPauseReason,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 20
          );
        }
      }

      // Draw lag warning
      if (lagWarning) {
        ctx.fillStyle = "#FFFF00";
        ctx.font = "16px Kanit";
        ctx.textAlign = "center";
        ctx.fillText(
          "⚠ High Latency Detected",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT - 20
        );
      }

      // Draw connection status
      if (!isConnected) {
        ctx.fillStyle = "#FF0000";
        ctx.font = "16px Kanit";
        ctx.textAlign = "center";
        ctx.fillText(
          "⚠ Disconnected",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT - 50
        );
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    gameState.isGameOver,
    isPlayer1,
    playerName,
    opponentName,
    sendPaddlePosition,
  ]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-primary-btn rounded-lg shadow-2xl"
        />
        {!isConnected && (
          <div className="absolute top-4 left-4 bg-red-500/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
            Reconnecting... ({reconnectAttempts} attempts)
          </div>
        )}
      </div>
      <div className="text-white text-sm font-primary">
        <p className="text-center">
          <span className="text-primary-btn font-bold">Controls:</span> Use{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            ↑
          </kbd>{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            ↓
          </kbd>{" "}
          or{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            W
          </kbd>{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            S
          </kbd>{" "}
          to move your paddle
        </p>
      </div>
    </div>
  );
}

