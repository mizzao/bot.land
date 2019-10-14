/**
 * Sneaktillery: used to rush the CPU. Can often do a surprising amount of
 * damage even with enemies around, depending on the loadout. Different
 * configurations depending on the situation:
 *
 * - Reflect/cloak: artillery 3, reflect 3, cloak 1 (chaos zapper cycle?)
 * - Teleport/cloak: artillery 3, TP 2, cloak 2
 * - Teleport/reflect: artillery 3, TP 2, reflect 2
 *
 * Sneaktillery will try to get into one of the positions that is 5 spaces away
 * from the CPU and just unload until it has exploded.
 */
const update = function() {
    // Whether we should use sensors (useful to shoot chips from afar)
    const USE_SENSORS = false;
    // Whether we should run if an enemy happens upon us and we have TP, to try
    // and get to the other side of the CPU.
    const TELEPORT_EVADE = true;

    // If we're evading, how close should the enemy be before we run?
    const EVADE_DISTANCE = 2;
    // Change this if the game changes it.
    const TELEPORT_RANGE = 5;

    // Check our memory to see if we should be running in a particular direction
    const memoryDir = getData();
    if (exists(memoryDir) && memoryDir !== 0) {
        // Negative = move up. Positive = move down.
        if (memoryDir < 0) {
            saveData(memoryDir + 1);
            if (canMove('up')) move('up');
        } else {
            saveData(memoryDir - 1);
            if (canMove('down')) move('down');
        }
    }

    let closestEnemyDistance = 8; // Some large number that doesn't matter

    const closestEnemy = findEntity(ENEMY, BOT, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestEnemy)) {
        closestEnemyDistance = getDistanceTo(closestEnemy);
        // If we see someone (sight range of 5) activate defensive measures.
        // When we have both reflect and cloak, stagger them back and forth.
        if (closestEnemyDistance < 5.1) {
            if (canCloak() && !isReflecting()) cloak();
            if (canReflect() && !isCloaked()) reflect();
        }
    }

    // Take out any chips that are in front of us. (Putting a sneaktillery in
    // front of a chip means go for the CPU instead.)
    const closestChip = findEntity(ENEMY, CHIP, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(closestChip)) {
        // TODO: look into teleport evasion when killing chips...
        if (x <= closestChip.x && willArtilleryHit(closestChip)) fireArtillery(closestChip);
    } else {
        // No chip in sight. If we need to use sensors, turn those on before going ahead
        if (USE_SENSORS) tryActivateSensors();
    }

    const cpuX = arenaWidth - 1;
    const cpuY = floor(arenaHeight / 2);

    // const inFiringPosition =
    //     (x == x1 && y == y1) || (x == x2 && y == y2) || (x == x3 && y == y3);

    const enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(enemyCpu) && willArtilleryHit(enemyCpu)) {
        // We are in firing position. Shoot or run?
        // Evade melee units, but don't use the same time as our cloak
        if (closestEnemyDistance <= EVADE_DISTANCE && TELEPORT_EVADE && !isCloaked() && canTeleport()) {
            // Try to teleport to as far to the other side as we can.
            const xt = arenaWidth - 1;
            // Above the CPU
            if (y < cpuY) {
                const yt = y + TELEPORT_RANGE - (xt - x);
                if (canTeleport(xt, yt)) {
                    // Remind ourselves to go down twice if possible
                    saveData(2);
                    teleport(xt, yt);
                }
            }
            // Below the CPU
            else {
                const yt = y - TELEPORT_RANGE + (xt - x);
                if (canTeleport(xt, yt)) {
                    saveData(-2);
                    teleport(xt, yt);
                }
            }
        } else fireArtillery(enemyCpu);
    }

    // If we're using sensors, don't move forward without sensors on unless
    // we're spotted
    if (USE_SENSORS && !exists(closestEnemy)) {
        tryActivateSensors();
        if (!areSensorsActivated()) return;
    }

    // If we're here, we're not in a position to shoot at the CPU. So let's find
    // out how to get toward it. There are three optimal spots for shooting the
    // CPU:
    //
    // - (cx + 1, cy +/- 4)
    // - (cx, cy +/- 5)
    // - (cx - 1, cy +/- 4)
    //
    // Try going to each of these spots in order.

    // Now let's declare all these variables in a silly way since we can't do it in a line
    const x1 = cpuX + 1;
    const x2 = cpuX;
    const x3 = cpuX - 1;
    let y1;
    let y2;
    let y3;

    // Top half
    if (y < cpuY) {
        y1 = cpuY - 4;
        y2 = cpuY - 5;
        y3 = cpuY - 4;
    }
    // Bottom half
    else {
        y1 = cpuY + 4;
        y2 = cpuY + 5;
        y3 = cpuY + 4;
    }

    // See if we can directly teleport to any of these locations.
    if (canTeleport()) {
        tryTeleport(x1, y1);
        tryTeleport(x2, y2);
        tryTeleport(x3, y3);
        // If we can't teleport that far, just try to jump forward a bit.
        tryTeleport(x + TELEPORT_RANGE, y);
        tryTeleport(x + TELEPORT_RANGE - 1, y);
    }

    // Can't teleport so we have to walk. Movement rules:
    // - always go forward if we can (usually, sliding along wall) until we can
    //   see spot 1
    // - if we see spot 1 and it's occupied, go to spot 2, etc.

    if (!canMoveTo(x1, y1)) {
        if (canMove('forward')) move('forward');
        else {
            // Someone's blocking us, see if we can teleport around them. But
            // don't teleport just because we can't see the target...only if we
            // can't move forward.
            if (canTeleport()) {
                tryTeleport(x + TELEPORT_RANGE, y);
                tryTeleport(x + TELEPORT_RANGE - 1, y);
            }
        }
        // If we can't move otherwise try going around. This will only run for
        // one step.
        moveTo(cpuX, cpuY);
    }

    // We can see spot 1!
    if (!exists(getEntityAt(x1, y1))) {
        if (canMove('forward')) move('forward');
        moveTo(x1, y1);
    }

    // Someone's in spot 1. Can we go to spot 2?
    if (!exists(getEntityAt(x2, y2))) moveTo(x2, y2);
    // Both spot 1 and 2 are occupied...
    if (!exists(getEntityAt(x3, y3))) moveTo(x3, y3);

    // If we got here, something's stuck.
    tryActivateSensors();
    tryFireArtillery();

    // Try moving toward CPU
    const destinationX = arenaWidth - 1;
    const destinationY = floor(arenaHeight / 2);
    moveTo(destinationX, destinationY);
};
