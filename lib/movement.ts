/**
 * Default moving function, to be called if a specific script has no opinion. We
 * use this in place of figureItOut() to avoid unwanted premature utility
 * activations. Assumes the script will generally deal with enemies if they get
 * in range.
 */
const defaultMove = function() {
    // React to enemy structures
    const closestEnemyChip = findEntity(
        ENEMY,
        CHIP,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemyChip)) {
        if (canMoveTo(closestEnemyChip) && getDistanceTo(closestEnemyChip) > 1)
            pursue(closestEnemyChip);
    }
    // Bots come after structures, if the script didn't react to it already
    const closestEnemyBot = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemyBot)) {
        if (canMoveTo(closestEnemyBot) && getDistanceTo(closestEnemyBot) > 1) {
            pursue(closestEnemyBot);
        }
    }
    // CPU comes last
    const enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(enemyCpu)) {
        if (canMoveTo(enemyCpu) && getDistanceTo(enemyCpu) > 1) {
            pursue(enemyCpu);
        }
    }

    // If we don't see anything, take a look around
    if (canActivateSensors()) activateSensors();
    // TODO: do not pursue enemy bots > 5 away (?)
    // Need to modify figureItOut for this

    // Where to go?
    if (isAttacker) {
        moveToCPU();
    } else {
        defenderMove();
    }
};

const moveToCPU = function() {
    const cpuX = arenaWidth - 2;
    const cpuY = floor(arenaHeight / 2);
    moveTo(cpuX, cpuY);
};

/**
 * We have seen some baddies. Setting this causes other bots to move accordingly
 * to the enemy's location.
 * @returns true if we should disengage from chasing this bot.
 */
const markEnemyLocation = function(
    enemy: Entity,
    distToEnemy: number,
    totalEnemies: number
): boolean {
    let targetX = enemy.x;
    let targetY = enemy.y;

    // First decide if we should pursue this enemy. The risks to pursuing are
    // lures and landmines. When bots are far left on the map, we'll only mark a
    // bot's location for pursuit if someone sees either more than one bot, or
    // target is <= 2 hexes away from someone. If neither of these are true,
    // don't try to pursue.

    // For 13x17 maps this is 16 // 3 = 5.
    const pursuitBoundary = floor(arenaWidth / 3);
    if (targetX < pursuitBoundary && distToEnemy > 2 && totalEnemies == 1)
        return true;

    // If we see a target at the top or bottom edge of the map, assume they're
    // trying to rush the CPU and set intercept accordingly.
    if (targetX >= arenaWidth - 1 - 4) {
        const cpuX = arenaWidth - 2;
        const cpuY = floor(arenaHeight / 2);
        if (targetY <= 0 + 1) {
            targetX = cpuX;
            targetY = cpuY - 5;
        }
        if (targetY >= arenaHeight - 1 - 1) {
            targetX = cpuX;
            targetY = cpuY + 5;
        }
    }

    // There are 5 shared variables, A-E.
    // - shared(A,B): location of one last seen enemy
    // - shared(C,D): location of second last seen enemy, that is not close to
    //   the first.
    //
    // Attack order: first enemy, second enemy (not close to first), finally
    // cpu.

    // Record 1st location if we don't already have one.
    if (!exists(sharedA)) {
        sharedA = targetX;
        sharedB = targetY;
        return;
    }
    const locOneDiff = abs(targetX - sharedA) + abs(targetY - sharedB);
    // If it's sufficiently close, count it as the same "area" and just
    // update.
    if (locOneDiff < 6) {
        sharedA = targetX;
        sharedB = targetY;
        return;
    }

    // This seems like a different location. Do we have something recorded for location 2?
    if (!exists(sharedC)) {
        sharedC = targetX;
        sharedD = targetY;
        return;
    }
    const locTwoDiff = abs(targetX - sharedC) + abs(targetY - sharedD);
    if (locTwoDiff < 8) {
        sharedC = targetX;
        sharedD = targetY;
        return;
    }

    // Shouldn't get here, but if so you're on your own...
};

/**
 * If we don't see anyone, move to the closer of the two enemy locations, if
 * they exist. If we are close to one of the locations and no one's there,
 * specify that it is clear.
 */
const defenderMove = function(): void {
    const cpuX = arenaWidth - 2;
    const cpuY = floor(arenaHeight / 2);

    // If we're all balled up near the CPU, there's enough of us, and no one sees any
    // enemies, go out and investigate the chips and see if they're okay.
    if (
        !exists(sharedA) &&
        !exists(sharedC) &&
        getDistanceTo(cpuX, cpuY) <= 1
    ) {
        const allFriends = findEntitiesInRange(IS_OWNED_BY_ME, BOT, true, 3);
        const numFriends = size(allFriends);
        if (numFriends >= 6) {
            // XXX These are the locations of my chips in the level 3 defense
            sharedA = cpuX - 4;
            sharedB = cpuY - 3;
            sharedC = cpuX - 4;
            sharedD = cpuY + 3;
        }
    }

    // Check if we're close to either of the known enemy locations, and if we
    // don't see anyone there (with sensors) clear it.
    if (exists(sharedA)) {
        if (getDistanceTo(sharedA, sharedB) <= 2) {
            tryActivateSensors();
            if (areSensorsActivated()) {
                sharedA = undefined;
                sharedB = undefined;
            }
        }
    }
    if (exists(sharedC)) {
        if (getDistanceTo(sharedC, sharedD) <= 2) {
            tryActivateSensors();
            if (areSensorsActivated()) {
                sharedC = undefined;
                sharedD = undefined;
            }
        }
    }

    if (!exists(sharedA) && !exists(sharedC)) {
        moveTo(cpuX, cpuY);
    }
    if (exists(sharedA) && !exists(sharedC)) {
        moveTo(sharedA, sharedB);
    }
    if (exists(sharedC) && !exists(sharedA)) {
        moveTo(sharedC, sharedD);
    }

    // Both locations exist, attack to the closest one.
    const dist1 = getDistanceTo(sharedA, sharedB);
    const dist2 = getDistanceTo(sharedC, sharedD);

    if (dist1 == dist2 && percentChance(50)) moveTo(sharedA, sharedB);
    else if (dist1 < dist2) moveTo(sharedA, sharedB);
    else moveTo(sharedC, sharedD);
};
