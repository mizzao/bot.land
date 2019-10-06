/**
 * Smart melee bot. Can use melee, zapper, and other equipment in a smart way.
 * Coordinates movements with ranged DPS bots.
 */
const update = function() {
    // Equip when we see someone, not blindly
    const closestEnemyBot = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemyBot)) {
        setEnemySeen(closestEnemyBot);

        const enemyBotDistance = getDistanceTo(closestEnemyBot);
        // Zap first or shield first? The great debate. We rarely start zappers
        // next to bots because they will get killed too fast. Starting on
        // diagonals allows an extra turn to either start zap or arm a defense.
        //
        // - starting zap first: does damage right when enemies close, but can
        //   get killed faster
        // - starting defense first: lives longer, but takes longer to start damage
        if (enemyBotDistance < 2.8) {
            // a distance of 2 only hits diagonals
            // but charging melee units can close that quickly

            // TODO if we can cloak, we should probably wait zap after cloaking,
            // and possibly after some time.

            // TODO this is too late for teleporters, which hit us before we
            // zap. For teleporters we should have a version that cloaks as soon
            // as enemies are in sight.
            if (canZap()) zap();
        }

        if (enemyBotDistance < 5.1) {
            if (canCloak()) cloak();
            if (canReflect()) reflect();
            if (canShield()) shield();
        }
    }

    // Attack enemy bots over chips/CPU. This is a hack that forces melee bots
    // to go for enemy bots over structures. Attack priority will take care of
    // the rest.
    //
    // TODO this is undesirable behavior for ranged bots that also have melee
    const canRangeTarget =
        willMissilesHit() || willArtilleryHit() || willLasersHit();
    if (!canRangeTarget && canCharge()) {
        if (exists(closestEnemyBot) && !willMeleeHit(closestEnemyBot)) {
            pursue(closestEnemyBot);
        }
    }

    // whack priority for melee
    if (willMeleeHit()) {
        const gankTarget = findEntity(ENEMY, BOT, SORT_BY_LIFE, SORT_ASCENDING);
        if (getDistanceTo(gankTarget) <= 2 && canCharge()) melee(gankTarget);
        else if (getDistanceTo(gankTarget) <= 1) melee(gankTarget);
    }

    // Use zapper on structures, even if not fighting
    const closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemy)) {
        const enemyDistance = getDistanceTo(closestEnemy);
        if (enemyDistance < 2.1 && canZap()) zap();
    } else {
        // No enemies visible. Move with the team.
        defaultMove();
    }
};
