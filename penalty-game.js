const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

// Set canvas to full screen resolution
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 20 Countries with flags, names, and colors
const COUNTRIES = [
    { name: 'Brazil', flag: '🇧🇷', primary: '#FFD700', secondary: '#009B3A', jersey: '💛' },
    { name: 'France', flag: '🇫🇷', primary: '#002395', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Germany', flag: '🇩🇪', primary: '#000000', secondary: '#DD0000', jersey: '👕' },
    { name: 'Argentina', flag: '🇦🇷', primary: '#74B9FF', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Spain', flag: '🇪🇸', primary: '#C60B1E', secondary: '#FFC400', jersey: '👕' },
    { name: 'Italy', flag: '🇮🇹', primary: '#009246', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'England', flag: '🇬🇧', primary: '#FFFFFF', secondary: '#C8102E', jersey: '👕' },
    { name: 'Portugal', flag: '🇵🇹', primary: '#006600', secondary: '#FF0000', jersey: '👕' },
    { name: 'Japan', flag: '🇯🇵', primary: '#FFFFFF', secondary: '#BC002D', jersey: '👕' },
    { name: 'Mexico', flag: '🇲🇽', primary: '#006847', secondary: '#CE1126', jersey: '👕' },
    { name: 'Netherlands', flag: '🇳🇱', primary: '#FF6600', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Belgium', flag: '🇧🇪', primary: '#000000', secondary: '#FFD700', jersey: '👕' },
    { name: 'Russia', flag: '🇷🇺', primary: '#FFFFFF', secondary: '#0039A6', jersey: '👕' },
    { name: 'Colombia', flag: '🇨🇴', primary: '#FFD100', secondary: '#003087', jersey: '👕' },
    { name: 'Egypt', flag: '🇪🇬', primary: '#FFFFFF', secondary: '#CE1126', jersey: '👕' },
    { name: 'South Korea', flag: '🇰🇷', primary: '#C60C30', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Australia', flag: '🇦🇺', primary: '#00008B', secondary: '#FFD700', jersey: '👕' },
    { name: 'Greece', flag: '🇬🇷', primary: '#0D47A1', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Uruguay', flag: '🇺🇾', primary: '#001695', secondary: '#FFFFFF', jersey: '👕' },
    { name: 'Poland', flag: '🇵🇱', primary: '#FFFFFF', secondary: '#DC143C', jersey: '👕' }
];

const game = {
    // Game state
    gameState: 'idle', // idle, aiming, shooting, defending, goal, ended
    playerScore: 0,
    aiScore: 0,
    isPlayerAttacking: true,
    
    // Countries
    playerCountry: COUNTRIES[0],
    aiCountry: COUNTRIES[1],
    
    // Shooting mechanics
    power: 0,
    aimAngle: 0,
    maxPowerReached: false,
    
    // Field dimensions
    fieldWidth: 0,
    fieldHeight: 0,
    goalWidth: 0,
    goalHeight: 0,
    
    // Ball
    ball: {
        x: 0,
        y: 0,
        radius: 15,
        vx: 0,
        vy: 0,
        spin: 0
    },
    
    // Goalkeeper
    goalkeeper: {
        x: 0,
        y: 0,
        width: 40,
        height: 80,
        reactionTime: 0,
        targetY: 0,
        isDiving: false,
        diveDirection: 0
    },
    
    // Penalty spot
    penaltySpotX: 0,
    penaltySpotY: 0,
    
    // Mouse position
    mouseX: 0,
    mouseY: 0,
    
    init() {
        this.fieldWidth = canvas.width * 0.8;
        this.fieldHeight = canvas.height * 0.7;
        this.goalWidth = this.fieldHeight * 0.3;
        this.goalHeight = this.fieldHeight * 0.4;
        this.penaltySpotX = canvas.width * 0.25;
        this.penaltySpotY = canvas.height * 0.5;
        
        this.randomizeCountries();
        this.reset();
    },
    
    randomizeCountries() {
        const idx1 = Math.floor(Math.random() * COUNTRIES.length);
        let idx2 = Math.floor(Math.random() * COUNTRIES.length);
        while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * COUNTRIES.length);
        }
        
        this.playerCountry = COUNTRIES[idx1];
        this.aiCountry = COUNTRIES[idx2];
        
        // Update UI
        document.getElementById('playerFlag').textContent = this.playerCountry.flag;
        document.getElementById('playerName').textContent = this.playerCountry.name;
        document.getElementById('aiFlag').textContent = this.aiCountry.flag;
        document.getElementById('aiName').textContent = this.aiCountry.name;
        
        this.showMessage(`${this.playerCountry.name} vs ${this.aiCountry.name}`);
    },
    
    start() {
        this.playerScore = 0;
        this.aiScore = 0;
        document.getElementById('playerScore').textContent = '0';
        document.getElementById('aiScore').textContent = '0';
        document.getElementById('controls').style.display = 'none';
        this.isPlayerAttacking = true;
        this.nextRound();
    },
    
    nextRound() {
        this.gameState = this.isPlayerAttacking ? 'aiming' : 'defending';
        this.power = 0;
        this.aimAngle = 0;
        this.maxPowerReached = false;
        
        this.ball.x = this.penaltySpotX;
        this.ball.y = this.penaltySpotY;
        this.ball.vx = 0;
        this.ball.vy = 0;
        
        this.goalkeeper.x = canvas.width * 0.75;
        this.goalkeeper.y = this.penaltySpotY;
        this.goalkeeper.isDiving = false;
        this.goalkeeper.reactionTime = 0.3 + Math.random() * 0.2;
        
        if (!this.isPlayerAttacking) {
            setTimeout(() => this.aiShoot(), 1000);
        }
    },
    
    update() {
        if (this.gameState === 'shooting') {
            // Update ball position
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // Apply gravity and air resistance
            this.ball.vy += 0.3; // gravity
            this.ball.vx *= 0.98;
            this.ball.vy *= 0.98;
            
            // Apply spin
            this.ball.vx += Math.sin(this.ball.spin) * 0.1;
            
            // Boundary checks
            if (this.ball.y + this.ball.radius > canvas.height * 0.85) {
                this.ball.y = canvas.height * 0.85 - this.ball.radius;
                this.ball.vy *= -0.5;
            }
            
            // Check goalkeeper collision
            const dist = Math.hypot(
                this.ball.x - this.goalkeeper.x,
                this.ball.y - this.goalkeeper.y
            );
            
            if (dist < this.ball.radius + 40) {
                this.gameState = 'defending';
                this.showMessage('🛑 BLOCKED!');
                setTimeout(() => this.roundEnd(false), 2000);
            }
            
            // Check goal
            if (this.ball.x > canvas.width * 0.9 && 
                Math.abs(this.ball.y - this.penaltySpotY) < this.goalHeight / 2) {
                this.gameState = 'goal';
                this.showMessage('⚽ GOAL!');
                this.isPlayerAttacking ? this.playerScore++ : this.aiScore++;
                document.getElementById('playerScore').textContent = this.playerScore;
                document.getElementById('aiScore').textContent = this.aiScore;
                setTimeout(() => this.roundEnd(true), 2000);
            }
            
            // Check miss
            if (this.ball.x > canvas.width) {
                this.gameState = 'ended';
                this.showMessage('❌ MISSED!');
                setTimeout(() => this.roundEnd(false), 2000);
            }
        }
        
        if (this.gameState === 'aiming') {
            // Update aim based on mouse
            this.aimAngle = Math.atan2(
                this.mouseY - this.penaltySpotY,
                this.mouseX - this.penaltySpotX
            );
            
            // Update power meter
            if (this.power < 100) {
                this.power += 1.5;
                if (this.power >= 100) {
                    this.maxPowerReached = true;
                    this.power = 100;
                }
            }
            
            document.getElementById('meterFill').style.width = this.power + '%';
            document.getElementById('powerText').textContent = Math.round(this.power) + '%';
        }
        
        // Goalkeeper AI
        if (this.gameState === 'defending' && !this.isPlayerAttacking) {
            this.goalkeeper.reactionTime -= 0.016;
            if (this.goalkeeper.reactionTime <= 0) {
                // AI tries to predict ball
                this.goalkeeper.targetY = Math.random() < 0.5 ? 
                    this.penaltySpotY - 50 : this.penaltySpotY + 50;
                
                if (Math.abs(this.goalkeeper.y - this.goalkeeper.targetY) > 5) {
                    this.goalkeeper.y += Math.sign(this.goalkeeper.targetY - this.goalkeeper.y) * 4;
                }
            }
        }
    },
    
    shoot() {
        if (this.gameState !== 'aiming') return;
        
        this.gameState = 'shooting';
        document.getElementById('powerMeter').style.display = 'none';
        document.getElementById('aimDisplay').style.display = 'none';
        
        const speed = (this.power / 100) * 20;
        this.ball.vx = Math.cos(this.aimAngle) * speed;
        this.ball.vy = Math.sin(this.aimAngle) * speed;
        this.ball.spin = (Math.random() - 0.5) * 2;
    },
    
    aiShoot() {
        this.gameState = 'aiming';
        const power = 40 + Math.random() * 40;
        const aimY = this.penaltySpotY + (Math.random() - 0.5) * 100;
        
        setTimeout(() => {
            this.ball.x = this.penaltySpotX;
            this.ball.y = this.penaltySpotY;
            
            const dist = Math.hypot(
                this.goalkeeper.x - this.ball.x,
                aimY - this.ball.y
            );
            
            this.ball.vx = ((this.goalkeeper.x - this.ball.x) / dist) * (power / 10);
            this.ball.vy = ((aimY - this.ball.y) / dist) * (power / 10);
            
            this.gameState = 'shooting';
        }, 500);
    },
    
    roundEnd(scored) {
        this.isPlayerAttacking = !this.isPlayerAttacking;
        
        if (this.playerScore >= 5 || this.aiScore >= 5) {
            this.gameState = 'ended';
            const winner = this.playerScore >= 5 ? this.playerCountry.name : this.aiCountry.name;
            this.showMessage(`🏆 ${winner} WINS! 🏆`);
            
            setTimeout(() => {
                document.getElementById('controls').style.display = 'block';
                this.gameState = 'idle';
            }, 3000);
        } else {
            setTimeout(() => this.nextRound(), 1000);
        }
    },
    
    showMessage(msg) {
        const msgEl = document.getElementById('message');
        msgEl.textContent = msg;
        msgEl.classList.add('show');
        setTimeout(() => msgEl.classList.remove('show'), 1500);
    },
    
    reset() {
        this.gameState = 'idle';
        this.ball.x = this.penaltySpotX;
        this.ball.y = this.penaltySpotY;
    },
    
    draw() {
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a472a');
        gradient.addColorStop(1, '#0d2617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stadium lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < canvas.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        // Draw field
        ctx.fillStyle = '#2d5a2d';
        ctx.fillRect(
            canvas.width * 0.1,
            (canvas.height - this.fieldHeight) / 2,
            this.fieldWidth,
            this.fieldHeight
        );
        
        // Draw field lines
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        
        // Center line
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.5, (canvas.height - this.fieldHeight) / 2);
        ctx.lineTo(canvas.width * 0.5, (canvas.height + this.fieldHeight) / 2);
        ctx.stroke();
        
        // Goal area
        ctx.strokeRect(
            canvas.width * 0.7,
            this.penaltySpotY - this.goalHeight / 2,
            this.fieldWidth * 0.2,
            this.goalHeight
        );
        
        // Penalty spot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.penaltySpotX, this.penaltySpotY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw goal net
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.9, this.penaltySpotY - this.goalHeight / 2 + i * 20);
            ctx.lineTo(canvas.width * 0.95, this.penaltySpotY - this.goalHeight / 2 + i * 20);
            ctx.stroke();
        }
        
        // Draw goalkeeper
        ctx.fillStyle = this.isPlayerAttacking ? '#FF6B6B' : '#4ECDC4';
        ctx.fillRect(
            this.goalkeeper.x - this.goalkeeper.width / 2,
            this.goalkeeper.y - this.goalkeeper.height / 2,
            this.goalkeeper.width,
            this.goalkeeper.height
        );
        
        // Draw goalkeeper face
        ctx.fillStyle = '#FFD4A3';
        ctx.beginPath();
        ctx.arc(
            this.goalkeeper.x,
            this.goalkeeper.y - 45,
            12,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw ball
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ball texture
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(
                this.ball.x,
                this.ball.y,
                this.ball.radius * (0.3 + i * 0.15),
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Draw player (kicker)
        ctx.fillStyle = this.playerCountry.primary;
        ctx.fillRect(this.penaltySpotX - 20, this.penaltySpotY + 50, 40, 60);
        
        // Player head
        ctx.fillStyle = '#FFD4A3';
        ctx.beginPath();
        ctx.arc(this.penaltySpotX, this.penaltySpotY + 35, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw aim reticle if aiming
        if (this.gameState === 'aiming' && this.isPlayerAttacking) {
            document.getElementById('powerMeter').style.display = 'block';
            document.getElementById('aimDisplay').style.display = 'block';
            
            const aimLength = 100;
            const aimX = this.penaltySpotX + Math.cos(this.aimAngle) * aimLength;
            const aimY = this.penaltySpotY + Math.sin(this.aimAngle) * aimLength;
            
            // Aim line
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.penaltySpotX, this.penaltySpotY);
            ctx.lineTo(aimX, aimY);
            ctx.stroke();
            
            // Aim circle
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(aimX, aimY, 30, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            document.getElementById('powerMeter').style.display = 'none';
            document.getElementById('aimDisplay').style.display = 'none';
        }
        
        // Draw crowd (simple)
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * (canvas.height * 0.2) + canvas.height * 0.8,
                10,
                15
            );
        }
    }
};

// Event listeners
document.addEventListener('mousemove', (e) => {
    game.mouseX = e.clientX;
    game.mouseY = e.clientY;
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && game.gameState === 'aiming' && game.isPlayerAttacking) {
        e.preventDefault();
    }
});

document.addEventListener('click', () => {
    if (game.gameState === 'aiming' && game.isPlayerAttacking) {
        game.shoot();
    }
});

// Game loop
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
window.addEventListener('load', () => {
    game.init();
    gameLoop();
});

window.addEventListener('resize', () => {
    game.init();
});