/**
 * Missile micro: think Stalker micro from SC2.
 * Good for dealing with those pesky melee/teleporting/zapper units.
 *
 * Suggested loadout:
 * - missiles 3
 * - thrusters 3
 * - 1 in other equipment
 *
 * Situationally, this means...
 * - shield 1: is generally good all around
 * - zapper 1: good if cornered by melee units
 * - reflect 1: if fighting other missiles (this will generally dodge lasers)
 * - regen 1: if fighting slow (no thrusters) melee units
 */
const update = function() {
    // If it's the first round of the game, take a shot before anyone turns on
    // reflection. This is especially advantageous for defenders who seem to get
    // their turns first before attackers.
    //
    // TODO: this is janky because it depends on number of bots we have in the arena.
    let potshotThreshold = 5;
    if (isAttacker) potshotThreshold = 4;
    if (!exists(sharedE) || sharedE < potshotThreshold) {
        if (!exists(sharedE)) sharedE = 1;
        else sharedE = sharedE + 1;
        tryFireMissiles();
    }

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

    const allFriendlyBots = findEntities(IS_OWNED_BY_ME, BOT, true);
    const numFriendlyBots = size(allFriendlyBots);

    // Heuristic: on defense don't evade lasers, just let the tanks do that.
    if (numFriendlyBots < 5) tryEvadeLasers(closestEnemyBot, numEnemyBots);

    // Protect against missiles/lasers if we have reflection
    if (enemyBotDistance < 5.1) {
        tryReflect();
        tryShieldSelf();
    }

    // Prefer to be farther but shoot from closer when we have advantage
    // Farther is better to avoid zappers / inferno zappers, but does less damage
    // > 3 also avoids Level 2 and lower missiles, so we can kite those.
    // At least on bigger maps.

    let evadeThreshold = 3.1;
    // Under some conditions shoot from closer to get more shots:
    // - only one enemy bot (especially if there are more of us)
    // - we're getting backed into the wall (often ends up running around)
    // TODO update for attackers & defenders
    if (numEnemyBots <= 1 || x <= 2) evadeThreshold = 2.9;

    if (enemyBotDistance < evadeThreshold) {
        // Cloak earlier if they are super close
        if (enemyBotDistance < 2.1) {
            tryCloak();
            tryShieldSelf();
            // Sometimes it's better to just run
            if (canZap() && percentChance(50)) zap();
        }

        tryEvadeEnemy(closestEnemyBot, numEnemyBots);

        // Can't move, last ditch cloak
        tryCloak();
        tryShieldSelf();
        tryZap();
    }

    // Shoot if we're out of evasive maneuvers
    tryFireMissiles();

    defaultMove();
};
