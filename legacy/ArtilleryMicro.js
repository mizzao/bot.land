distanceToCorner = function() {
    distTopLeft = x + y;
    distBotLeft = x + (arenaHeight - 1 - y);
    return min(distTopLeft, distBotLeft);
};

update = function() {
    // Do we see anything nearby?
    closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemy)) {
        // Nope, default behavior
        if (canActivateSensors()) activateSensors();

        // Sensors and still don't see anything? Go ahead
        // Otherwise, don't do something dumb
        if (areSensorsActivated()) figureItOut();
        else return;
    }

    if (canReflect()) {
        reflect();
    }

    // Something's nearby...can we whack it?
    if (willMeleeHit()) {
        // gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        // if (getDistanceTo(gank) <= 2 && canCharge()) melee(gank);
        // else if (getDistanceTo(gank) <= 1) melee(gank);
        melee();
    }

    closestEnemyBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (!exists(closestEnemyBot)) {
        // It's not a bot, so just attack blindly
        if (canActivateSensors()) activateSensors();

        if (areSensorsActivated()) figureItOut();
        else return;
    }

    allEnemyBots = findEntities(ENEMY, BOT, false);
    enemyBotDistance = getDistanceTo(closestEnemyBot);
    numEnemyBots = size(allEnemyBots);

    // Don't stand in range of lasers
    if (x == closestEnemyBot.x) {
        // TODO hack for fixing the bouncing back and forth issue
        if (enemyBotDistance >= 7) {
            if (y > closestEnemyBot.y && canMove("up")) move("up");
            else if (y < closestEnemyBot.y && canMove("down")) move("down");
        }
        // Otherwise, move sideways
        if (canMove("backward")) move("backward");
        if (canMove("forward")) move("forward");
    }
    if (y == closestEnemyBot.y) {
        // Move up or down randomly if both directions are available
        if (canMove("up") && canMove("down")) {
            if (percentChance(50)) move("up");
            move("down");
        }
        if (canMove("up")) move("up");
        if (canMove("down")) move("down");
    }

    // Not in melee range...can we shoot something if there aren't too many enemies around?
    // TODO add shared variable for retreating
    // TODO: if other artillery in range, don't stand still
    // TODO bug: will keep shooting at far enemy even if getting attacked by close enemy
    if (numEnemyBots <= 2) {
        if (willArtilleryHit()) {
            gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
            if (getDistanceTo(gank) <= 7) fireArtillery(gank);
            fireArtillery();
        }
    }

    // There's an enemy nearby but we can't attack it, or there are too many.
    // This assumes we are armed with artillery, which has min range 7, max range 10
    if (enemyBotDistance < 6.5) {
        debugLog(x + " " + y + " evading");
        // Too close for comfort, let's try to get away
        if (enemyBotDistance < 4 && canCloak()) {
            // If they're really close and we can cloak, do that
            cloak();
        }
        if (enemyBotDistance <= 4 && canReflect()) {
            // Protect against missiles if we have reflection
            reflect();
        }
        if (enemyBotDistance < 2.1 && canZap()) {
            zap();
        }

        if (enemyBotDistance <= 2 && !isCloaked() && canCharge()) {
            // We're backed into a corner. Charge!!
            pursue(closestEnemyBot);
        }

        cornerDist = distanceToCorner();
        // Charge more aggresively if cornered
        if (enemyBotDistance <= 3 && distanceToCorner <= 2 && canCharge()) {
            // We're backed into a corner. Charge!!
            pursue(closestEnemyBot);
        }

        // If the enemy somehow got close, we can shoot it some of the time
        // TODO better handle when we should shoot and when we should run
        if (
            enemyBotDistance <= 3 &&
            willMissilesHit() &&
            numEnemyBots <= 1 &&
            percentChance(50)
        ) {
            gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
            if (getDistanceTo(gank) <= 3) fireMissiles(gank);
            fireMissiles();
        }

        // Move away from the bot, preferably toward a border
        // TODO artillery needs to be able to move forward

        // We're diagonally (?) positioned from the enemy. Go in the direction with more space.
        if (canMove("backward") && x <= closestEnemyBot.x) {
            move("backward");
        }
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
    }

    if (willMissilesHit()) {
        gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (getDistanceTo(gank) <= 3) fireMissiles(gank);
        fireMissiles();
    }

    if (canActivateSensors()) activateSensors();
    // Random move
    move();
};
