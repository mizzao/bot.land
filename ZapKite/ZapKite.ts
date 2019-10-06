/**
 * Zapper micro: a shorter-ranged version of Missile kiting. It aims to keep
 * opponents at a (1,1) diagonal away, while activating zap and reflection. This
 * avoids lasers, moves too much for artillery, can only be melee'd with charge,
 * and of course reflects missiles. Zap only does 50% of the damage, but any
 * enemy dumb enough to walk next to this unit will get the full damage, upon
 * which it will skittle away.
 *
 * Suggested loadout:
 * - zapper 3 (or inferno zapper!?)
 * - thrusters 3 or 2
 * - reflection 1 or 2
 */
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
        // Only thing left here is a chip.
        // DON'T always use sensors here...gets us into trouble.
        // Just happily bash the Chip if the other bots hasn't noticed us.
        // If we're bashing a CPU though, then don't let artillery shoot us from out of range.
        const enemyCpu = findEntity(
            ENEMY,
            CPU,
            SORT_BY_DISTANCE,
            SORT_ASCENDING
        );
        if (exists(enemyCpu) && canActivateSensors()) activateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    }

    // At this point we know there is an enemy bot nearby.
    setEnemySeen(closestEnemyBot);

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    // Avoid walking down a street with lasers...even with reflect on!
    simpleEvadeLasers(closestEnemyBot);

    // Protect against missiles/lasers if we have reflection
    if (enemyBotDistance < 5.1) {
        tryReflect();
        tryShieldSelf();
    }

    // We're going to be closing in shortly, so activate zap.
    // 1 turn to activate + 1 turn of enemies coming in -> in range.
    if (enemyBotDistance < 3.1) {
        tryZap();
    }

    // The logic here is pretty simple: if we see an enemy, they're either too
    // close (right next to us), or too far away. The ideal position is (1,1)
    // off from where we are.

    // If we need to move closer, close the long number first. At least for now,
    // because of the avoid lasers code above, we won't be on the same
    // row/column as an enemy.
    if (enemyBotDistance > 1) {
        const xDist = abs(x - closestEnemyBot.x);
        const yDist = abs(y - closestEnemyBot.y);
        // If they're the same, prefer moving horizontally (usually more room);
        if (xDist >= yDist) {
            // Shouldn't be anything in the way here...maybe cloakers?
            moveTo(closestEnemyBot.x, y);
        } else {
            moveTo(x, closestEnemyBot.y);
        }
    }

    // If they're right next to us, we need to move diagonally. For example, if
    // the enemy is right above us, we can go left or right. If either of those
    // positions has no enemy next to it, we should move. If neither works, we
    // can go down.

    // TODO we start with simple case first, can do the enemy counting later.
    if (enemyBotDistance <= 1) {
        // Case 1: they are on top/bottom case
        if (x == closestEnemyBot.x) {
            const leftX = x - 1;
            const rightX = x + 1;
            const backY = y - (closestEnemyBot.y - y);
            const leftValid =
                isValidXPos(leftX) && !exists(getEntityAt(leftX, y));
            const rightValid =
                isValidXPos(rightX) && !exists(getEntityAt(rightX, y));
            const backValid =
                isValidYPos(backY) && !exists(getEntityAt(x, backY));
            if (leftValid && rightValid) {
                if (percentChance(50)) moveTo(leftX, y);
                else moveTo(rightX, y);
            } else if (leftValid) moveTo(leftX, y);
            else if (rightValid) moveTo(rightX, y);
            else if (backValid) moveTo(x, backY);
        }
        // Case 2: they are on left/right
        else if (y == closestEnemyBot.y) {
            const topY = y - 1;
            const botY = y + 1;
            const backX = x - (closestEnemyBot.x - x);
            const topValid = isValidYPos(topY) && !exists(getEntityAt(x, topY));
            const botValid = isValidYPos(botY) && !exists(getEntityAt(x, botY));
            const backValid =
                isValidXPos(backX) && !exists(getEntityAt(backX, y));
            if (topValid && botValid) {
                if (percentChance(50)) moveTo(x, topY);
                else moveTo(x, botY);
            } else if (topValid) moveTo(x, topY);
            else if (botValid) moveTo(x, botY);
            else if (backValid) moveTo(backX, y);
        }

        // Should not get here, but last ditch efforts
        tryCloak();
        tryReflect();
        tryShieldSelf();
        tryZap();
    }

    // TODO any weapons to use here?
    defaultMove();
};

const simpleEvadeLasers = function(closestEnemyBot: Entity) {
    const enemyBotDistance = getDistanceTo(closestEnemyBot);
    if (enemyBotDistance < 2) return;
    // Don't stand in range of lasers
    if (x == closestEnemyBot.x) {
        // With missile micro we could bounce back and forth, but that's what we want here!
        if (canMove("backward") && canMove("forward")) {
            if (percentChance(50)) move("backward");
            move("forward");
        }
        if (canMove("backward")) move("backward");
        if (canMove("forward")) move("forward");
    }
    if (y == closestEnemyBot.y) {
        // Move up or down randomly if both directions are available
        if (canMove("up") && canMove("down")) {
            if (percentChance(50)) move("up");
            move("down");
        }
        if (canMove("up")) move("up");
        if (canMove("down")) move("down");
    }
};

const isValidXPos = function(xCoord: number): boolean {
    return xCoord >= 0 && xCoord < arenaWidth - 1;
};

const isValidYPos = function(yCoord: number): boolean {
    return yCoord >= 0 && yCoord < arenaHeight - 1;
};
