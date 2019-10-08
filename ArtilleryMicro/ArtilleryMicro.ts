/**
 * Micro artillery
 *
 * Defense loadout: artillery 3, shield 3, thrusters 1
 * Offense loadout: artillery 3, regen 3, thrusters 1
 */
const update = function() {
    attackerUpdateLocation(x, y);

    // TODO artillery potshot? It's less important because it probably won't
    // hit.

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
        // Defenders can be more aggresive than attackers.
        if (isAttacker) {
            // Half the time don't advance without sensors
            if (areSensorsActivated() || percentChance(50)) defaultMove();
            else return;
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
            if (areSensorsActivated() || percentChance(50)) defaultMove();
            else return;
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

    if (enemyBotDistance < 5.1) {
        tryReflect();
        if (!isShielded()) tryShieldSelf();
        else tryShieldFriendlyBots(4);
    }

    // Don't stand in range of lasers. On defense when there are lots of allies,
    // don't evade lasers, just let the tanks reflect them.
    if (numFriendlyBots < 6) tryEvadeLasers(closestEnemyBot, numEnemyBots, 7);

    // If we're cornered and have melee we can try to whack it. This will
    // probably become obsolete though.
    tryMeleeSmart();
    if (willMeleeHit()) melee();

    // Not in melee range...can we shoot something if there aren't too many enemies around?
    // TODO add shared variable for retreating
    // TODO: if other artillery in range, don't stand still
    // TODO bug: will keep shooting at far enemy even if getting attacked by close enemy
    // TODO only for attacker do we count the bots here
    // Shoot if we see less than 2 enemies, or we're defending with buddies
    if (numEnemyBots <= 2 || (!isAttacker && numFriendlyBots >= 5)) {
        tryFireArtillery();
    }

    let evadeThreshold = 6.5;
    // On defense we can just stay at max range
    if (!isAttacker) evadeThreshold = 4.5;

    // There's an enemy nearby but we can't attack it, or there are too many.
    // Artillery has min range 5, max range 7
    if (enemyBotDistance < evadeThreshold) {
        // TODO a lot of this code is equipment that artillery won't have, now
        // that we are planning support units; it should be cleaned up.

        // Protect against missiles if we have reflection
        if (enemyBotDistance <= 4) tryReflect();
        // If they're really close and we can cloak, do that
        if (enemyBotDistance < 4) tryCloak();

        if (enemyBotDistance < 2.1) tryZap();

        if (enemyBotDistance <= 2 && !isCloaked() && canCharge()) {
            // We're backed into a corner. Charge!!
            // We'll have already tried melee above, so here we'd just move
            // toward it.
            pursue(closestEnemyBot);
        }

        const cornerDist = distanceToCorner();
        // Charge more aggresively if cornered
        if (
            enemyBotDistance <= 3 &&
            cornerDist <= 2 &&
            !isCloaked &&
            canCharge()
        ) {
            // We're backed into a corner. Charge!!
            pursue(closestEnemyBot);
        }

        // If the enemy somehow got close, we can shoot it some of the time
        // TODO better handle when we should shoot and when we should run
        if (enemyBotDistance <= 3 && numEnemyBots <= 1 && percentChance(50))
            tryFireMissiles();

        // Try evasive maneuvers
        tryEvadeEnemy(closestEnemyBot, numEnemyBots);
    }

    tryFireArtillery();
    tryActivateSensors();

    defaultMove(true);
};

const distanceToCorner = function(): number {
    const distTopLeft = x + y;
    const distBotLeft = x + (arenaHeight - 1 - y);
    return min(distTopLeft, distBotLeft);
};
