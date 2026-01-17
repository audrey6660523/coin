// ==================== //
// Game Constants & State
// ==================== //

const CHARACTERS = [
    { name: 'Cat', color: '#ff3232', imgFile: 'assets/103643387.webp' },
    { name: 'Cute', color: '#32ff32', imgFile: 'assets/images.jpg' },
    { name: 'Ghost', color: '#3232ff', imgFile: 'assets/player_blue.png' }
];

const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    TOTAL_TIME: 45,
    PLAYER_SIZE: 50,
    PLAYER_SPEED: 8,
    JUMP_SPEED: -18,
    GRAVITY: 0.8,
    COIN_SIZE: 45,
    COIN_FALL_SPEED: 5,
    COIN_SPAWN_RATE: 30
};

let gameState = {
    selectedCharacter: 0,
    currentScreen: 'characterSelection',
    score: 0,
    timeLeft: GAME_CONFIG.TOTAL_TIME,
    gameOver: false,
    showRetryDialog: false,
    player: {
        x: GAME_CONFIG.WIDTH / 2,
        y: GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER_SIZE - 10,
        vx: 0,
        vy: 0,
        isJumping: false,
        image: null
    },
    coins: [],
    keys: {},
    startTime: 0,
    gameOverTime: 0,
    images: {
        characters: [],
        coin: null
    }
};

// ==================== //
// DOM Elements
// ==================== //

const screens = {
    characterSelection: document.getElementById('characterSelection'),
    gameScreen: document.getElementById('gameScreen'),
    gameOverScreen: document.getElementById('gameOverScreen')
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreValue');
const timerDisplay = document.getElementById('timerValue');
const characterCards = document.querySelectorAll('.character-card');

// ==================== //
// Image Loading
// ==================== //

function loadImages() {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = CHARACTERS.length + 1;

        function checkLoaded() {
            loaded++;
            if (loaded === total) resolve();
        }

        // Load character images
        CHARACTERS.forEach((char, index) => {
            const img = new Image();
            img.onload = checkLoaded;
            img.onerror = () => {
                console.warn(`Failed to load ${char.imgFile}`);
                checkLoaded();
            };
            img.src = char.imgFile;
            gameState.images.characters[index] = img;
        });

        // Load coin image
        const coinImg = new Image();
        coinImg.onload = checkLoaded;
        coinImg.onerror = () => {
            console.warn('Failed to load coin.png');
            checkLoaded();
        };
        coinImg.src = 'assets/coin.png';
        gameState.images.coin = coinImg;
    });
}

// ==================== //
// Screen Management
// ==================== //

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
    gameState.currentScreen = screenName;
}

// ==================== //
// Character Selection
// ==================== //

let selectedCardIndex = 0;

function updateCharacterSelection(index) {
    characterCards.forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });
    selectedCardIndex = index;
}

characterCards.forEach((card, index) => {
    card.addEventListener('click', () => {
        updateCharacterSelection(index);
        startGame(index);
    });
});

// Keyboard navigation for character selection
document.addEventListener('keydown', (e) => {
    if (gameState.currentScreen === 'characterSelection') {
        if (e.key === 'ArrowLeft') {
            selectedCardIndex = (selectedCardIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
            updateCharacterSelection(selectedCardIndex);
        } else if (e.key === 'ArrowRight') {
            selectedCardIndex = (selectedCardIndex + 1) % CHARACTERS.length;
            updateCharacterSelection(selectedCardIndex);
        } else if (e.key === 'Enter') {
            startGame(selectedCardIndex);
        }
    }
});

// ==================== //
// Game Initialization
// ==================== //

function startGame(characterIndex) {
    gameState.selectedCharacter = characterIndex;
    gameState.player.image = gameState.images.characters[characterIndex];
    gameState.score = 0;
    gameState.timeLeft = GAME_CONFIG.TOTAL_TIME;
    gameState.gameOver = false;
    gameState.showRetryDialog = false;
    gameState.startTime = Date.now();
    gameState.player.x = GAME_CONFIG.WIDTH / 2;
    gameState.player.y = GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER_SIZE - 10;
    gameState.player.isJumping = false;
    gameState.player.vy = 0;
    gameState.coins = [];
    gameState.keys = {};

    showScreen('gameScreen');
    gameLoop();
}

function resetGame() {
    startGame(gameState.selectedCharacter);
}

// ==================== //
// Input Handling
// ==================== //

document.addEventListener('keydown', (e) => {
    if (gameState.currentScreen === 'gameScreen' && !gameState.gameOver) {
        gameState.keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (gameState.currentScreen === 'gameScreen') {
        gameState.keys[e.key] = false;
    }
});

// ==================== //
// Game Logic
// ==================== //

function updateGame() {
    if (gameState.gameOver) return;

    // Update timer
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    gameState.timeLeft = Math.max(0, Math.ceil(GAME_CONFIG.TOTAL_TIME - elapsed));

    timerDisplay.textContent = gameState.timeLeft;
    timerDisplay.parentElement.classList.toggle('warning', gameState.timeLeft <= 10);

    if (gameState.timeLeft <= 0) {
        endGame();
        return;
    }

    // Player movement
    const groundY = GAME_CONFIG.HEIGHT - GAME_CONFIG.PLAYER_SIZE - 10;

    if ((gameState.keys['ArrowLeft'] || gameState.keys['a'] || gameState.keys['A']) &&
        gameState.player.x > 0) {
        gameState.player.x -= GAME_CONFIG.PLAYER_SPEED;
    }
    if ((gameState.keys['ArrowRight'] || gameState.keys['d'] || gameState.keys['D']) &&
        gameState.player.x < GAME_CONFIG.WIDTH - GAME_CONFIG.PLAYER_SIZE) {
        gameState.player.x += GAME_CONFIG.PLAYER_SPEED;
    }
    if ((gameState.keys[' '] || gameState.keys['ArrowUp']) && !gameState.player.isJumping) {
        gameState.player.vy = GAME_CONFIG.JUMP_SPEED;
        gameState.player.isJumping = true;
    }

    // Jumping physics
    if (gameState.player.isJumping) {
        gameState.player.vy += GAME_CONFIG.GRAVITY;
        gameState.player.y += gameState.player.vy;

        if (gameState.player.y >= groundY) {
            gameState.player.y = groundY;
            gameState.player.isJumping = false;
            gameState.player.vy = 0;
        }
    }

    // Coin spawning
    if (Math.random() < 1 / GAME_CONFIG.COIN_SPAWN_RATE) {
        gameState.coins.push({
            x: Math.random() * (GAME_CONFIG.WIDTH - GAME_CONFIG.COIN_SIZE),
            y: -GAME_CONFIG.COIN_SIZE,
            size: GAME_CONFIG.COIN_SIZE
        });
    }

    // Update coins and collision detection
    const playerRect = {
        x: gameState.player.x,
        y: gameState.player.y,
        width: GAME_CONFIG.PLAYER_SIZE,
        height: GAME_CONFIG.PLAYER_SIZE
    };

    gameState.coins = gameState.coins.filter(coin => {
        coin.y += GAME_CONFIG.COIN_FALL_SPEED;

        // Collision detection
        if (coin.x < playerRect.x + playerRect.width &&
            coin.x + coin.size > playerRect.x &&
            coin.y < playerRect.y + playerRect.height &&
            coin.y + coin.size > playerRect.y) {
            gameState.score += 10;
            scoreDisplay.textContent = gameState.score;
            return false; // Remove coin
        }

        // Remove coins that fall below screen
        return coin.y < GAME_CONFIG.HEIGHT;
    });
}

// ==================== //
// Rendering
// ==================== //

function render() {
    // Clear canvas
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Draw player
    if (gameState.player.image && gameState.player.image.complete) {
        ctx.drawImage(
            gameState.player.image,
            gameState.player.x,
            gameState.player.y,
            GAME_CONFIG.PLAYER_SIZE,
            GAME_CONFIG.PLAYER_SIZE
        );
    } else {
        ctx.fillStyle = CHARACTERS[gameState.selectedCharacter].color;
        ctx.beginPath();
        ctx.roundRect(
            gameState.player.x,
            gameState.player.y,
            GAME_CONFIG.PLAYER_SIZE,
            GAME_CONFIG.PLAYER_SIZE,
            8
        );
        ctx.fill();
    }

    // Draw coins
    gameState.coins.forEach(coin => {
        if (gameState.images.coin && gameState.images.coin.complete) {
            ctx.drawImage(gameState.images.coin, coin.x, coin.y, coin.size, coin.size);
        } else {
            // Fallback coin rendering
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

// ==================== //
// Game Loop
// ==================== //

function gameLoop() {
    if (gameState.currentScreen !== 'gameScreen') return;

    updateGame();
    render();

    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// ==================== //
// Game Over
// ==================== //

function endGame() {
    gameState.gameOver = true;
    gameState.gameOverTime = Date.now();
    showGameOverScreen();
}

function showGameOverScreen() {
    showScreen('gameOverScreen');

    const resultDisplay = document.getElementById('resultDisplay');
    const retryDialog = document.getElementById('retryDialog');
    const commentText = document.getElementById('commentText');
    const finalScore = document.getElementById('finalScore');
    const waitMessage = document.getElementById('waitMessage');

    // Determine comment
    let comment;
    if (gameState.score < 300) {
        comment = '你好菜';
    } else if (gameState.score <= 500) {
        comment = '還行';
    } else {
        comment = '不錯';
    }

    commentText.textContent = comment;
    finalScore.textContent = `總分: ${gameState.score}`;

    // Show result first
    resultDisplay.style.display = 'block';
    retryDialog.classList.add('hidden');

    let countdown = 3;
    const countdownInterval = setInterval(() => {
        if (countdown > 0) {
            waitMessage.textContent = `請稍候... ${countdown} 秒後顯示選單`;
            countdown--;
        } else {
            clearInterval(countdownInterval);
            resultDisplay.style.display = 'none';
            retryDialog.classList.remove('hidden');
        }
    }, 1000);
}

// ==================== //
// Retry and Quit
// ==================== //

document.getElementById('retryBtn').addEventListener('click', () => {
    resetGame();
});

document.getElementById('quitBtn').addEventListener('click', () => {
    showScreen('characterSelection');
    updateCharacterSelection(0);
});

// ==================== //
// Initialization
// ==================== //

async function init() {
    await loadImages();
    updateCharacterSelection(0);
}

// Start the game
init();
