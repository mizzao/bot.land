/**
 * Micro artillery
 *
 * Defense loadout: artillery 3, shield/reflect 3, thrusters 1
 * Offense loadout: artillery 2, regen 3, thrusters 1, mine 1
 */
const update = function() {
    // Controls whether artillery attack without sensors
    const AGGRESSIVE = false;

    attackerUpdateLocation(x, y);

    // TODO artillery potshot? It's less important because it probably won't
    // hit anything.

    // Do we see anything nearby?
    const closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemy)) {
        tryShieldFriendlyBots(4);
        // If we don't see anything and can activate sensors, go ahead.
        tryActivateSensors();
        // Sensors and still don't see anything?
        // Defenders can be more aggresive, attackers have mines.
        if (isAttacker) {
            // We have landmines, no more need to wait for sensors
            if (AGGRESSIVE) figureItOut();
            // But this is useful for dealing with other artillery
            else if (areSensorsActivated()) figureItOut();
            // This is important to stop artillery from being effin slow
            else if (!canLayMine()) figureItOut();
            else tryLayMine();
        } else {
            defenderMove(true);
        }
    }

    const closestEnemyBot = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemyBot)) {
        tryShieldFriendlyBots(4);
        tryActivateSensors();
        if (isAttacker) {
            if (AGGRESSIVE) figureItOut();
            else if (areSensorsActivated()) figureItOut();
            else if (!canLayMine()) figureItOut();
            else tryLayMine();
        } else {
            defenderMove(true);
        }
    }

    // Now we know there's a bot nearby.
    setEnemySeen(closestEnemyBot);

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    const allFriendlyBots = findEntities(IS_OWNED_BY_ME, BOT, true);
    const numFriendlyBots = size(allFriendlyBots);

    // Don't stand in range of lasers. On defense when there are lots of allies,
    // don't evade lasers though, just let the tanks reflect them. Welcome
    // lasers if we have mines.
    if (!canLayMine() && numFriendlyBots < 6)
        tryEvadeLasers(closestEnemyBot, numEnemyBots, 5);

    if (enemyBotDistance < 5.1) {
        tryReflect();
        if (!isShielded()) tryShieldSelf();
        else tryShieldFriendlyBots(4);
    }

    // Not in melee range...can we shoot something if there aren't too many enemies around?
    // TODO add shared variable for retreating
    // TODO: if other artillery in range, don't stand still
    // TODO bug: will keep shooting at far enemy even if getting attacked by close enemy
    // TODO only for attacker do we count the bots here
    // Shoot if we see less than 2 enemies, or we're defending with buddies
    if (numEnemyBots <= 2 || (!isAttacker && numFriendlyBots >= 5)) {
        tryFireArtillery();
    }
    // I think we can ignore all the above and always shoot, cause landmines
    // Should we even have this code up here?

    // Generally evade anything closer than 5. On defense we have tanks, on
    // attack we have mines.
    let evadeThreshold = 6.5;
    if (AGGRESSIVE) evadeThreshold = 4.5;

    // There's an enemy nearby but we can't attack it, or there are too many.
    // Artillery has min range 5, max range 7
    if (enemyBotDistance < evadeThreshold) {
        // This is reversed from missiles. Because artillery has no short range it
        // should definitely mine when enemies get close.
        if (enemyBotDistance < 3.1 && percentChance(80)) tryLayMine();
        else if (enemyBotDistance <= 4.1 && percentChance(50)) tryLayMine();

        // Try evasive maneuvers
        tryEvadeEnemy(closestEnemyBot, numEnemyBots);
        // Can't evade, just mine
        tryLayMine();
    }

    tryFireArtillery();
    tryActivateSensors();
    defaultMove(true);
};
