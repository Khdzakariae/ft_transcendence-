import { randomUUID } from "crypto";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const BALL_SPEED = 4;
const WINNING_SCORE = 11;
const GAME_UPDATE_INTERVAL = 16; // ~60 FPS

export class GameManager {
  constructor() {
    this.queue = [];
    this.games = new Map(); // gameId -> Game
    this.users = new Map(); // userId -> { ws, userName, gameId }
    this.spectators = new Map(); // gameId -> Set of { ws, userId }
    this.gameUpdateIntervals = new Map(); // gameId -> intervalId
  }

  addUser(ws, userId, userName) {
    this.users.set(userId, { ws, userName, gameId: null });
  }

  joinQueue(userId, userName) {
    const user = this.users.get(userId);
    if (!user) {
      console.log(`User ${userId} not found when trying to join queue`);
      return;
    }

    // Remove from queue if already there
    this.leaveQueue(userId);

    // If user is already in a game, reconnect them instead of blocking
    if (user.gameId) {
      const game = this.games.get(user.gameId);
      if (!game) {
        // Game no longer exists, clear the reference
        user.gameId = null;
        // Continue to join queue
      } else if (game.isGameOver) {
        // Game is over, clear the reference
        user.gameId = null;
        // Continue to join queue
      } else {
        // User is in an active game - reconnect them
        const userWs = this.users.get(userId)?.ws;
        if (!userWs || userWs.readyState !== 1) {
          // WebSocket not ready, can't reconnect yet
          if (userWs) {
            userWs.send(
              JSON.stringify({
                type: "error",
                message: "Connection not ready. Please wait for reconnection.",
              })
            );
          }
          return;
        }

        // Determine opponent info
        const isPlayer1 = game.player1.userId === userId;
        const opponent = isPlayer1 ? game.player2 : game.player1;

        // Send match_found to reconnect user to their game
        try {
          userWs.send(
            JSON.stringify({
              type: "match_found",
              gameId: user.gameId,
              opponentId: opponent.userId,
              opponentName: opponent.userName,
              isPlayer1: isPlayer1,
            })
          );

          // Resume game if it was paused due to disconnect
          if (game.isPaused && game.pauseReason === "Opponent disconnected. Waiting for reconnection...") {
            game.isPaused = false;
            game.pauseReason = null;
            if (game.disconnectTimeout) {
              clearTimeout(game.disconnectTimeout);
              game.disconnectTimeout = null;
            }

            // Notify opponent
            const opponentUser = this.users.get(opponent.userId);
            if (opponentUser && opponentUser.ws && opponentUser.ws.readyState === 1) {
              opponentUser.ws.send(
                JSON.stringify({
                  type: "opponent_reconnected",
                  gameId: user.gameId,
                })
              );
            }
          }

          // Send current game state
          setTimeout(() => {
            if (userWs && userWs.readyState === 1) {
              this.broadcastGameState(user.gameId);
            }
          }, 100);

          console.log(`Reconnected user ${userName} (${userId}) to game ${user.gameId}`);
          return;
        } catch (err) {
          console.error(`Error reconnecting user to game:`, err);
          if (userWs && userWs.readyState === 1) {
            userWs.send(
              JSON.stringify({
                type: "error",
                message: "Failed to reconnect to game. Please try again.",
              })
            );
          }
          return;
        }
      }
    }

    // Get fresh WebSocket reference
    const userWs = this.users.get(userId)?.ws;
    if (!userWs || userWs.readyState !== 1) {
      console.log(`User ${userId} WebSocket not ready when trying to join queue`);
      if (userWs) {
        userWs.send(
          JSON.stringify({
            type: "error",
            message: "Connection not ready. Please try again.",
          })
        );
      }
      return;
    }

    this.queue.push({ userId, userName, ws: userWs });
    console.log(`User ${userName} (${userId}) joined queue. Queue length: ${this.queue.length}`);

    // Try to match players
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift();
      const player2 = this.queue.shift();
      console.log(`Matching ${player1.userName} with ${player2.userName}`);
      this.createGame(player1, player2);
    } else {
      // Send queue update confirmation
      if (user.ws && user.ws.readyState === 1) {
        user.ws.send(
          JSON.stringify({
            type: "queue_update",
            queueLength: this.queue.length,
          })
        );
      }
    }
  }

  leaveQueue(userId) {
    const beforeLength = this.queue.length;
    this.queue = this.queue.filter((p) => p.userId !== userId);
    if (beforeLength !== this.queue.length) {
      console.log(`User ${userId} left queue. Queue length: ${this.queue.length}`);
    }
  }

  createGame(player1, player2) {
    // Validate both players have valid WebSockets
    if (!player1.ws || player1.ws.readyState !== 1) {
      console.error(`Player1 ${player1.userId} WebSocket not ready`);
      // Put player2 back in queue
      this.queue.push(player2);
      return;
    }
    if (!player2.ws || player2.ws.readyState !== 1) {
      console.error(`Player2 ${player2.userId} WebSocket not ready`);
      // Put player1 back in queue
      this.queue.push(player1);
      return;
    }

    const gameId = randomUUID();
    const game = new Game(gameId, player1, player2);

    this.games.set(gameId, game);

    // Update user game references
    const user1 = this.users.get(player1.userId);
    const user2 = this.users.get(player2.userId);
    if (user1) user1.gameId = gameId;
    if (user2) user2.gameId = gameId;

    // Notify players
    try {
      if (player1.ws && player1.ws.readyState === 1) {
        player1.ws.send(
          JSON.stringify({
            type: "match_found",
            gameId,
            opponentId: player2.userId,
            opponentName: player2.userName,
            isPlayer1: true,
          })
        );
        console.log(`Sent match_found to ${player1.userName}`);
      }
    } catch (err) {
      console.error(`Error sending match_found to player1:`, err);
    }

    try {
      if (player2.ws && player2.ws.readyState === 1) {
        player2.ws.send(
          JSON.stringify({
            type: "match_found",
            gameId,
            opponentId: player1.userId,
            opponentName: player1.userName,
            isPlayer1: false,
          })
        );
        console.log(`Sent match_found to ${player2.userName}`);
      }
    } catch (err) {
      console.error(`Error sending match_found to player2:`, err);
    }

    // Notify spectators about new game
    this.broadcastToAll({
      type: "game_started",
      gameId,
      player1Id: player1.userId,
      player1Name: player1.userName,
      player2Id: player2.userId,
      player2Name: player2.userName,
    });

    // Start game loop
    this.startGameLoop(gameId);
  }

  startGameLoop(gameId) {
    // Clear any existing interval for this game
    const existingInterval = this.gameUpdateIntervals.get(gameId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const game = this.games.get(gameId);
      if (!game) {
        clearInterval(interval);
        this.gameUpdateIntervals.delete(gameId);
        return;
      }

      if (game.isGameOver) {
        clearInterval(interval);
        this.gameUpdateIntervals.delete(gameId);
        // End game if not already ended
        if (!game.isPaused || game.pauseReason !== "Game Over") {
          this.endGame(gameId);
        }
        return;
      }

      if (!game.isPaused) {
        game.update();
      }

      // Broadcast game state to players
      this.broadcastGameState(gameId);

      // Check for game over after update
      if (game.isGameOver) {
        clearInterval(interval);
        this.gameUpdateIntervals.delete(gameId);
        this.endGame(gameId);
      }
    }, GAME_UPDATE_INTERVAL);

    this.gameUpdateIntervals.set(gameId, interval);
  }

  broadcastGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const state = {
      type: "game_state",
      gameId,
      ballX: game.ballX,
      ballY: game.ballY,
      ballVelocityX: game.ballVelocityX,
      ballVelocityY: game.ballVelocityY,
      player1Y: game.player1Y,
      player2Y: game.player2Y,
      player1Score: game.player1Score,
      player2Score: game.player2Score,
      isPaused: game.isPaused,
      isGameOver: game.isGameOver,
      pauseReason: game.pauseReason,
    };

    // Send to players
    const user1 = this.users.get(game.player1.userId);
    const user2 = this.users.get(game.player2.userId);
    if (user1 && user1.ws && user1.ws.readyState === 1) {
      user1.ws.send(JSON.stringify(state));
    }
    if (user2 && user2.ws && user2.ws.readyState === 1) {
      user2.ws.send(JSON.stringify(state));
    }

    // Send to spectators
    const spectators = this.spectators.get(gameId);
    if (spectators) {
      spectators.forEach((spectator) => {
        if (spectator.ws && spectator.ws.readyState === 1) {
          try {
            spectator.ws.send(JSON.stringify(state));
          } catch (err) {
            console.error(`Error sending to spectator ${spectator.userId}:`, err);
          }
        }
      });
    }
  }

  updatePaddlePosition(gameId, userId, paddleY) {
    const game = this.games.get(gameId);
    if (!game || game.isPaused || game.isGameOver) return;

    // Validate and clamp paddle position
    if (typeof paddleY !== 'number' || isNaN(paddleY) || !isFinite(paddleY)) {
      return; // Invalid input
    }
    
    const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddleY));
    
    if (game.player1.userId === userId) {
      game.player1Y = clampedY;
    } else if (game.player2.userId === userId) {
      game.player2Y = clampedY;
    }
  }

  leaveGame(gameId, userId) {
    const user = this.users.get(userId);
    if (!user) return;

    const game = this.games.get(gameId);
    if (!game) {
      // Game doesn't exist, just clear the user's gameId
      user.gameId = null;
      return;
    }

    // Check if user is actually in this game
    if (game.player1.userId !== userId && game.player2.userId !== userId) {
      // User is not in this game, just clear their gameId if it was set incorrectly
      if (user.gameId === gameId) {
        user.gameId = null;
      }
      return;
    }

    // Clear user's gameId
    user.gameId = null;

    // If game is not over, end it with the opponent as winner
    if (!game.isGameOver) {
      const winnerId = game.player1.userId === userId 
        ? game.player2.userId 
        : game.player1.userId;
      this.endGame(gameId, winnerId);
    }
  }

  handleDisconnect(userId) {
    const user = this.users.get(userId);
    if (!user) return;

    // If user is in a game, pause it
    if (user.gameId) {
      const game = this.games.get(user.gameId);
      if (game && !game.isGameOver && !game.isPaused) {
        game.isPaused = true;
        game.pauseReason = "Opponent disconnected. Waiting for reconnection...";

        // Notify opponent
        const opponentId =
          game.player1.userId === userId
            ? game.player2.userId
            : game.player1.userId;
        const opponent = this.users.get(opponentId);
        if (opponent && opponent.ws && opponent.ws.readyState === 1) {
          opponent.ws.send(
            JSON.stringify({
              type: "opponent_disconnected",
              gameId: user.gameId,
            })
          );
        }

        // Set timeout to end game if not reconnected
        if (game.disconnectTimeout) {
          clearTimeout(game.disconnectTimeout);
        }
        game.disconnectTimeout = setTimeout(() => {
          const currentGame = this.games.get(user.gameId);
          if (currentGame && currentGame.isPaused && !currentGame.isGameOver) {
            // Forfeit game
            const winnerId =
              currentGame.player1.userId === userId
                ? currentGame.player2.userId
                : currentGame.player1.userId;
            this.endGame(user.gameId, winnerId);
          }
        }, 30000); // 30 seconds timeout
      }
    }

    // Remove from queue
    this.leaveQueue(userId);
    
    // Remove user but keep gameId reference for reconnection
    // Don't delete user completely, just mark WS as disconnected
    user.ws = null;
  }

  endGame(gameId, winnerId = null) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Prevent multiple endGame calls
    if (game.isGameOver) return;

    game.isGameOver = true;
    game.isPaused = true;
    game.pauseReason = "Game Over";

    // Clear disconnect timeout if exists
    if (game.disconnectTimeout) {
      clearTimeout(game.disconnectTimeout);
      game.disconnectTimeout = null;
    }

    // Stop game loop
    const interval = this.gameUpdateIntervals.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.gameUpdateIntervals.delete(gameId);
    }

    // Determine winner
    let winner = null;
    let winnerName = null;
    if (winnerId) {
      winner = winnerId === game.player1.userId ? game.player1 : game.player2;
      winnerName = winner.userName;
    } else if (game.player1Score >= WINNING_SCORE) {
      winner = game.player1;
      winnerName = game.player1.userName;
    } else if (game.player2Score >= WINNING_SCORE) {
      winner = game.player2;
      winnerName = game.player2.userName;
    }

    const endGameData = {
      type: "game_over",
      gameId,
      winner: winnerName || "Draw",
      player1Score: game.player1Score,
      player2Score: game.player2Score,
    };

    // Clear gameId from users immediately when game ends
    const user1 = this.users.get(game.player1.userId);
    const user2 = this.users.get(game.player2.userId);
    if (user1) {
      user1.gameId = null;
    }
    if (user2) {
      user2.gameId = null;
    }

    // Notify players
    if (user1 && user1.ws && user1.ws.readyState === 1) {
      user1.ws.send(JSON.stringify(endGameData));
    }
    if (user2 && user2.ws && user2.ws.readyState === 1) {
      user2.ws.send(JSON.stringify(endGameData));
    }

    // Notify spectators
    const spectators = this.spectators.get(gameId);
    if (spectators) {
      spectators.forEach((spectator) => {
        if (spectator.ws && spectator.ws.readyState === 1) {
          try {
            spectator.ws.send(JSON.stringify(endGameData));
          } catch (err) {
            console.error(`Error sending game_over to spectator ${spectator.userId}:`, err);
          }
        }
      });
    }

    // Notify all about game ending
    this.broadcastToAll({
      type: "game_ended",
      gameId,
    });

    // Clean up game data after delay (gameId already cleared above)
    setTimeout(() => {
      this.games.delete(gameId);
      this.spectators.delete(gameId);
    }, 60000); // Keep game data for 1 minute after end
  }

  addSpectator(gameId, ws, userId) {
    if (!this.spectators.has(gameId)) {
      this.spectators.set(gameId, new Set());
    }
    this.spectators.get(gameId).add({ ws, userId });
  }

  removeSpectator(gameId, userId) {
    const spectators = this.spectators.get(gameId);
    if (spectators) {
      for (const spectator of spectators) {
        if (spectator.userId === userId) {
          spectators.delete(spectator);
          break;
        }
      }
    }
  }

  broadcastToAll(message) {
    // Broadcast to all connected users (for live games list)
    this.users.forEach((user) => {
      if (user.ws && user.ws.readyState === 1) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }
}

class Game {
  constructor(gameId, player1, player2) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.ballX = CANVAS_WIDTH / 2;
    this.ballY = CANVAS_HEIGHT / 2;
    this.ballVelocityX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    this.ballVelocityY = (Math.random() - 0.5) * BALL_SPEED;
    this.player1Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.player2Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.player1Score = 0;
    this.player2Score = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.pauseReason = null;
    this.disconnectTimeout = null;
  }

  update() {
    // Update ball position
    this.ballX += this.ballVelocityX;
    this.ballY += this.ballVelocityY;

    // Ball collision with top/bottom walls
    if (this.ballY - BALL_SIZE <= 0) {
      this.ballY = BALL_SIZE;
      this.ballVelocityY = Math.abs(this.ballVelocityY);
    } else if (this.ballY + BALL_SIZE >= CANVAS_HEIGHT) {
      this.ballY = CANVAS_HEIGHT - BALL_SIZE;
      this.ballVelocityY = -Math.abs(this.ballVelocityY);
    }

    // Ball collision with left paddle (player1) - improved collision detection
    const paddle1Left = 10;
    const paddle1Right = paddle1Left + PADDLE_WIDTH;
    const paddle1Top = this.player1Y;
    const paddle1Bottom = this.player1Y + PADDLE_HEIGHT;
    
    if (
      this.ballVelocityX < 0 &&
      this.ballX - BALL_SIZE <= paddle1Right &&
      this.ballX - BALL_SIZE >= paddle1Left - 5 && // Allow some overlap for smoother collision
      this.ballY + BALL_SIZE >= paddle1Top &&
      this.ballY - BALL_SIZE <= paddle1Bottom
    ) {
      // Prevent ball from going through paddle
      this.ballX = paddle1Right + BALL_SIZE;
      this.ballVelocityX = Math.abs(this.ballVelocityX);
      // Ensure minimum speed
      if (Math.abs(this.ballVelocityX) < BALL_SPEED) {
        this.ballVelocityX = this.ballVelocityX > 0 ? BALL_SPEED : -BALL_SPEED;
      }
      // Add some spin based on where ball hits paddle
      const hitPos = Math.max(0, Math.min(1, (this.ballY - paddle1Top) / PADDLE_HEIGHT));
      this.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
      // Clamp velocity to prevent too extreme angles
      this.ballVelocityY = Math.max(-BALL_SPEED * 1.5, Math.min(BALL_SPEED * 1.5, this.ballVelocityY));
    }

    // Ball collision with right paddle (player2) - improved collision detection
    const paddle2Right = CANVAS_WIDTH - 10;
    const paddle2Left = paddle2Right - PADDLE_WIDTH;
    const paddle2Top = this.player2Y;
    const paddle2Bottom = this.player2Y + PADDLE_HEIGHT;
    
    if (
      this.ballVelocityX > 0 &&
      this.ballX + BALL_SIZE >= paddle2Left &&
      this.ballX + BALL_SIZE <= paddle2Right + 5 && // Allow some overlap for smoother collision
      this.ballY + BALL_SIZE >= paddle2Top &&
      this.ballY - BALL_SIZE <= paddle2Bottom
    ) {
      // Prevent ball from going through paddle
      this.ballX = paddle2Left - BALL_SIZE;
      this.ballVelocityX = -Math.abs(this.ballVelocityX);
      // Ensure minimum speed
      if (Math.abs(this.ballVelocityX) < BALL_SPEED) {
        this.ballVelocityX = this.ballVelocityX > 0 ? BALL_SPEED : -BALL_SPEED;
      }
      // Add some spin based on where ball hits paddle
      const hitPos = Math.max(0, Math.min(1, (this.ballY - paddle2Top) / PADDLE_HEIGHT));
      this.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
      // Clamp velocity to prevent too extreme angles
      this.ballVelocityY = Math.max(-BALL_SPEED * 1.5, Math.min(BALL_SPEED * 1.5, this.ballVelocityY));
    }

    // Ball out of bounds - score
    if (this.ballX - BALL_SIZE < 0) {
      this.player2Score++;
      this.resetBall();
    } else if (this.ballX + BALL_SIZE > CANVAS_WIDTH) {
      this.player1Score++;
      this.resetBall();
    }

    // Check for winner
    if (this.player1Score >= WINNING_SCORE || this.player2Score >= WINNING_SCORE) {
      this.isGameOver = true;
    }
  }

  resetBall() {
    this.ballX = CANVAS_WIDTH / 2;
    this.ballY = CANVAS_HEIGHT / 2;
    // Randomize direction but ensure minimum speed
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.ballVelocityX = BALL_SPEED * direction;
    this.ballVelocityY = (Math.random() - 0.5) * BALL_SPEED;
    // Ensure ball doesn't get stuck with zero velocity
    if (Math.abs(this.ballVelocityY) < 0.5) {
      this.ballVelocityY = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED * 0.5;
    }
  }
}

