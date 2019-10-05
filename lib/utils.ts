/**
 * Tries to avoid being on the same horizontal/vertical as another nearby enemy
 * bot, in case they happen to be armed with a laser.
 * @param closestEnemyBot entity representing the closest bot we see
 * @param numEnemyBots total number of enemy bots visible
 */
const tryEvadeLasers = function(closestEnemyBot: Entity, numEnemyBots: number) {
    const enemyBotDistance = getDistanceTo(closestEnemyBot);
    // Don't stand in range of lasers
    // Move away from the bot, preferably toward a border
    if (x == closestEnemyBot.x && enemyBotDistance > 1) {
        // TODO hack for fixing the bouncing back and forth issue
        // get in diag range with missiles
        // TODO: consider values other than 4 for other weapons
        if (enemyBotDistance >= 4 && percentChance(50)) {
            if (y > closestEnemyBot.y && canMove("up")) move("up");
            else if (y < closestEnemyBot.y && canMove("down")) move("down");
        }
        if (canMove("backward")) move("backward");
        if (canMove("forward") && numEnemyBots <= 1) move("forward");
    }
    if (y == closestEnemyBot.y && enemyBotDistance > 1) {
        // Move up or down randomly if both directions are available
        if (canMove("up") && canMove("down")) {
            if (percentChance(50)) move("up");
            move("down");
        }
        if (canMove("up")) move("up");
        if (canMove("down")) move("down");
    }
};

/**
 * A smart missile firing function that shoots at the enemy bot that is visible
 * with lowest health, if it is in range.
 */
const tryFireMissiles = function() {
    if (willMissilesHit()) {
        const gankTarget = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (willMissilesHit(gankTarget)) fireMissiles(gankTarget);
        // If not, fire at anyone
        fireMissiles();
    }
};

const tryCloak = function() {
    if (canCloak()) cloak();
};

const tryReflect = function() {
    if (canReflect()) reflect();
};

const tryShieldSelf = function() {
    if (canShield()) shield();
};

const tryZap = function() {
    if (canZap()) zap();
};
