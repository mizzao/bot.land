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
 * Attacker movement code works as follows:
 *
 * shared(A, B) records the centroid of the team. It is updated using a hacky
 * exponentially-weighted moving average. Certain units update and respond to
 * this EWMA (microing bots), while others just respond to it but don't update
 * (repair bots).
 *
 * For bots that care about being near the group, the further away they are from
 * this centroid the more they will be likely to move toward it.
 */
const attackerUpdateLocation = function(xCoord: number, yCoord: number): void {
    if (!isAttacker) return;

    // First turn update
    if (!exists(sharedA)) {
        sharedA = xCoord;
        sharedB = yCoord;
        return;
    }

    const alpha = 0.3;
    // This is a weird EWMA, because we don't know the number of bots (as they
    // die). With many bots it needs to be low enough that the average doesn't
    // jump around a lot, but with a single bot it needs to be high enough that
    // the bot can move around without impeding itself too much.
    sharedA = xCoord * alpha + sharedA * (1 - alpha);
    sharedB = yCoord * alpha + sharedB * (1 - alpha);
};

/**
 * We have seen some baddies. Setting this causes other bots to move accordingly
 * to the enemy's location.
 * @param enemy
 */
const setEnemySeen = function(enemy: Entity): void {
    // This is currently not used for attackers, and we don't want to bludgeon
    // the shared variables.
    if (isAttacker) return;

    // We store 2 locations (see README). Bots attack to whichever location is
    // closest to them, until cleared. Note that we are forced to use these
    // weird array1 and array2 variables to index into arrays.

    // Record 1st location if we don't already have one.
    loadArr1Loc1();
    if (size(array1) == 0) {
        array1 = [];
        array1[0] = enemy.x;
        array1[1] = enemy.y;
        saveArr1Loc1();
        return;
    }
    const locOneDiff = abs(enemy.x - array1[0]) + abs(enemy.y - array1[1]);
    // If it's sufficiently close, count it as the same "area" and just
    // update.
    if (locOneDiff < 6) {
        array1 = [];
        array1[0] = enemy.x;
        array1[1] = enemy.y;
        saveArr1Loc1();
        return;
    }

    // This seems like a different location. Do we have something recorded for location 2?
    loadArr2Loc2();
    if (size(array2) == 0) {
        array2 = [];
        array2[0] = enemy.x;
        array2[1] = enemy.y;
        saveArr2Loc2();
        return;
    }
    const locTwoDiff = abs(enemy.x - array2[0]) + abs(enemy.y - array2[1]);
    if (locTwoDiff < 8) {
        array2 = [];
        array2[0] = enemy.x;
        array2[1] = enemy.y;
        saveArr2Loc2();
        return;
    }

    // Shouldn't get here, but if so you're on your own...
};

// We'll just use array1 and array2 when working with the two locations so that
// there is no hope of confusing them. Note that crazy stuff can happen here
// since these variables can be overwritten in function calls.
const saveArr1Loc1 = function() {
    debugLog("enemy target 1 set at (" + array1[0] + "," + array1[1] + ")");
    sharedA = array1;
};
const saveArr2Loc2 = function() {
    debugLog("enemy target 2 set at (" + array2[0] + "," + array2[1] + ")");
    sharedB = array2;
};
// We cannot set an array to undefined, that causes a bug. So return empty array
// instead.
const loadArr1Loc1 = function() {
    if (!exists(sharedA)) array1 = [];
    else array1 = sharedA;
};
const loadArr2Loc2 = function() {
    if (!exists(sharedB)) array2 = [];
    else array2 = sharedB;
};
const clearLoc1 = function(): void {
    debugLog("enemy target 1 clear");
    array1 = [];
    sharedA = array1;
};
const clearLoc2 = function(): void {
    debugLog("enemy target 2 clear");
    array2 = [];
    sharedB = array2;
};

/**
 * If we don't see anyone, move to the closer of the two enemy locations, if
 * they exist. If we are close to one of the locations and no one's there,
 * specify that it is clear.
 */
const defenderMove = function(): void {
    const cpuX = arenaWidth - 2;
    const cpuY = floor(arenaHeight / 2);

    loadArr1Loc1();
    loadArr2Loc2();
    // If we're all balled up near the CPU, there's enough of us, and no one sees any
    // enemies, go out and investigate the chips and see if they're okay.
    if (
        size(array1) == 0 &&
        size(array2) == 0 &&
        getDistanceTo(cpuX, cpuY) <= 1
    ) {
        const allFriends = findEntitiesInRange(IS_OWNED_BY_ME, BOT, true, 3);
        const numFriends = size(allFriends);
        if (numFriends >= 6) {
            // XXX These are the locations of my chips in the level 3 defense
            array1 = [];
            array1[0] = cpuX - 4;
            array1[1] = cpuY - 3;
            saveArr1Loc1();
            array2 = [];
            array2[0] = cpuX - 4;
            array2[1] = cpuY + 3;
            saveArr2Loc2();
        }
    }

    // Check if we're close to either of the known enemy locations, and if we
    // don't see anyone there (with sensors) clear it.

    if (size(array1) > 0 && getDistanceTo(array1[0], array1[1]) <= 1) {
        tryActivateSensors();
        if (areSensorsActivated()) clearLoc1();
    }
    if (size(array2) > 0 && getDistanceTo(array2[0], array2[1]) <= 1) {
        tryActivateSensors();
        if (areSensorsActivated()) clearLoc2();
    }

    // Figure out where we're moving.
    if (size(array1) == 0 && size(array2) == 0) {
        moveTo(cpuX, cpuY);
    }
    if (size(array1) > 0 && size(array2) == 0) {
        moveTo(array1[0], array1[1]);
    }
    if (size(array2) > 0 && size(array1) == 0) {
        moveTo(array2[0], array2[1]);
    }

    // Both locations exist, attack to the closest one.
    const dist1 = getDistanceTo(array1[0], array1[1]);
    const dist2 = getDistanceTo(array2[0], array2[1]);

    if (dist1 == dist2 && percentChance(50)) moveTo(array1[0], array1[1]);
    else if (dist1 < dist2) moveTo(array1[0], array1[1]);
    else moveTo(array2[0], array2[1]);
};
