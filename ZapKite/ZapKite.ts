/**
 * Zapper micro: a commando bot that tries to draw away individual melee units
 * and then slit their throats.
 *
 * Suggested loadout:
 * - zapper 2 (or inferno zapper!?)
 * - thrusters 2
 * - regen 2
 * - melee 1
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

        const enemyChip = findEntity(
            ENEMY,
            CHIP,
            SORT_BY_DISTANCE,
            SORT_ASCENDING
        );
        if (!exists(enemyChip) && !exists(enemyCpu) && lifePercent < 80) {
            // If we don't see anyone, just wait around for some regen
            // TODO check for regen? If the bot has no regen we will just sit around
            if (canMove("backward")) move("backward");
        }

        if (isAttacker) figureItOut();
        else defaultMove();
    }

    // At this point we know there is an enemy bot nearby.
    setEnemySeen(closestEnemyBot);

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    const allFriendlyBots = findEntities(IS_OWNED_BY_ME, BOT, true);
    const numFriendlyBots = size(allFriendlyBots);

    // Avoid walking down a street with lasers
    tryEvadeLasers(closestEnemyBot, numEnemyBots);

    // Protect against missiles/lasers if we have reflection
    if (enemyBotDistance < 5.1) {
        tryReflect();
        tryShieldSelf();
    }

    // We're going to be closing in shortly, so activate zap.
    // 1 turn to activate + 1 turn of enemies coming in -> in range.
    if (enemyBotDistance < 2.5) {
        tryZap();
    }

    // If one bot and enough health or outnumbering, attack.
    if (numEnemyBots == 1) {
        if (lifePercent > 60 || (numFriendlyBots >= 2 && lifePercent > 30)) {
            tryZap();
            tryMeleeSmart();
            moveTo(closestEnemy);
        }
    }

    // If we're cornered, attack.
    const distToBack = x;
    const distToSide = min(y, arenaHeight - 1 - y);
    if (distToBack + distToSide <= 2) {
        tryZap();
        tryMeleeSmart();
    }

    // Otherwise we should try to evade.
    tryEvadeEnemy(closestEnemy, numEnemyBots);

    // Here we have seen enemy bots, but not enough for the evade conditions above.
    tryShieldSelf();
    tryReflect();
    tryCloak();

    tryMeleeSmart();

    defaultMove();
};

const isValidXPos = function(xCoord: number): boolean {
    return xCoord >= 0 && xCoord < arenaWidth - 1;
};

const isValidYPos = function(yCoord: number): boolean {
    return yCoord >= 0 && yCoord < arenaHeight - 1;
};
