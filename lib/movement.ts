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
        const cpuX = arenaWidth - 1;
        const cpuY = floor(arenaHeight / 2);
        moveTo(cpuX, cpuY);
    } else {
        defenderMove();
    }
};

/**
 * We have seen some baddies. Setting this causes other bots to move accordingly
 * to the enemy's location.
 */
const setEnemySeen = function(enemy: Entity): void {
    // There are 5 shared variables, A-E.
    // - shared(A,B): location of one last seen enemy
    // - shared(C,D): location of second last seen enemy, that is not close to
    //   the first.
    //
    // Attack order: first enemy, second enemy (not close to first), finally
    // cpu.

    // Record 1st location if we don't already have one.
    if (!exists(sharedA)) {
        sharedA = enemy.x;
        sharedB = enemy.y;
        return;
    }
    const locOneDiff = abs(enemy.x - sharedA) + abs(enemy.y - sharedB);
    // If it's sufficiently close, count it as the same "area" and just
    // update.
    if (locOneDiff < 6) {
        sharedA = enemy.x;
        sharedB = enemy.y;
        return;
    }

    // This seems like a different location. Do we have something recorded for location 2?
    if (!exists(sharedC)) {
        sharedC = enemy.x;
        sharedD = enemy.y;
        return;
    }
    const locTwoDiff = abs(enemy.x - sharedC) + abs(enemy.y - sharedD);
    if (locTwoDiff < 8) {
        sharedC = enemy.x;
        sharedD = enemy.y;
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
    // Check if we're close to either of the known enemy locations, and if we
    // don't see anyone there (with sensors) clear it.
    if (exists(sharedA)) {
        if (getDistanceTo(sharedA, sharedB) <= 1) {
            tryActivateSensors();
            if (areSensorsActivated()) {
                sharedA = undefined;
                sharedB = undefined;
            }
        }
    }
    if (exists(sharedC)) {
        if (getDistanceTo(sharedC, sharedD) <= 1) {
            tryActivateSensors();
            if (areSensorsActivated()) {
                sharedC = undefined;
                sharedD = undefined;
            }
        }
    }

    const cpuX = arenaWidth - 1;
    const cpuY = floor(arenaHeight / 2);

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
