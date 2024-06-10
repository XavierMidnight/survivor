let cube = document.getElementById('cube');
let enemies = [];
let bullets = [];
let position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let enemyInterval, bulletInterval, autoMoveInterval, lastMoveTime = Date.now();
const enemyImage = 'enemies.webp'; // Update with the correct path if needed
const enemySize = { width: 64, height: 64 }; // Adjust the size if the new sprite sheet has different dimensions
const numColumns = 5; // Adjust the number of columns based on the new sprite sheet
const numRows = 5; // Adjust the number of rows based on the new sprite sheet
let bulletSpeed = 500;
const bulletSpeedUI = document.getElementById('bullet-speed');
let healthPoints = 100;
const healthBar = document.getElementById('health-bar');
const gameOverScreen = document.getElementById('game-over');
let isInvulnerable = false;
let enemiesKilled = 0; // Track the number of enemies killed
const enemyKillCountUI = document.getElementById('enemy-kill-count');

const playerAnimation = document.getElementById('cube');
const playerNumColumns = 6; // Adjust the number of columns based on the sprite sheet
const playerNumRows = 3; // Adjust the number of rows based on the sprite sheet
const frameWidth = 45; // Adjust the width of each frame
const frameHeight = 55; // Adjust the height of each frame
let frame = 0; // Change this to display a different portion of the image

function updatePlayerAnimation() {
    frame++;
    if (frame ===playerNumRows*playerNumColumns) {
        frame=0;
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


function endGame() {
    clearInterval(enemyInterval);
    clearInterval(bulletInterval);
    clearInterval(autoMoveInterval);

    // Remove all enemies and bullets
    enemies.forEach(enemy => enemy.remove());
    bullets.forEach(bullet => bullet.element.remove());
    enemies = [];
    bullets = [];

    // Show game over screen
    gameOverScreen.style.display = 'block';
}

function restartGame() {
    // Hide game over screen
    gameOverScreen.style.display = 'none';

    // Reset health and bullet speed
    healthPoints = 100;
    bulletSpeed = 1000;
    healthBar.style.width = `${healthPoints}%`;
    enemiesKilled = 0;
    updateBulletSpeedUI();
    updateEnemyKillCountUI();

    // Reset player position
    position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    updatePosition();

    // Restart intervals
    bulletInterval = setInterval(shootBullet, bulletSpeed);
    enemyInterval = setInterval(spawnEnemy, 1000);
    autoMoveInterval = setInterval(autoMovePlayer, 1000);
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

function autoMovePlayer() {
    if (Date.now() - lastMoveTime > 1000) {
        let nearestEnemies = findNearestEnemies(3); // Get the 3 nearest enemies
        if (nearestEnemies.length > 0) {
            let totalAngleX = 0;
            let totalAngleY = 0;

            nearestEnemies.forEach(enemy => {
                let ex = parseFloat(enemy.style.left);
                let ey = parseFloat(enemy.style.top);
                let angle = Math.atan2(position.y - ey, position.x - ex);

                totalAngleX += Math.cos(angle);
                totalAngleY += Math.sin(angle);
            });

            // Calculate average direction away from the 3 nearest enemies
            let avgAngleX = totalAngleX / nearestEnemies.length;
            let avgAngleY = totalAngleY / nearestEnemies.length;

            position.x += avgAngleX * 10; // Move faster
            position.y += avgAngleY * 10; // Move faster

            position.x = Math.max(0, Math.min(window.innerWidth - 50, position.x));
            position.y = Math.max(0, Math.min(window.innerHeight - 50, position.y));

            cube.style.transform = `translate(${position.x}px, ${position.y}px)`;

            updatePlayerAnimation();
        }
    }
}

function findNearestEnemies(count) {
    let distances = enemies.map(enemy => {
        let ex = parseFloat(enemy.style.left);
        let ey = parseFloat(enemy.style.top);
        let distance = Math.sqrt((position.x - ex) ** 2 + (position.y - ey) ** 2);
        return { enemy, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);
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

    let side = Math.floor(Math.random() * 4);
    if (side === 0) {
        enemy.style.left = Math.random() * window.innerWidth + 'px';
        enemy.style.top = '-30px';
    } else if (side === 1) {
        enemy.style.left = Math.random() * window.innerWidth + 'px';
        enemy.style.top = window.innerHeight + 'px';
    } else if (side === 2) {
        enemy.style.left = '-30px';
        enemy.style.top = Math.random() * window.innerHeight + 'px';
    } else {
        enemy.style.left = window.innerWidth + 'px';
        enemy.style.top = Math.random() * window.innerHeight + 'px';
    }
    document.body.appendChild(enemy);
    enemies.push(enemy);
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

function shootBullet() {
    if (enemies.length === 0) return;
    let nearestEnemy = findNearestEnemy();
    if (!nearestEnemy) return;

    let bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = position.x + 20 + 'px';
    bullet.style.top = position.y + 20 + 'px';
    document.body.appendChild(bullet);
    bullets.push({ element: bullet, target: nearestEnemy });


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

function moveBullets() {
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
        console.log("die:"+enemiesKilled);
        if(bulletSpeed>=20) {
            bulletSpeed -= 10;
        }
        clearInterval(bulletInterval);
        bulletInterval = setInterval(shootBullet, bulletSpeed);
        updateBulletSpeedUI();
        updateEnemyKillCountUI(); // Update the enemy kill count UI
    }
}


enemyInterval = setInterval(spawnEnemy, 1000);
bulletInterval = setInterval(shootBullet, bulletSpeed);
setInterval(moveBullets, 50);
setInterval(moveEnemies, 50);
setInterval(autoMovePlayer, 100);

updatePosition();

