import { getData, isNumber, saveData } from './data'
import { tryActivateSensors } from './utils'

/**
 * Default moving function, to be called if a specific script has no opinion. We
 * use this in place of figureItOut() to avoid unwanted premature utility
 * activations. Assumes the script will generally deal with enemies if they get
 * in range.
 *
 * @param isArtillery if artillery, will not move <5 units from target.
 */
export const defaultMove = function(isArtillery?: boolean) {
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
        const dist = getDistanceTo(closestEnemyBot);
        if (canMoveTo(closestEnemyBot) && dist > 1) {
            if (isArtillery && dist <= 5) return;
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
        if (isArtillery && getDistanceTo(cpuX, cpuY) <= 5) return;
        moveTo(cpuX, cpuY);
    } else {
        defenderMove(isArtillery);
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
export const attackerUpdateLocation = function(xCoord: number, yCoord: number): void {
    if (!isAttacker) return;
    // All bots update a shared counter, so by looking at it since our last turn
    // we know how many bots are alive, hence the weight to update the EWMA.

    // Increment the shared counter. 4 is a reasonable starting weight because
    // that's how many bots we often have.
    const DEFAULT_STARTING_BOTS = 4;
    if (!exists(sharedC)) sharedC = DEFAULT_STARTING_BOTS - 1;
    sharedC = sharedC + 1;

    let myCounter = getData();
    if (!isNumber(myCounter)) myCounter = sharedC - DEFAULT_STARTING_BOTS;
    saveData(sharedC);

    // TODO bots seem to be updated in a random order. But that's okay, if it
    // nets out to the right average.
    const numFriendsAlive = sharedC - myCounter;
    debugLog("I see " + numFriendsAlive + " friends alive");

    // First turn update
    if (!exists(sharedA)) {
        sharedA = xCoord;
        sharedB = yCoord;
        return;
    }

    const alpha = 1.0 / numFriendsAlive;
    sharedA = xCoord * alpha + sharedA * (1 - alpha);
    sharedB = yCoord * alpha + sharedB * (1 - alpha);
};

export const checkTeamCentroidMove = function(minDist: number, maxDist: number) {
    if (!isAttacker) return;
    // Distances in bot land are manhattan distance
    const distToCentroid = abs(x - sharedA) + abs(y - sharedB);

    debugLog(
        "My ",
        x,
        y,
        " is ",
        distToCentroid,
        " from the center",
        sharedA,
        sharedB
    );
    debugLog("Limits: ", minDist, maxDist);

    // If within minDist of centroid it's good. Beyond maxDist of centroid 100%
    // move toward centroid. Linear in between.
    const forceMoveProbability =
        (distToCentroid - minDist) / (maxDist - minDist);
    const forceMoveChance = min(100, max(0, 100 * forceMoveProbability));
    debugLog("Moving to centroid with probability", forceMoveChance);

    if (percentChance(forceMoveChance)) moveTo(round(sharedA), round(sharedB));
};

/**
 * We have seen some baddies. Setting this causes other bots to move accordingly
 * to the enemy's location.
 * @param enemy
 */
export const setEnemySeen = function(enemy: Entity): void {
    // This is only used for defenders, at the moment, so avoid clobbering the
    // shared variables that are currently used by attackers.
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
export const saveArr1Loc1 = function() {
    debugLog("enemy target 1 set at (" + array1[0] + "," + array1[1] + ")");
    sharedA = array1;
};
export const saveArr2Loc2 = function() {
    debugLog("enemy target 2 set at (" + array2[0] + "," + array2[1] + ")");
    sharedB = array2;
};
// We cannot set an array to undefined, that causes a bug. So return empty array
// instead.
export const loadArr1Loc1 = function() {
    if (!exists(sharedA)) array1 = [];
    else array1 = sharedA;
};
export const loadArr2Loc2 = function() {
    if (!exists(sharedB)) array2 = [];
    else array2 = sharedB;
};
export const clearLoc1 = function(): void {
    debugLog("enemy target 1 clear");
    array1 = [];
    sharedA = array1;
};
export const clearLoc2 = function(): void {
    debugLog("enemy target 2 clear");
    array2 = [];
    sharedB = array2;
};

/**
 * If we don't see anyone, move to the closer of the two enemy locations, if
 * they exist. If we are close to one of the locations and no one's there,
 * specify that it is clear.
 *
 * @param isArtillery
 */
export const defenderMove = function(isArtillery?: boolean): void {
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
    // TODO: artillery should be able to clear targets too.
    if (size(array1) > 0 && getDistanceTo(array1[0], array1[1]) <= 1) {
        tryActivateSensors();
        if (areSensorsActivated()) clearLoc1();
    }
    if (size(array2) > 0 && getDistanceTo(array2[0], array2[1]) <= 1) {
        tryActivateSensors();
        if (areSensorsActivated()) clearLoc2();
    }

    // Default size(array1) == 0 && size(array2) == 0
    let targetX = cpuX;
    let targetY = cpuY;

    // Figure out where we're moving.
    if (size(array1) > 0 && size(array2) === 0) {
        targetX = array1[0];
        targetY = array1[1];
    }
    if (size(array2) > 0 && size(array1) === 0) {
        targetX = array2[0];
        targetY = array2[1];
    }
    if (size(array1) > 0 && size(array2) > 0) {
        // Both locations exist, attack to the closest one.
        const dist1 = getDistanceTo(array1[0], array1[1]);
        const dist2 = getDistanceTo(array2[0], array2[1]);

        if (dist1 < dist2 || (dist1 == dist2 && percentChance(50))) {
            targetX = array1[0];
            targetY = array1[1];
        } else {
            targetX = array2[0];
            targetY = array2[1];
        }
    }

    // Artillery should not get too close.
    if (isArtillery && getDistanceTo(targetX, targetY) <= 5) return;
    moveTo(targetX, targetY);
};
