/**
 * The chaos zapper: a truly ridiculous unit.
 *
 * Suggested loadout:
 * - zapper 3 (or inferno zapper!?)
 * - reflect 3 or thrusters 3
 * - cloak 1
 *
 * It basically works like this:
 * Turn 0: cloak
 * Turn 2: reflect (cloak ends)
 * Turn 3: zap
 * Turn 8: (reflect ends)
 * Turn 9: cloak (zap ends)
 * Rinse and repeat.
 */
const update = function() {
    // The first thing of chaos zapping is to never disrupt the cycle. Always
    // get the counter and increment it before doing anything else.
    const CYCLEN = 9;
    let counter = getData();
    if (!exists(counter)) counter = 0; // First turn
    saveData((counter + 1) % CYCLEN);

    // This works because zap, cloak, and reflect have the same CD.
    // TODO: recover from situations like when we get EMPed.
    if (counter % CYCLEN == 0) {
        tryCloak();
    } else if (counter % CYCLEN == 2) {
        tryReflect();
    } else if (counter % CYCLEN == 3) {
        tryZap();
    }
    // Once that's out of the way, we can do other stuff.

    // Do we see anything nearby?
    const closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemy)) {
        tryActivateSensors();
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
        if (exists(enemyCpu)) tryActivateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    }

    // At this point we know there is an enemy bot nearby.
    setEnemySeen(closestEnemyBot);

    // Avoid lasers if we are unprotected; otherwise, welcome them!
    if (!isReflecting() && !isCloaked()) simpleEvadeLasers(closestEnemyBot);

    tryMeleeSmart();
    moveTo(closestEnemy);

    if (willMeleeHit()) melee();
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
