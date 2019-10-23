/**
 * Laser Squad
 *
 * A laser team that holds a diagonal formation in order to take advantage of
 * the range and damage of lasers without the weaknesses. Can also lay mines.
 *
 * Example loadouts:
 * - laser 3, shield 3, mine 1 (defensive)
 * - laser 3, thrusters 3, mine 1 (fast mine carpet)
 */
type StuckSide = "edge_rear" | "edge_side";
type Order = Direction | StuckSide | "clear" | "active";

// Globals
declare let TEAM_SIZE, lastHBCount;

init = function() {
    // Initialize the array.
    saveOrder("active");
    initHeartbeat();
    TEAM_SIZE = 4;
    debugLog("starting team size", TEAM_SIZE);
};

update = function() {
    const SHIELD_RANGE = 5;

    // Laser squad data has 3 states:
    // - 'active': default state, lay mines or fire lasers.
    // - 'clear': no enemies seen, can accept a move order.
    // - 'edge_rear', 'edge_side': the bot is against a wall and cannot move
    //   back or sideways.
    // - <direction>: one bot decided to move, so we all move in this direction.
    //
    // Rules:
    // - Move orders are always followed first if received.
    // - Reverse move orders can be issued by any bot, if no one on the team is
    //   stuck.
    // - Forward move orders are only issued if all bots in the squad show
    //   'clear':
    //
    // In default state, do the following:
    // 1. Fire at visible enemies
    // 2. Lay mines
    // 3. Blind-fire lasers
    const observedTeamSize = updateHeartbeat();
    if (observedTeamSize < TEAM_SIZE) {
        debugLog("seems someone died, team size", observedTeamSize);
        resetTeamState();
    }
    TEAM_SIZE = observedTeamSize;

    const order = getOrder();
    let state: Order = "active";

    // If we need to move to maintain formation, always do that first.
    if (isDirection(order)) {
        if (canMove(order)) {
            saveOrder(state); // active
            move(order);
        }
    } else {
        // Only if we didn't try to process a directional move
        // Check if we're against a wall
        if (x == 0) {
            state = "edge_rear";
            saveOrder(state);
        } else if (y == 0 || y == arenaHeight - 1) {
            state = "edge_side";
            saveOrder(state);
        }
    }

    // Do we see anything nearby?
    const closestEnemy = findEntity(
        ENEMY,
        ANYTHING,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemy)) {
        if (!isStuck(state)) {
            state = "clear";
            saveOrder(state);
        }
        tryShieldFriendlyBots(SHIELD_RANGE);
        tryLayMine();
        // If we don't see anything and can activate sensors, go ahead.
        // tryActivateSensors();
        // Sensors and still don't see anything?
        tryTeamMoveForward();

        // If we still haven't moved at this point, just blind fire lasers.
        blindFireLasers();
    }

    const closestEnemyBot = findEntity(
        ENEMY,
        BOT,
        SORT_BY_DISTANCE,
        SORT_ASCENDING
    );
    if (!exists(closestEnemyBot)) {
        // TODO: set to 'clear' if the enemy chip or CPU is not in firing range.

        // Not clear, chip or CPU.
        tryShieldFriendlyBots(SHIELD_RANGE);
        tryLayMine();
        tryFireLasers();
        blindFireLasers();
    }

    // Now we know there's a bot nearby.
    if (!isStuck(state)) {
        state = "active";
        saveOrder(state);
    }

    const numEnemyBots = size(findEntities(ENEMY, BOT, false));
    const enemyBotDistance = getDistanceTo(closestEnemyBot);

    if (enemyBotDistance < 3.1 || numEnemyBots > 2) {
        tryTeamMoveBack();
    }

    if (enemyBotDistance < 5.1) {
        // Defenses
        tryShieldFriendlyBots(SHIELD_RANGE);
        tryReflect();
        if (!isShielded()) tryShieldSelf();
        // Weapons
        tryFireLasers();
        tryLayMine();
    }

    // Last resort moves
    tryFireLasers();
    tryLayMine();
    blindFireLasers();
};

const initHeartbeat = function() {
    if (sharedC == undefined) sharedC = 0;
    sharedC = sharedC + 1;
    lastHBCount = sharedC;
    debugLog("starting count", lastHBCount);
};

const updateHeartbeat = function() {
    sharedC = sharedC + 1;
    const botsAlive = sharedC - lastHBCount;
    lastHBCount = sharedC;
    return botsAlive;
};

/**
 * If all bots on the team show 'clear' or against edge, we can issue a move forward.
 */
const tryTeamMoveForward = function() {
    // Load shared data
    array1 = sharedD;
    array2 = sharedE;

    debugLog("trying forward", array1);

    // Check if everyone can move forward.
    let i = 0;
    for (i = 0; i < size(array1); i++) {
        const val = array1[i] as Order;
        if (val !== "clear" && val !== "edge_rear" && val !== "edge_side") {
            // We can't move forward
            return;
        }
    }

    debugLog("Starting team forward move");
    // We can! Tell everyone to move forward.
    const me = getEntityAt(x, y);
    for (i = 0; i < size(array2); i++) {
        // Continue statements not allowed!
        if (array2[i] !== me) array1[i] = "forward";
    }

    // Save shared data
    sharedD = array1;
    sharedE = array2;
    // Terminator
    move("forward");
};

const tryTeamMoveBack = function() {
    // Load shared data
    array1 = sharedD;
    array2 = sharedE;

    // Check if everyone can move back. This basically means no one's already
    // got a move order, or against the back. So everyone must be 'active',
    // 'clear', or 'edge_side'.
    let i = 0;
    for (i = 0; i < size(array1); i++) {
        const val = array1[i] as Order;
        if (val !== "clear" && val !== "active" && val !== "edge_side") {
            // We can't move backward
            return;
        }
    }

    debugLog("Starting team backward move");
    // Tell everyone to move backward.
    const me = getEntityAt(x, y);
    for (i = 0; i < size(array2); i++) {
        if (array2[i] !== me) array1[i] = "backward";
    }

    // Save shared data
    sharedD = array1;
    sharedE = array2;
    // Terminator
    move("backward");
};

/**
 * Reset the movement states of potentially dead bots, so they don't mess up the
 * coordination algorithm.
 */
const resetTeamState = function() {
    // Load shared data
    array1 = sharedD;
    array2 = sharedE;

    let i = 0;
    for (i = 0; i < size(array1); i++) {
        const val = array1[i] as Order;
        if (val == "active") array1[i] = "clear";
    }

    // Save shared data
    sharedD = array1;
    sharedE = array2;
};

const getOrder = function(): Order {
    return getData() as Order;
};

const saveOrder = function(order: Order) {
    saveData(order);
};

const isDirection = function(order: Order): order is Direction {
    return (
        order == "up" ||
        order == "down" ||
        order == "left" ||
        order == "right" ||
        order == "forward" ||
        order == "backward"
    );
};

const isStuck = function(order: Order): order is StuckSide {
    return order == "edge_rear" || order == "edge_side";
};

const blindFireLasers = function() {
    // TODO: can improve this based on X position.
    if (percentChance(50)) fireLasers("forward");
    if (y > floor(arenaHeight / 2)) fireLasers("up");
    else fireLasers("down");
};
