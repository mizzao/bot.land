declare const IS_OWNED_BY_ME = 256;
declare const ALLY = 0;
declare const ENEMY = 1;
declare const CHIP = 1024;
declare const CPU = 512;
declare const BOT = 8;
declare const ANYTHING;

declare enum EntityMatchFlags {
    IS_OWNED_BY_ME = 256,
    ALLY = 0,
    ENEMY = 1
}

declare enum EntityType {
    CHIP,
    CPU,
    BOT,
    ANYTHING
}

declare const SORT_BY_DISTANCE = 1;
declare const SORT_BY_LIFE = 2;
declare enum EntitySortType {
    SORT_BY_DISTANCE,
    SORT_BY_LIFE
}

declare const SORT_ASCENDING = 1;
declare const SORT_DESCENDING = 2;
declare enum EntitySortOrder {
    SORT_ASCENDING,
    SORT_DESCENDING
}

declare const CHIP_CPU_BOT: number;
declare const CHIP_BOT_CPU: number;
declare const CPU_BOT_CHIP: number;
declare const CPU_CHIP_BOT: number;
declare const BOT_CPU_CHIP: number;
declare const BOT_CHIP_CPU: number;
declare enum AttackPriority {
    CHIP_CPU_BOT,
    CHIP_BOT_CPU,
    CPU_BOT_CHIP,
    CPU_CHIP_BOT,
    BOT_CPU_CHIP,
    BOT_CHIP_CPU
}

declare const REDUCE_BY_MISSING_LIFE: number;
declare enum Reducer {
    REDUCE_BY_MISSING_LIFE
}

declare type Direction =
    | "up"
    | "down"
    | "left"
    | "right"
    | "forward"
    | "backward";

declare type EMPTarget = 
    | "LASERS"
    | "MISSILES"
    | "MELEE"
    | "ARTILLERY"
    | "ZAPPER"
    | "CLOAKING"
    | "SHIELD"
    | "REPAIR"
    | "REFLECT"
    | "TELEPORT"
    | "LANDMINES"
    | "EMP";

declare type XCoordinate = number;
declare type YCoordinate = number;

// Array vars
declare let array1: any[];
declare let array2: any[];

// Shared Variables
declare let sharedA, sharedB, sharedC, sharedD, sharedE;

// Variables
declare const x: XCoordinate;
declare const y: YCoordinate;
declare const life: number;
declare const lifePercent: number;
declare const isAttacker: boolean;
declare const arenaWidth: number;
declare const arenaHeight: number;

// Terminators

// Functions
declare function debugLog(...stuff: any[]): void;
declare function exists(thing: any): boolean;
// exists alias:
declare function isDefined(thing: any): boolean;

declare function findEntities(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityType,
    allowReturningSelf: boolean
): Entity[];
declare function findEntitiesInRange(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityType,
    allowReturningSelf: boolean,
    range: number
): Entity[];
declare function findEntity(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityType,
    sortBy: EntitySortType,
    sortOrder: EntitySortOrder
): Entity?;
declare function getEntityAt(x: XCoordinate, y: YCoordinate): Entity?;
declare function reduceEntities(entities: Entity[], reduceBy: Reducer): number;
declare function filterEntities(entities: Entity[], filter: EntitySortType, sortOrder: EntitySortOrder): Entity;
declare function filterEntities(entities: Entity[], filters: EntitySortType[], sortOrders: EntitySortOrder[]): Entity;
declare function findClosestEnemyBot(): Entity?;
declare function findMyCpu(): Entity?;
declare function findMyClosestBot(): Entity?;
declare function findClosestAlliedBot(): Entity?;
declare function findClosestEnemyChip(): Entity?;
declare function findClosestFriendlyChip(): Entity?;
declare function findClosestEnemyCpu(): Entity?;

declare function figureItOut(): void;
declare function figureItOutDefense(): void;

// Functions - Math
declare function abs(n: number): number;
declare function floor(n: number): number;
declare function ceil(n: number): number;
declare function max(...nums: number[]): number;
declare function min(...nums: number[]): number;
declare function percentChance(chance: number): boolean;
declare function round(n: number): number;
declare function size(arr: any[]): number;
declare function size(str: string): number;
declare function size(obj: { length: number }): number;
declare function count(arr: any[]): number;
declare function count(str: string): number;
declare function count(obj: { length: number }): number;
declare function randInt(lowerBound: number, upperBound: number): number;
// randInt alias:
declare function randomInteger(lowerBound: number, upperBound: number): number;
declare function clampNumber(number: number, minimum: number, maximum: number): number;

// Functions - Movement
declare function canMove(dir?: Direction): boolean;
// canMove alias:
declare function willMoveWork(dir?: Direction): boolean;
declare function canMoveTo(entity: Entity): boolean;
declare function canMoveTo(x: XCoordinate, y: YCoordinate): boolean;

declare function getDistanceTo(entity: Entity): number;
declare function getDistanceTo(x: number, y: number): number;
// getDistanceTo alias:
declare function distanceTo(entity: Entity): number;
declare function distanceTo(x: number, y: number): number;

declare function move(dir?: Direction): void;
declare function moveTo(entity: Entity): void;
declare function moveTo(x: XCoordinate, y: YCoordinate): void;
// Alias of moveTo
declare function pursue(entity: Entity): void;
declare function pursue(x: number, y: number): void;
declare function pursueBot(entity: Entity): void;
declare function pursueBot(x: number, y: number): void;

declare function isAdjacent(entity: Entity): boolean;
declare function isAdjacent(x: XCoordinate, y: YCoordinate): boolean;

// Functions - Weaponry
declare function canCharge(): boolean;
declare function willMeleeHit(entity?: Entity): boolean;
declare function willMeleeHit(direction?: Direction): boolean;
declare function melee(entity?: Entity): void;
declare function melee(direction?: Direction): void;
declare function willArtilleryHit(entity?: Entity): boolean;
declare function fireArtillery(entity?: Entity): void;
declare function willLasersHit(entity?: Entity): boolean;
declare function willLasersHit(direction?: Direction): boolean;
declare function fireLasers(entity?: Entity): void;
declare function fireLasers(direction?: Direction): void;
declare function willMissilesHit(entity?: Entity): boolean;
declare function fireMissiles(entity?: Entity): void;

// Functions - Support
declare function activateSensors(): void;
declare function canActivateSensors(): boolean;
declare function areSensorsActivated(): boolean;
declare function cloak(): void;
declare function canCloak(): boolean;
declare function isCloaked(): boolean;
declare function reflect(): void;
declare function canLayMine(): boolean;
declare function zap(): void;
declare function canZap(): boolean;
declare function canReflect(): boolean;
declare function isReflecting(): boolean;
declare function shield(entity?: Entity): void;
declare function canShield(entity?: Entity): boolean;
declare function isShielded(entity?: Entity): boolean;
declare function layMine(): void;
declare function canTeleport(entity?: Entity): boolean;
declare function canTeleport(xCoord: XCoordinate, yCoord: YCoordinate): boolean;
declare function teleport(entity?: Entity): void;
declare function teleport(xCoord: XCoordinate, yCoord: YCoordinate): void;
declare function EMP(empTarget: EMPTarget): void;
// EMP alias:
declare function emp(empTarget: EMPTarget): void;
declare function isEnemyMineAt(x: XCoordinate, y: YCoordinate): boolean;
declare function canSenseEntity(entity: Entitiy): boolean;
// canSenseEntity alias:
declare function canSense(entity: Entitiy): boolean;
declare function willRepair(entity?: Entity): boolean;
declare function canEMP(empTarget?: EMPTarget): boolean;
// canEMP alias:
declare function canEmp(empTarget?: EMPTarget): boolean;
declare function repair(entity?: Entity): void;
declare function isZapping(): boolean;
declare function isOnFire(): boolean;

declare function setAttackPriority(priority: AttackPriority): void;

// Entities
declare interface Entity {
    x: XCoordinate;
    y: YCoordinate;
    life: number;
    lifePercent: number;
}

declare function getX(entity: Entity): XCoordinate;
declare function getY(entity: Entity): YCoordinate;
declare function getLife(entity: Entity): number;
