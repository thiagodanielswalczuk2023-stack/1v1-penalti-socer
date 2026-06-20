const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const FIELD_TOP = 60;
const FIELD_BOTTOM = 240;

const game = {
    playerScore: 0,
    aiScore: 0,
    gameState: 'idle', // idle, attacking, defending
    round: 0,
    isPlayerAttacking: true,
    
    // Ball
    ball: {
        x: GAME_WIDTH / 2,
        y: FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2,
        radius: 5,
        vx: 0,
        vy: 0
    },
    
    // Player goalkeeper (defending)
    playerGoalkeeper: {
        x: GAME_WIDTH - 30,
        y: FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2,
        width: 20,
        height: 40
    },
    
    // AI goalkeeper (defending)
    aiGoalkeeper: {
        x: 30,
        y: FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2,
        width: 20,
        height: 40
    },
    
    // Penalty spots
    playerPenaltySpot: { x: GAME_WIDTH - 80, y: FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2 },
    aiPenaltySpot: { x: 80, y: FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2 },
    
    start() {
        this.gameState = 'attacking';
        this.isPlayerAttacking = Math.random() > 0.5;
        this.ball.x = this.isPlayerAttacking ? this.playerPenaltySpot.x : this.aiPenaltySpot.x;
        this.ball.y = this.isPlayerAttacking ? this.playerPenaltySpot.y : this.aiPenaltySpot.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        
        // Reset goalkeepers
        this.playerGoalkeeper.y = FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2;
        this.aiGoalkeeper.y = FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) / 2;
        
        this.updateStatus('Click to aim your shot!');
        this.draw();
    },
    
    reset() {
        this.playerScore = 0;
        this.aiScore = 0;
        document.getElementById('playerScore').textContent = '0';
        document.getElementById('aiScore').textContent = '0';
        this.gameState = 'idle';
        this.updateStatus('Click "Start Game" to begin!');
        this.draw();
    },
    
    update() {
        if (this.gameState === 'idle') return;
        
        // Update ball physics
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Apply friction
        this.ball.vx *= 0.98;
        this.ball.vy *= 0.98;
        
        // Check ball boundaries (field limits)
        if (this.ball.y < FIELD_TOP) this.ball.y = FIELD_TOP;
        if (this.ball.y > FIELD_BOTTOM) this.ball.y = FIELD_BOTTOM;
        
        // Check for goal (ball reaches goal line)
        if (this.ball.x < 10 && this.isPlayerAttacking) {
            // Check if goalie blocks
            if (this.ball.y >= this.aiGoalkeeper.y - this.aiGoalkeeper.height / 2 &&
                this.ball.y <= this.aiGoalkeeper.y + this.aiGoalkeeper.height / 2) {
                this.updateStatus('BLOCKED by AI goalkeeper!');
            } else {
                this.playerScore++;
                document.getElementById('playerScore').textContent = this.playerScore;
                this.updateStatus('⚽ GOOOAL! Player scores!');
            }
            this.endRound();
        }
        
        if (this.ball.x > GAME_WIDTH - 10 && !this.isPlayerAttacking) {
            // Check if goalie blocks
            if (this.ball.y >= this.playerGoalkeeper.y - this.playerGoalkeeper.height / 2 &&
                this.ball.y <= this.playerGoalkeeper.y + this.playerGoalkeeper.height / 2) {
                this.updateStatus('You blocked the AI shot!');
            } else {
                this.aiScore++;
                document.getElementById('aiScore').textContent = this.aiScore;
                this.updateStatus('⚽ AI scores!');
            }
            this.endRound();
        }
        
        // Ball out of bounds (sides)
        if (this.ball.x < 0 || this.ball.x > GAME_WIDTH) {
            this.updateStatus('Shot missed!');
            this.endRound();
        }
        
        // Check for winner
        if (this.playerScore >= 5) {
            this.updateStatus('🏆 PLAYER WINS! 🏆');
            this.gameState = 'idle';
        }
        if (this.aiScore >= 5) {
            this.updateStatus('🤖 AI WINS! 🤖');
            this.gameState = 'idle';
        }
    },
    
    endRound() {
        setTimeout(() => {
            if (this.playerScore < 5 && this.aiScore < 5) {
                this.isPlayerAttacking = !this.isPlayerAttacking;
                this.start();
                
                // AI shoots
                if (!this.isPlayerAttacking) {
                    setTimeout(() => this.aiShoot(), 500);
                }
            } else {
                this.gameState = 'idle';
            }
        }, 1500);
    },
    
    aiShoot() {
        const targetY = FIELD_TOP + Math.random() * (FIELD_BOTTOM - FIELD_TOP);
        const dx = this.playerPenaltySpot.x - this.ball.x;
        const dy = targetY - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.ball.vx = (dx / distance) * 5;
        this.ball.vy = (dy / distance) * 5;
    },
    
    draw() {
        // Clear canvas
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw field
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(0, FIELD_TOP, GAME_WIDTH, FIELD_BOTTOM - FIELD_TOP);
        
        // Draw center line
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH / 2, FIELD_TOP);
        ctx.lineTo(GAME_WIDTH / 2, FIELD_BOTTOM);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw goal areas
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, FIELD_TOP + 40, 40, FIELD_BOTTOM - FIELD_TOP - 80);
        ctx.strokeRect(GAME_WIDTH - 45, FIELD_TOP + 40, 40, FIELD_BOTTOM - FIELD_TOP - 80);
        
        // Draw penalty spots
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.playerPenaltySpot.x - 2, this.playerPenaltySpot.y - 2, 4, 4);
        ctx.fillRect(this.aiPenaltySpot.x - 2, this.aiPenaltySpot.y - 2, 4, 4);
        
        // Draw ball
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player goalkeeper (right side)
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(this.playerGoalkeeper.x - this.playerGoalkeeper.width / 2,
                     this.playerGoalkeeper.y - this.playerGoalkeeper.height / 2,
                     this.playerGoalkeeper.width,
                     this.playerGoalkeeper.height);
        
        // Draw AI goalkeeper (left side)
        ctx.fillStyle = '#FF3333';
        ctx.fillRect(this.aiGoalkeeper.x - this.aiGoalkeeper.width / 2,
                     this.aiGoalkeeper.y - this.aiGoalkeeper.height / 2,
                     this.aiGoalkeeper.width,
                     this.aiGoalkeeper.height);
        
        // Draw game state text
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        if (this.isPlayerAttacking) {
            ctx.fillText('YOUR TURN - SHOOT!', 10, 30);
        } else {
            ctx.fillText('AI IS SHOOTING - DEFEND!', 10, 30);
        }
    },
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }
};

// Click handler for shooting and defending
canvas.addEventListener('click', (e) => {
    if (game.gameState !== 'attacking' && game.gameState !== 'defending') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (game.isPlayerAttacking) {
        // Player is shooting
        const dx = x - game.ball.x;
        const dy = y - game.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        game.ball.vx = (dx / distance) * 5;
        game.ball.vy = (dy / distance) * 5;
        game.gameState = 'defending';
    } else {
        // Player is defending (moving goalkeeper)
        game.playerGoalkeeper.y = Math.max(FIELD_TOP + game.playerGoalkeeper.height / 2,
                                          Math.min(FIELD_BOTTOM - game.playerGoalkeeper.height / 2, y));
    }
});

// Game loop
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Start game loop
gameLoop();
game.draw();