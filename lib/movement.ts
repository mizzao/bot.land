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
    const middleY = floor(arenaHeight / 2);
    if (isAttacker) {
        const destinationX = arenaWidth - 1;
        moveTo(destinationX, middleY);
    } else {
        // Defender movement code.
        if (areEnemiesClear()) {
            // Make sure we don't see anything
            if (canActivateSensors()) activateSensors();
            // Someone's at the left side of the arena and doesn't see any baddies.
            moveTo(arenaWidth - 2, middleY);
        }

        // We're here but don't see anything. Let the boys know.
        const leftX = 2;
        if (getDistanceTo(leftX, middleY) <= 1 && areSensorsActivated()) {
            setEnemiesClear();
        }
        moveTo(leftX, middleY);
    }
};

/**
 * We have seen some baddies. Setting this causes other bots to move accordingly
 * to the checkpoint above.
 */
const setEnemiesSeen = function(): void {
    sharedA = undefined;
};

/**
 * We're at the checkpoint and don't see any enemies, everyone go home.
 */
const setEnemiesClear = function(): void {
    sharedA = "clear";
};

/**
 * Have we seen enemies recently?
 */
const areEnemiesClear = function(): boolean {
    return sharedA == "clear";
};
