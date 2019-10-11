const update = function() {
    // Sneaky artillery.
    // Perfect for dealing with those clever bot teams that move together.
    const closestEnemy = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestEnemy)) {
        // If we see someone, hide!
        if (canCloak()) cloak();

        if (canReflect()) reflect();
    }

    // Take out any chips that are in our way, if necessary
    // TODO: for chips not on the edge, cloak and shoot with sensors (how?)
    const closestChip = findEntity(
        ENEMY,
        CHIP,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (exists(closestChip)) {
        // Only shoot chips in front of us, that allows strategic placement
        if (x <= closestChip.x && willArtilleryHit(closestChip))
            fireArtillery(closestChip);
    }

    // First slide along the wall
    // TODO: if someone's blocking our way, shoot at anything, but otherwise just go forward
    if (x < arenaWidth - 1) {
        // Only support moving along the 2 edges
        if (y <= 1 || y >= arenaHeight - 2) {
            if (canMove("forward")) move("forward");
            // If we have to shoot a chip, help out
            if (canActivateSensors()) activateSensors();
            return; // Otherwise don't move
        }
    }

    const enemyCpu = findEntity(ENEMY, CPU, SORT_BY_DISTANCE, SORT_ASCENDING);
    if (exists(enemyCpu)) {
        // TODO Make room for a friend
        // sneakyFriends = findEntities(IS_OWNED_BY_ME, BOT, false);
        // cpuDist = distanceTo(enemyCpu);
        // if (x == arenaWidth - 1 && size(sneakyFriends) > 0 && cpuDist >= 5) move('backward');
        // Fire!
        if (willArtilleryHit(enemyCpu)) fireArtillery(enemyCpu);
    }

    // HACK for now the guys behind will just have to wait
    if (canActivateSensors()) activateSensors();

    // Then move up wall
    const destinationX = arenaWidth - 1;
    const destinationY = floor(arenaHeight / 2);
    moveTo(destinationX, destinationY);
};
