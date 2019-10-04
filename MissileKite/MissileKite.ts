// Missile micro.
// Good for dealing with those pesky melee/teleporting/zapper units.
// TODO: allow running right on the map as well as left.

// Default moving function.
// We use this in place of figureItOut() to avoid unwanted cloaks.
const defaultMove = function() {
    // React to enemy structures
    const closestEnemyChip = findEntity(
        ENEMY,
        CHIP,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemyChip)) {
        if (
            canMoveTo(closestEnemyChip) &&
            getDistanceTo(closestEnemyChip) > 1
        ) {
            pursue(closestEnemyChip);
        }
    }
    const enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(enemyCpu)) {
        if (canMoveTo(enemyCpu) && getDistanceTo(enemyCpu) > 1) {
            pursue(enemyCpu);
        }
    }

    // Take a look around
    if (canActivateSensors()) activateSensors();
    // TODO: do not pursue enemy bots > 5 away
    // Need to modify figureItOut for this

    // Movement code
    const destinationY = floor(arenaHeight / 2);
    if (isAttacker) {
        const destinationX = arenaWidth - 1;
        moveTo(destinationX, destinationY);
    } else {
        // Defender movement code.
        if (exists(sharedA)) {
            // Make sure we don't see anything
            if (canActivateSensors()) activateSensors();
            // Someone's at the left side of the arena and doesn't see any baddies.
            moveTo(arenaWidth - 2, destinationY);
        }

        // We're here but don't see anything. Let the boys know.
        const enemyX = 3;
        if (getDistanceTo(enemyX, destinationY) <= 1 && areSensorsActivated()) {
            sharedA = "clear";
        }
        moveTo(enemyX, destinationY);
    }
};

const update = function() {
    // Do we see anything nearby?
    const closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemy)) {
        if (canActivateSensors()) activateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    }

    const closestEnemyBot = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemyBot)) {
        // It's not a bot, so just attack blindly
        // DON'T use sensors here...gets us into trouble.
        // Just happily bash the Chip/CPU if the other bots hasn't noticed us.
        // Edge case: there is an artillery w/ sensors sitting on the other side.
        // if (canActivateSensors()) activateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    } else {
        // We have seen some enemies. Go toward the checkpoint
        sharedA = undefined;
    }

    // Protect against missiles/lasers if we have reflection
    if (canReflect()) reflect();
    // Maybe this loses advantage vs melee? Not if we're fast
    // if (canShield()) shield();

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    tryEvadeLasers(closestEnemyBot, numEnemyBots);

    // Prefer to be farther but occasionally shoot from closer
    let evadeThreshold;
    if (percentChance(40)) evadeThreshold = 2.9;
    else evadeThreshold = 3.1;

    // There's an enemy nearby but we can't attack it, or there are too many.
    // This assumes we are armed with artillery, which has min range 7, max range 10
    // 3 seems to keep us out of zapper range.
    if (enemyBotDistance < evadeThreshold) {
        debugLog(x + " " + y + " evading");

        // Cloak earlier if they are super close
        if (enemyBotDistance <= 1.6) {
            if (canCloak()) cloak();
        }

        // We're diagonally positioned from the enemy. Go in the direction with more space.
        // Prefer going backward to going forward, which can get us stuck.
        // TODO don't always run down from top left
        if (canMove("backward") && x <= closestEnemyBot.x) {
            move("backward");
        }
        // TODO we should move backward when there's one bot too
        // clean this code up
        if (canMove("up") && y <= closestEnemyBot.y) {
            move("up");
        }
        if (canMove("down") && y >= closestEnemyBot.y) {
            move("down");
        }
        if (canMove("backward")) {
            if (numEnemyBots > 1) move("backward");
        }
        if (canMove("forward") && x >= closestEnemyBot.x && numEnemyBots <= 1) {
            move("forward");
        }
        if (canMove("backward")) {
            move("backward");
        }

        // Can't move, last ditch cloak
        if (canCloak()) cloak();
        if (canShield()) shield();
    }

    // Shoot if we're out of evasive maneuvers
    // At the lowest health bot if possible
    if (willMissilesHit()) {
        const gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (getDistanceTo(gank) <= 4) fireMissiles(gank);
        fireMissiles();
    }

    defaultMove();
};
