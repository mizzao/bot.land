/**
 * Smart melee bot. Can use melee, zapper, and other equipment in a smart way.
 * Coordinates movements with ranged DPS bots.
 *
 * Note that when using thrusters with zapper, damage is dealt every time the
 * bot moves. So effective DPS can be twice as high (!!) as with normal zapper.
 */
const update = function() {
    // Equip when we see someone, not blindly
    const closestEnemyBot = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
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
    const canRangeTarget = willMissilesHit() || willArtilleryHit() || willLasersHit();
    if (!canRangeTarget && canCharge()) {
        if (exists(closestEnemyBot) && !willMeleeHit(closestEnemyBot)) {
            pursue(closestEnemyBot);
        }
    }

    // whack priority for melee (this will only hit bots)
    tryMeleeSmart();

    // Use zapper on structures, even if not fighting
    const closestEnemy = findEntity(ENEMY, ANYTHING, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestEnemy)) {
        const enemyDistance = getDistanceTo(closestEnemy);
        if (enemyDistance < 2.1) tryZap();
        // Need this here, otherwise we will not be able to kill chips/CPUs.
        if (willMeleeHit()) melee();
    }

    // Nothing else to do. Move with the team.
    defaultMove();
};

const checkDefenseActivation = function(enemyBotDistance: number): void {
    if (enemyBotDistance < 5.1) {
        // Stagger reflects and cloaks for the "dark templar" bot. For attacker
        // cloak first to close faster. For defender reflect vice versa.
        if (isAttacker) {
            if (canCloak() && !isReflecting()) cloak();
            if (canReflect() && !isCloaked()) reflect();
        } else {
            if (canReflect() && !isCloaked()) reflect();
            if (canCloak() && !isReflecting()) cloak();
        }

        if (canShield() && !isShielded()) shield();
    }
};

const checkZapActivation = function(enemyBotDistance: number): void {
    // Zap has a range of 2, but we should activate at 3 because next turn both
    // us and/or the other melee unit may charge, closing the gap quickly, and
    // then we spend a turn turning on zapper instead of punching them.
    // Observations show that in melee battles the bot usually dies before
    // zapper finishes, so it doesn't matter if we waste a turn with it too early.

    // TODO if we can cloak, we should probably wait zap after cloaking, and
    // possibly after some time.

    // TODO this is too late for teleporters, which hit us before we
    // zap. For teleporters we should have a version that cloaks as soon
    // as enemies are in sight.
    if (enemyBotDistance < 3.1) tryZap();
};
