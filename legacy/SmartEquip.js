update = function() {
    // Equip when we see someone, not blindly
    closestEnemyBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestEnemyBot)) {
        enemyBotDistance = getDistanceTo(closestEnemyBot);
        // If we started the game within zap distance, do it immediately
        if (enemyBotDistance < 2.8) {
            // a distance of 2 only hits diagonals
            // but charging melee units can close that quickly
            // TODO if we can cloak, we should probably wait zap after cloaking, and possibly after some time.
            // TODO this is too late for teleporters, which hit us before we zap
            if (canZap()) zap();
        }
        if (enemyBotDistance < 5.1) {
            if (canCloak()) cloak();
            if (canReflect()) reflect();
            if (canShield()) shield();
        }
    }

    // Attack enemy bots over chips/CPU
    // This is a hack that forces melee bots to go for enemy
    // Attack priority will take care of the rest
    // TODO undesirable behavior for ranged bots that also have melee
    canRangeTarget = willMissilesHit() || willArtilleryHit() || willLasersHit();
    if (!canRangeTarget && canCharge()) {
        if (exists(closestEnemyBot) && !willMeleeHit(closestEnemyBot)) {
            pursue(closestEnemyBot);
        }
    }

    // whack priority
    if (willMeleeHit()) {
        gank = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (getDistanceTo(gank) <= 2 && canCharge()) melee(gank);
        else if (getDistanceTo(gank) <= 1) melee(gank);
    }

    // Use zapper on structures, even if not fighting
    closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemy)) {
        enemyDistance = getDistanceTo(closestEnemy);
        if (enemyDistance < 2.1 && canZap()) zap();
    }

    // TODO On defense, make movement coordinated with the rest of the "smart" bots
    figureItOut();
};
