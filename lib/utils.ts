const tryEvadeLasers = function(closestEnemyBot, numEnemyBots) {
    const enemyBotDistance = getDistanceTo(closestEnemyBot);
    // Don't stand in range of lasers
    // Move away from the bot, preferably toward a border
    if (x == closestEnemyBot.x) {
        // TODO hack for fixing the bouncing back and forth issue
        // get in diag range with missiles
        if (enemyBotDistance >= 4 && percentChance(50)) {
            if (y > closestEnemyBot.y && canMove("up")) move("up");
            else if (y < closestEnemyBot.y && canMove("down")) move("down");
        }
        if (canMove("backward")) move("backward");
        if (canMove("forward") && numEnemyBots <= 1) move("forward");
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
};
