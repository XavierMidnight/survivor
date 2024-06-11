let cube = document.getElementById('cube');
let enemies = [];
let bullets = [];
let position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let enemyInterval, bulletInterval, autoMoveInterval, lastMoveTime, moveEnemiesInterval,moveBulletsInterval = Date.now();
const enemyImage = '/images/enemies.webp'; // Update with the correct path if needed
const enemySize = { width: 64, height: 64 }; // Adjust the size if the new sprite sheet has different dimensions
const numColumns = 5; // Adjust the number of columns based on the new sprite sheet
const numRows = 5; // Adjust the number of rows based on the new sprite sheet
let bulletSpeed = 1500;
const bulletSpeedUI = document.getElementById('bullet-speed');
let healthPoints = 100;
const healthBar = document.getElementById('health-bar');
const gameOverScreen = document.getElementById('game-over');
let isInvulnerable = false;
const countdownElement = document.getElementById('countdown');
let enemiesKilled = 0; // Track the number of enemies killed
const enemyKillCountUI = document.getElementById('enemy-kill-count');
const maxBulletDistance = 500; // Maximum distance a bullet can travel
const minimap = document.getElementById('minimap');
let minimapScale = 1; // Add a scale for zooming
const playerAnimation = document.getElementById('cube');
const playerNumColumns = 6; // Adjust the number of columns based on the sprite sheet
const playerNumRows = 3; // Adjust the number of rows based on the sprite sheet
const frameWidth = 45; // Adjust the width of each frame
const frameHeight = 55; // Adjust the height of each frame
let frame = 0; // Change this to display a different portion of the image
let highScore = localStorage.getItem('highScore') || 0;
const highScoreUI = document.getElementById('high-score');

highScoreUI.innerText = `High Score: ${highScore}`;

document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('resume-button').addEventListener('click', resumeGame);


function pauseGame() {
    clearInterval(enemyInterval);
    clearInterval(bulletInterval);
    clearInterval(autoMoveInterval);
    clearInterval(moveEnemiesInterval);
    clearInterval(moveBulletsInterval);
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('resume-button').style.display = 'block';
}

function resumeGame() {
    restartIntervals();
    document.getElementById('pause-button').style.display = 'block';
    document.getElementById('resume-button').style.display = 'none';
}

window.addEventListener('resize', () => {
    updateMinimapSize();
    updateMinimap();  // Ensure the minimap updates on window resize
});

updateMinimapSize(); // Initial call to set the minimap size

document.getElementById('zoom-in').addEventListener('click', () => {
    minimapScale = Math.min(minimapScale * 1.2, 5); // Increase scale, limit to a maximum value
    updateMinimap();
    updateMinimapSize()
});

document.getElementById('zoom-out').addEventListener('click', () => {
    minimapScale = Math.max(minimapScale / 1.2, 0.5); // Decrease scale, limit to a minimum value
    updateMinimap();
    updateMinimapSize()
});

function updateMinimapSize() {
    const windowAspect = window.innerWidth / window.innerHeight;
    const minimapHeight = 150; // Fixed height
    const minimapWidth = minimapHeight * windowAspect; // Adjust width based on aspect ratio
    minimap.style.width = `${minimapWidth * minimapScale}px`;
    minimap.style.height = `${minimapHeight * minimapScale}px`;


}

function updateMinimap() {
    // Clear previous minimap objects
    minimap.innerHTML = '';

    const minimapWidth = minimap.offsetWidth;
    const minimapHeight = minimap.offsetHeight;

    // Apply scale transformation
    minimap.style.transform = `scale(${minimapScale})`;


    // Calculate scale factors
    const scaleX = minimapWidth / window.innerWidth;
    const scaleY = minimapHeight / window.innerHeight;

    // Add player position to minimap
    let playerMinimap = document.createElement('div');
    playerMinimap.classList.add('minimap-object');
    playerMinimap.style.width = '5px';
    playerMinimap.style.height = '5px';
    playerMinimap.style.backgroundColor = 'red';
    playerMinimap.style.left = `${position.x * scaleX}px`;
    playerMinimap.style.top = `${position.y * scaleY}px`;
    minimap.appendChild(playerMinimap);

    // Add enemies to minimap
    enemies.forEach(enemy => {
        let ex = parseFloat(enemy.style.left);
        let ey = parseFloat(enemy.style.top);
        let enemyMinimap = document.createElement('div');
        enemyMinimap.classList.add('minimap-object', 'minimap-enemy');
        enemyMinimap.style.width = '3px';
        enemyMinimap.style.height = '3px';

        // Calculate enemy position on minimap
        let miniX = ex * scaleX;
        let miniY = ey * scaleY;

        // Ensure enemies just outside the screen are shown on the minimap within a secondary border
        miniX = Math.max(0, Math.min(minimapWidth - 3, miniX)); // Clamp to minimap bounds
        miniY = Math.max(0, Math.min(minimapHeight - 3, miniY)); // Clamp to minimap bounds

        enemyMinimap.style.left = `${miniX}px`;
        enemyMinimap.style.top = `${miniY}px`;
        minimap.appendChild(enemyMinimap);
    });
}

updateMinimap(); // Initial call to set the minimap size and content

function updatePlayerAnimation() {
    frame++;
    if (frame === playerNumRows * playerNumColumns) {
        frame = 0;
    }

    const posX = (frame % playerNumColumns) * frameWidth;
    const posY = Math.floor(frame / playerNumColumns) * frameHeight;

    playerAnimation.style.backgroundPosition = `-${posX}px -${posY}px`;
    playerAnimation.style.backgroundSize = `${playerNumColumns * frameWidth}px ${playerNumRows * frameHeight}px`;
}

function updateBulletSpeedUI() {
    bulletSpeedUI.innerText = `Bullet Speed: ${bulletSpeed}ms`;
}

function updateEnemyKillCountUI() {
    enemyKillCountUI.innerText = `Enemies Killed: ${enemiesKilled}`;
}


function decreaseHealth(amount) {
    healthPoints -= amount;
    if (healthPoints < 0) {
        healthPoints = 0;
    }
    healthBar.style.width = `${healthPoints}%`;

    if (healthPoints <= 0) {
        endGame();
    } else {
        // Make player invulnerable and apply red filter
        isInvulnerable = true;
        cube.style.filter = 'hue-rotate(90deg) saturate(3)';

        // Revert filter and invulnerability after 1 second
        setTimeout(() => {
            cube.style.filter = '';
            isInvulnerable = false;
        }, 1000);
    }
}

function startCountdown(seconds) {
    let remainingTime = seconds;
    countdownElement.innerText = `Restarting in ${remainingTime}...`;
    countdownElement.style.display = 'block';

    const countdownInterval = setInterval(() => {
        remainingTime -= 1;
        countdownElement.innerText = `Restarting in ${remainingTime}...`;

        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            restartGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(enemyInterval);
    clearInterval(bulletInterval);
    clearInterval(autoMoveInterval);

    // Remove all enemies and bullets
    enemies.forEach(enemy => enemy.remove());
    bullets.forEach(bullet => bullet.element.remove());
    enemies = [];
    bullets = [];

    // Check and update high score
    if (enemiesKilled > highScore) {
        highScore = enemiesKilled;
        localStorage.setItem('highScore', highScore);
        highScoreUI.innerText = `High Score: ${highScore}`;
    }

    // Show game over screen
    gameOverScreen.style.display = 'block';
    // Start countdown for auto-restart
    startCountdown(5); // 5 seconds countdown
}




function restartGame() {
    // Hide game over screen
    gameOverScreen.style.display = 'none';

    // Reset health and bullet speed
    healthPoints = 100;
    bulletSpeed = 1500;
    healthBar.style.width = `${healthPoints}%`;
    enemiesKilled = 0;
    updateBulletSpeedUI();
    updateEnemyKillCountUI();

    // Reset player position
    position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    updatePosition();

    // for some reason i need this
    clearInterval(enemyInterval);



    // Restart intervals
    restartIntervals();

}



function updatePosition() {
    cube.style.transform = `translate(${position.x}px, ${position.y}px)`;

}

window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad connected:", event.gamepad);
    requestAnimationFrame(updateGamepadStatus);
});

function updateGamepadStatus() {
    let gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        let gp = gamepads[0];
        let xAxis = gp.axes[0];
        let yAxis = gp.axes[1];

        if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {
            lastMoveTime = Date.now();
            position.x += xAxis * 5;
            position.y += yAxis * 5;
        }

        position.x = Math.max(0, Math.min(window.innerWidth - 50, position.x));
        position.y = Math.max(0, Math.min(window.innerHeight - 50, position.y));

        updatePosition();
    }
    requestAnimationFrame(updateGamepadStatus);
}



function findNearestEnemies(count) {
    let distances = enemies.map(enemy => {
        let ex = parseFloat(enemy.style.left);
        let ey = parseFloat(enemy.style.top);

        // Calculate the distance from the player to the enemy
        let distance = Math.sqrt((position.x - ex) ** 2 + (position.y - ey) ** 2);
        return { enemy, distance };
    });

    // Sort enemies by distance from the player
    distances.sort((a, b) => a.distance - b.distance);

    // Return the closest enemies up to the specified count
    return distances.slice(0, count).map(item => item.enemy);
}



window.addEventListener('resize', () => {
    position.x = Math.min(position.x, window.innerWidth - 50);
    position.y = Math.min(position.y, window.innerHeight - 50);
    updatePosition();
});

function spawnEnemy() {
    let enemy = document.createElement('div');
    enemy.classList.add('enemy');

    let randomIndex = Math.floor(Math.random() * (numColumns * numRows));
    let posX = (randomIndex % numColumns) * enemySize.width;
    let posY = Math.floor(randomIndex / numColumns) * enemySize.height;

    enemy.style.backgroundImage = `url("${enemyImage}")`;
    enemy.style.backgroundPosition = `-${posX}px -${posY}px`;
    enemy.style.backgroundSize = `${numColumns * enemySize.width}px ${numRows * enemySize.height}px`;
    enemy.style.width = `${enemySize.width}px`;
    enemy.style.height = `${enemySize.height}px`;

    // Calculate random angle and increased radius
    let angle = Math.random() * 2 * Math.PI;
    let radius = 500+Math.random()*500; // Increase the radius to make the circle diameter larger

    // Calculate enemy position based on angle and increased radius
    let enemyX = position.x + radius * Math.cos(angle);
    let enemyY = position.y + radius * Math.sin(angle);

    // Ensure the enemy is within the game bounds
    //enemyX = Math.max(0, Math.min(window.innerWidth - enemySize.width, enemyX));
    //enemyY = Math.max(0, Math.min(window.innerHeight - enemySize.height, enemyY));

    enemy.style.left = `${enemyX}px`;
    enemy.style.top = `${enemyY}px`;

    document.body.appendChild(enemy);
    enemies.push(enemy);
}



function autoMovePlayer() {

        let nearestEnemies = findNearestEnemies(3); // Get the nearest enemy
        if (nearestEnemies.length > 0) {
            let nearestEnemy = nearestEnemies[0];

            // Calculate direction away from the nearest enemy
            let ex = parseFloat(nearestEnemy.style.left);
            let ey = parseFloat(nearestEnemy.style.top);
            let angle = Math.atan2(position.y - ey, position.x - ex);

            let moveX = Math.cos(angle) * 25; // Adjust speed as needed
            let moveY = Math.sin(angle) * 25; // Adjust speed as needed

            // Move the player away from the nearest enemy
            position.x += moveX;
            position.y += moveY;

            // Ensure the player stays within the game bounds
            position.x = Math.max(0, Math.min(window.innerWidth - 50, position.x));
            position.y = Math.max(0, Math.min(window.innerHeight - 50, position.y));

            updatePosition();

        }

}

function moveEnemies() {
    enemies.forEach(enemy => {
        let ex = parseFloat(enemy.style.left);
        let ey = parseFloat(enemy.style.top);

        let angle = Math.atan2(position.y - ey, position.x - ex);
        enemy.style.left = ex + Math.cos(angle) * 2 + 'px';
        enemy.style.top = ey + Math.sin(angle) * 2 + 'px';

        // Check for collision with player
        if (Math.abs(ex - position.x) < 50 && Math.abs(ey - position.y) < 50) {
            if (!isInvulnerable) {
                decreaseHealth(10);
            }
        }
    });

}





export function shootBullet() {
    if (enemies.length === 0) return;
    let nearestEnemy = findNearestEnemy();
    if (!nearestEnemy) return;

    let bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = position.x + 20 + 'px';
    bullet.style.top = position.y + 20 + 'px';
    document.body.appendChild(bullet);
    bullets.push({ element: bullet, target: nearestEnemy, startX: position.x, startY: position.y });
}

function findNearestEnemy() {
    let minDistance = Infinity;
    let nearestEnemy = null;
    enemies.forEach(enemy => {
        let ex = parseFloat(enemy.style.left);
        let ey = parseFloat(enemy.style.top);
        let distance = Math.sqrt((position.x - ex) ** 2 + (position.y - ey) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

// Add this function to create and display an explosion effect
function createExplosion(x, y) {
    let explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    document.body.appendChild(explosion);

    // Remove the explosion effect after a short duration
    setTimeout(() => {
        explosion.remove();
    }, 500);
}

export function moveBullets() {
    let enemyKilled = false;

    bullets.forEach((bulletObj, index) => {
        let bullet = bulletObj.element;
        let target = bulletObj.target;
        if (!document.body.contains(target)) {
            bullet.remove();
            bullets.splice(index, 1);
            return;
        }

        let bx = parseFloat(bullet.style.left);
        let by = parseFloat(bullet.style.top);
        let tx = parseFloat(target.style.left);
        let ty = parseFloat(target.style.top);

        let angle = Math.atan2(ty - by, tx - bx);
        bullet.style.left = bx + Math.cos(angle) * 5 + 'px';
        bullet.style.top = by + Math.sin(angle) * 5 + 'px';

        // Calculate the distance traveled by the bullet
        let distanceTraveled = Math.sqrt((bx - bulletObj.startX) ** 2 + (by - bulletObj.startY) ** 2);

        // Remove bullet if it exceeds the maximum distance
        if (distanceTraveled > maxBulletDistance) {
            bullet.remove();
            bullets.splice(index, 1);
            return;
        }

        if (Math.abs(bx - tx) < 10 && Math.abs(by - ty) < 10) {
            createExplosion(tx, ty); // Show explosion effect
            target.remove();
            bullet.remove();
            enemies.splice(enemies.indexOf(target), 1);
            bullets.splice(index, 1);

            // Mark that an enemy was killed
            enemyKilled = true;
            enemiesKilled += 1; // Increment the enemy kill count
        }
    });

    // Update bullet speed and update UI only when an enemy is killed
    if (enemyKilled) {
        if (bulletSpeed >= 100) {
            bulletSpeed -= 10;
        }
        clearInterval(bulletInterval);
        bulletInterval = setInterval(shootBullet, bulletSpeed);
        updateBulletSpeedUI();
        updateEnemyKillCountUI(); // Update the enemy kill count UI
    }
}

function restartIntervals() {
    bulletInterval = setInterval(shootBullet, bulletSpeed);
    moveBulletsInterval = setInterval(moveBullets, bulletSpeed / bulletSpeed * 10);
    enemyInterval = setInterval(spawnEnemy, 1000);
    autoMoveInterval = setInterval(autoMovePlayer, 200);
    moveEnemiesInterval = setInterval(moveEnemies, 100);
}

document.addEventListener('DOMContentLoaded', (event) => {
    restartIntervals();


    setInterval(updateMinimap, 100);
    setInterval(updatePlayerAnimation, 150);
    updatePosition();
});



