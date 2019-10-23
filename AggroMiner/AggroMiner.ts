/**
 * Aggro Miner
 *
 * Draws enemy units out and blows them to high heaven. Better in groups.
 *
 * Loadout: regen 3, thrusters 3, mine 1
 * To be tougher, can substitute armor for thrusters or regen.
 */
update = function() {
    // Controls EWMA limits: for mine-only we want to keep this pretty tight
    const TEAM_MIN_DIST = 2.5;
    const TEAM_MAX_DIST = 6;

    if (isAttacker) {
        attackerUpdateLocation(x, y);
        checkTeamCentroidMove(TEAM_MIN_DIST, TEAM_MAX_DIST);
    }

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
            if (!canLayMine()) figureItOut();
            else tryLayMine();
        } else {
            defenderMove();
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
            if (!canLayMine()) figureItOut();
            else tryLayMine();
        } else {
            defenderMove();
        }
    }

    // Now we know there's a bot nearby.
    setEnemySeen(closestEnemyBot);

    const allEnemyBots = findEntities(ENEMY, BOT, false);
    const numEnemyBots = size(allEnemyBots);
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    const allFriendlyBots = findEntities(IS_OWNED_BY_ME, BOT, true);
    const numFriendlyBots = size(allFriendlyBots);

    // Only evade lasers on defense. Otherwise, keeping enemy bots at range 5
    // will be fine with regen.
    if (numFriendlyBots < 6) tryEvadeLasers(closestEnemyBot, numEnemyBots, 5);

    if (enemyBotDistance < 5.1) {
        tryReflect();
        if (!isShielded()) tryShieldSelf();
        else tryShieldFriendlyBots(4);
    }

    // Generally evade anything closer than 5. Make it as hard to shoot as possible.
    const evadeThreshold = 5.1;

    if (enemyBotDistance < evadeThreshold) {
        // The mining continuum:
        // Further enemies = mine
        // Closer enemies = run (e.g. zappers)
        if (enemyBotDistance == 5) tryLayMine();
        else if (enemyBotDistance == 4 && percentChance(90)) tryLayMine();
        else if (enemyBotDistance == 3 && percentChance(60)) tryLayMine();
        else if (enemyBotDistance == 2 && percentChance(40)) tryLayMine();

        // Try evasive maneuvers
        // TODO: might be okay to just evade in a straight line here given regen
        tryEvadeEnemy(closestEnemyBot, numEnemyBots);
        // Can't evade, just mine
        tryLayMine();
        // If we can't run, we can whack someone as a last resort.
        tryMeleeSmart();
    }

    defaultMove();
};
