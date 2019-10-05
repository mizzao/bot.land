/**
 * Missile micro code from bot.land, before conversion to TypeScript.
 * Saved here as a backup.
 */

// Missile micro.
// Good for dealing with those pesky melee/teleporting/zapper units.
// TODO: allow running right on the map as well as left.

// Default moving function.
// We use this in place of figureItOut() to avoid unwanted cloaks.
defaultMove = function() {
    // React to enemy structures
    closestEnemyChip = findEntity(
        ENEMY,
        CHIP,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemyChip)) {
        if (
            canMoveTo(closestEnemyChip) &&
            getDistanceTo(closestEnemyChip) > 1
        ) {
            pursue(closestEnemyChip);
        }
    }
    closestEnemyBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestEnemyBot)) {
        if (canMoveTo(closestEnemyBot) && getDistanceTo(closestEnemyBot) > 1) {
            pursue(closestEnemyBot);
        }
    }
    enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(enemyCpu)) {
        if (canMoveTo(enemyCpu) && getDistanceTo(enemyCpu) > 1) {
            pursue(enemyCpu);
        }
    }

    // Take a look around
    if (canActivateSensors()) activateSensors();
    // TODO: do not pursue enemy bots > 5 away
    // Need to modify figureItOut for this

    // Movement code
    destinationY = floor(arenaHeight / 2);
    if (isAttacker) {
        destinationX = arenaWidth - 1;
        moveTo(destinationX, destinationY);
    } else {
        // Defender movement code.
        if (exists(sharedA)) {
            // Make sure we don't see anything
            if (canActivateSensors()) activateSensors();
            // Someone's at the left side of the arena and doesn't see any baddies.
            moveTo(arenaWidth - 2, destinationY);
        }

        // We're here but don't see anything. Let the boys know.
        enemyX = 2;
        if (getDistanceTo(enemyX, destinationY) <= 1 && areSensorsActivated()) {
            sharedA = "clear";
        }
        moveTo(enemyX, destinationY);
    }
};

tryEvadeLasers = function(closestEnemyBot, numEnemyBots) {
    enemyBotDistance = getDistanceTo(closestEnemyBot);
    // Don't stand in range of lasers
    // Move away from the bot, preferably toward a border
    if (x == closestEnemyBot.x && enemyBotDistance > 1) {
        // TODO hack for fixing the bouncing back and forth issue
        // get in diag range with missiles
        if (enemyBotDistance >= 4 && percentChance(50)) {
            if (y > closestEnemyBot.y && canMove("up")) move("up");
            else if (y < closestEnemyBot.y && canMove("down")) move("down");
        }
        if (canMove("backward")) move("backward");
        if (canMove("forward") && numEnemyBots <= 1) move("forward");
    }
    if (y == closestEnemyBot.y && enemyBotDistance > 1) {
        // Move up or down randomly if both directions are available
        if (canMove("up") && canMove("down")) {
            if (percentChance(50)) move("up");
            move("down");
        }
        if (canMove("up")) move("up");
        if (canMove("down")) move("down");
    }
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
        if (canActivateSensors()) activateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    }

    closestEnemyBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (!exists(closestEnemyBot)) {
        // Only thing left here is a chip.
        // DON'T always use sensors here...gets us into trouble.
        // Just happily bash the Chip if the other bots hasn't noticed us.
        // If we're bashing a CPU though, then don't let artillery shoot us from out of range.
        enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
        if (exists(enemyCpu) && canActivateSensors()) activateSensors();
        if (isAttacker) figureItOut();
        else defaultMove();
    }

    // We have seen some enemies. Go toward the checkpoint
    sharedA = undefined;

    allEnemyBots = findEntities(ENEMY, BOT, false);
    numEnemyBots = size(allEnemyBots);
    enemyBotDistance = getDistanceTo(closestEnemyBot);

    tryEvadeLasers(closestEnemyBot, numEnemyBots);

    // Protect against missiles/lasers if we have reflection
    if (enemyBotDistance < 5.1) {
        if (canReflect()) reflect();
        if (canShield()) shield();
    }

    // Prefer to be farther but occasionally shoot from closer
    // Farther is better to avoid zappers / inferno zappers, but does less damage
    // > 3 also avoids Level 2 and lower missiles, so we can kite those.
    // At least on bigger maps.

    if (percentChance(40)) evadeThreshold = 2.9;
    else evadeThreshold = 3.1;
    // evadeThreshold = 3.1;

    // There's an enemy nearby but we can't attack it, or there are too many.
    // This assumes we are armed with artillery, which has min range 7, max range 10
    // 3 seems to keep us out of zapper range.
    if (enemyBotDistance < evadeThreshold) {
        debugLog(x + " " + y + " evading");

        // Cloak earlier if they are super close
        if (enemyBotDistance < 2.1) {
            if (canCloak()) cloak();
            if (canShield()) shield();
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
        if (canCloak()) cloak();
        if (canShield()) shield();
        if (canZap()) zap();
    }

    // Shoot if we're out of evasive maneuvers
    // At the lowest health bot if possible
    if (willMissilesHit()) {
        gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (getDistanceTo(gank) <= 4) fireMissiles(gank);
        fireMissiles();
    }

    defaultMove();
};
