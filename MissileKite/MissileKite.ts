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
    setEnemiesSeen();

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    tryEvadeLasers(closestEnemyBot, numEnemyBots);

    const allFriendlyBots = findEntities(IS_OWNED_BY_ME, BOT, true);
    const numFriendlyBots = size(allFriendlyBots);

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
    // If we're outnumbering them, willing to shoot from closer
    if (numFriendlyBots >= 3 && numEnemyBots <= 1) evadeThreshold = 2.9;

    if (enemyBotDistance < evadeThreshold) {
        // Cloak earlier if they are super close
        if (enemyBotDistance < 2.1) {
            tryCloak();
            tryShieldSelf();
            // Sometimes it's better to just run
            if (canZap() && percentChance(50)) zap();
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
        tryCloak();
        tryShieldSelf();
        tryZap();
    }

    // Shoot if we're out of evasive maneuvers
    tryFireMissiles();

    defaultMove();
};
