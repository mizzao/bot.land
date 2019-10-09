/**
 * Missile micro: think Stalker micro from SC2. Good for dealing with those
 * pesky melee/teleporting/zapper units.
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
 * - mine 1
 *
 * Missiles 3, thrusters 2, shield 2 is possible to use against enemies with
 * high reflect and no thrusters (it saves 1 reflection).
 */
const update = function() {
    const state = getData();
    if (!exists(state)) {
        // Need to save in case we reach a terminator
        saveData("first turn done");
        // As defender, try to cast shield on anyone nearby
        if (!isAttacker && canShield()) {
            debugLog("Casting defender first turn shield");
            shieldTanks();
        }
        // If first turn of the game, take a shot before anyone turns on
        // reflection. This is especially advantageous for defenders who seem to
        // get their turns first before attackers (if not shielding above).
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
        // Missile micro bot usually has shield 1, which has range 3. But
        // sometimes we'll put shield 2 on it with lower thrusters.
        tryShieldFriendlyBots(4);
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
        tryShieldFriendlyBots(4);
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
    // Mine layers don't evade lasers, you want them to come follow in.
    if (!canLayMine() && numFriendlyBots < 5)
        tryEvadeLasers(closestEnemyBot, numEnemyBots);

    // Protect against missiles/lasers if we have reflection
    if (enemyBotDistance < 5.1) {
        tryReflect();
        if (!isShielded()) {
            tryShieldSelf();
        } else {
            tryShieldFriendlyBots(4);
        }
    }

    // Mine layers should not do it from too far, so they have time to lay mine
    if (enemyBotDistance < 4.1) tryLayMine();
    // When close: not every time, as this can cause us to slow down too much.
    if (enemyBotDistance < 3.1 && percentChance(30)) tryLayMine();

    // Prefer to be farther but shoot from closer when we have advantage
    // Farther is better to avoid zappers / inferno zappers, but does less damage
    // > 3 also avoids Level 2 and lower missiles, so we can kite those.
    // At least on bigger maps.

    let evadeThreshold = 3.1;
    // Under some conditions shoot from closer to get more shots:
    // - only one enemy bot (especially if there are more of us)
    // - we're getting backed into the wall (often ends up running around)
    //
    // TODO update for attackers & defenders
    // TODO defenders should always shoot if friendly bots >= 5, cuz DPS...don't run.
    // TODO evading at 2 can still be bad because damage from zappers
    if (numEnemyBots <= 1 || x <= 2) evadeThreshold = 2.9;

    if (enemyBotDistance < evadeThreshold) {
        if (percentChance(25)) tryLayMine();

        // Cloak earlier if they are super close
        if (enemyBotDistance < 2.1) {
            tryCloak();
            tryShieldSelf();
            // Sometimes it's better to just run
            if (canZap() && percentChance(50)) zap();
        }

        // TODO!! mine laying will work better if we don't always evade backward
        tryEvadeEnemy(closestEnemyBot, numEnemyBots);

        // Mine has a higer chance here but still need to run, bogs us down
        if (percentChance(45)) tryLayMine();

        // Can't move, last ditch cloak
        tryCloak();
        tryShieldSelf(); // re-boost our own shield if possible
        tryZap();
    }

    // Shoot if we're out of evasive maneuvers
    tryFireMissiles();

    defaultMove();
};

const shieldTanks = function() {
    // This is a hack but covers the current defense scenario. First, try to
    // cast shield on an entity immediately up to 3 cells in front of us.
    let i = 1;
    // Look for friends on same row
    for (i = 1; i <= 3; i++) {
        const maybeFriend = getEntityAt(x - i, y);
        if (exists(maybeFriend)) tryShieldFriend(maybeFriend);
    }
    // Look for friends on row above
    for (i = 1; i <= 3; i++) {
        const maybeFriend = getEntityAt(x - i, y - 1);
        if (exists(maybeFriend)) tryShieldFriend(maybeFriend);
    }
    // And row below
    for (i = 1; i <= 3; i++) {
        const maybeFriend = getEntityAt(x - i, y + 1);
        if (exists(maybeFriend)) tryShieldFriend(maybeFriend);
    }
    // If none of that worked, just shield whoever's closest
    tryShieldFriend(
        findEntity(IS_OWNED_BY_ME, BOT, SORT_BY_DISTANCE, SORT_ASCENDING)
    );
};
