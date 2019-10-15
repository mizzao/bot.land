/**
 * Smart melee bot. Can use melee, zapper, and other equipment in a smart way.
 * Coordinates movements with ranged DPS bots.
 *
 * Note that when using thrusters with zapper, damage is dealt every time the
 * bot moves. So effective DPS can be twice as high (!!) as with normal zapper.
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
        // - starting defense first: lives longer, but takes longer to start
        //   damage. Is okay if we generally start diagonally.
        //
        // For now: defenders zap first. Attackers turn on defenses first.
        if (isAttacker) {
            checkDefenseActivation(enemyBotDistance);
            checkZapActivation(enemyBotDistance);
        } else {
            // defender
            checkZapActivation(enemyBotDistance);
            checkDefenseActivation(enemyBotDistance);

            // Hack for evading (dumb, straight-line) miners on defense. Just
            // jump to a different row to pursue them. 2 or less and we are in
            // charge range, so no evasion needed.
            const allEnemyBots = findEntities(ENEMY, BOT, false);
            const numEnemyBots = size(allEnemyBots);
            if (numEnemyBots == 1)
                tryEvadeMiners(closestEnemyBot, enemyBotDistance);
        }
    }

    // Whether or not we see enemies...check if there are friendly bots nearby
    // that can be shielded. This lets us share cooldown. Note this happens
    // after shielding self (above) in the presence of enemies. This allows
    // shield zappers to support reflecting zappers!
    tryShieldFriendlyBots(5);

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

    // whack priority for melee (this will only hit bots)
    tryMeleeSmart();

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
        figureItOut();
    } else {
        // No enemies visible. Move with the team.
        defaultMove();
    }
};

const checkDefenseActivation = function(enemyBotDistance: number): void {
    if (enemyBotDistance < 5.1) {
        if (canCloak()) cloak();
        if (canReflect()) reflect();
        if (canShield() && !isShielded()) shield();
    }
};

const checkZapActivation = function(enemyBotDistance: number): void {
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
};

/**
 * Defensive function for melee bots to avoid running blindly into mines.
 * @param closestEnemyBot entity representing the closest bot we see
 */
const tryEvadeMiners = function(
    closestEnemyBot: Entity,
    enemyBotDistance: number
) {
    // This is the most likely scenario, chasing enemies across the map horizontally
    if (y == closestEnemyBot.y && enemyBotDistance >= 3) {
        // Move up or down randomly if both directions are available
        if (canMove("up") && canMove("down")) {
            if (percentChance(50)) move("up");
            else move("down");
        }
        if (canMove("up")) move("up");
        if (canMove("down")) move("down");
    }
    // Less likely scenario, chasing a miner vertically
    if (x == closestEnemyBot.x && enemyBotDistance >= 3) {
        if (canMove("forward") && canMove("backward")) {
            if (percentChance(50)) move("forward");
            else move("backward");
        }
        if (canMove("backward")) move("backward");
        if (canMove("forward")) move("forward");
    }
};
