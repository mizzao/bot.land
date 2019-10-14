/**
 * Tries to avoid being on the same horizontal/vertical as another nearby enemy
 * bot, in case they happen to be armed with a laser.
 * @param closestEnemyBot entity representing the closest bot we see
 * @param numEnemyBots total number of enemy bots visible
 */
const tryEvadeLasers = function(closestEnemyBot: Entity, numEnemyBots: number, weaponMaxRange: number) {
    const enemyBotDistance = getDistanceTo(closestEnemyBot);
    // Mainly for artillery. Lasers have a max range of 5, so why dodge them at
    // longer ranges? This occasionally helped with dodging artillery, but we
    // should write separate code for that.
    if (enemyBotDistance > 5) return;

    // Don't stand in range of lasers
    // Move away from the bot, preferably toward a border
    if (x == closestEnemyBot.x && enemyBotDistance > 1) {
        // TODO hack for fixing the bouncing back and forth issue at maximum
        // weapon range. This helps us get on a diagonal but still in range.
        if (enemyBotDistance == weaponMaxRange && percentChance(50)) {
            if (y > closestEnemyBot.y && canMove('up')) move('up');
            else if (y < closestEnemyBot.y && canMove('down')) move('down');
        }
        if (canMove('backward')) move('backward');
        if (canMove('forward') && numEnemyBots <= 1) move('forward');
    }
    if (y == closestEnemyBot.y && enemyBotDistance > 1) {
        // Move up or down randomly if both directions are available
        if (canMove('up') && canMove('down')) {
            if (percentChance(50)) move('up');
            move('down');
        }
        if (canMove('up')) move('up');
        if (canMove('down')) move('down');
    }
};

/**
 * This micros a bot away from a target enemy, attempting to stay at a diagonal
 * distance.
 * @param closestEnemyBot
 * @param numEnemyBots
 */
const tryEvadeEnemy = function(closestEnemyBot: Entity, numEnemyBots: number) {
    // We're diagonally positioned from the enemy. Go in the direction with more space.
    // Prefer going backward to going forward, which can get us stuck.
    // TODO don't always run down from top left
    if (canMove('backward') && x <= closestEnemyBot.x) {
        // Do occasional diagonal moves to get people to eat mines
        if (y < closestEnemyBot.y && canMove('up') && percentChance(30)) move('up');
        if (y > closestEnemyBot.y && canMove('down') && percentChance(30)) move('down');
        move('backward');
    }
    // TODO we should move backward when there's one bot too
    // clean this code up
    if (canMove('up') && y <= closestEnemyBot.y) {
        move('up');
    }
    if (canMove('down') && y >= closestEnemyBot.y) {
        move('down');
    }
    if (canMove('backward')) {
        if (numEnemyBots > 1) move('backward');
    }
    if (canMove('forward') && x >= closestEnemyBot.x && numEnemyBots <= 1) {
        move('forward');
    }
    if (canMove('backward')) {
        move('backward');
    }
};

/**
 * Smart melee. This will try to hit the bot with lowest health nearby if it is
 * in melee range. It not hit a structure if an enemy bot is nearby, so if you
 * want to do that, call melee() manually.
 */
const tryMeleeSmart = function() {
    if (willMeleeHit()) {
        const gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        // Try a charge-hit first before a normal hit. I'm not sure about the
        // semantics of how willMeleeHit() works, so just being a bit extra
        // careful.
        if (getDistanceTo(gank) <= 2 && canCharge() && willMeleeHit(gank)) melee(gank);
        else if (getDistanceTo(gank) <= 1) melee(gank);
        // If we can't hit our target of choice, we'll still hit a close by bot
        // (not chip or CPU)
        const close = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (getDistanceTo(close) <= 2 && canCharge() && willMeleeHit(close)) melee(close);
        else if (getDistanceTo(close) <= 1) melee(close);
    }
};
/**
 * A smart missile firing function that shoots at the enemy bot that is visible
 * with lowest health, if it is in range.
 */
const tryFireMissiles = function() {
    if (willMissilesHit()) {
        const gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (willMissilesHit(gank)) fireMissiles(gank);
        // If not, fire at anyone
        fireMissiles();
    }
};

const tryFireArtillery = function() {
    if (willArtilleryHit()) {
        const gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (willArtilleryHit(gank)) fireArtillery(gank);
        fireArtillery();
    }
};

const tryActivateSensors = function() {
    // Sensors last 3 turns and have 6 cooldown, so don't need to count turns
    // like we could with a shield.
    if (canActivateSensors()) activateSensors();
};

const tryCloak = function() {
    if (canCloak()) cloak();
};

const tryLayMine = function() {
    if (canLayMine()) layMine();
};

const tryReflect = function() {
    if (canReflect()) reflect();
};

const tryShieldSelf = function() {
    // TODO: we could wait longer if we have a shield already. But it could be
    // damaged so maybe better to refresh.
    if (canShield()) shield();
};

/**
 * Try shielding any allies within a certain range. This allows us to share
 * cooldown between bots.
 * @param range
 */
const tryShieldFriendlyBots = function(range: number) {
    if (canShield()) {
        // Try a few options.
        // First, lowest health
        tryShieldFriend(findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_LIFE, SORT_ASCENDING));
        // Closest
        tryShieldFriend(findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_DISTANCE, SORT_ASCENDING));
        // Anyone else? Shield 3 has a range of 5.
        array1 = findEntitiesInRange(IS_OWNED_BY_ME, BOT, false, range);
        for (let i = 0; i < size(array1); i++) {
            tryShieldFriend(array1[i]);
        }
    }
};

const tryShieldFriend = function(friend: Entity): void {
    // Not sure if canShield checks our shield range...
    if (!isShielded(friend) && canShield(friend)) shield(friend);
};

const tryTeleport = function(xCoord: number, yCoord: number): void {
    if (canTeleport(xCoord, yCoord)) teleport(xCoord, yCoord);
};

const tryZap = function() {
    if (canZap()) zap();
};
