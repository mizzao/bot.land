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
    ENEMY = 1,
    CHIP = 1024,
    CPU = 512,
    BOT = 8
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

declare type Direction =
    | "up"
    | "down"
    | "left"
    | "right"
    | "forward"
    | "backward";

// Terminators

// Functions
declare function debugLog(msg: string): void;
declare function exists(entity: Entity): boolean;

declare function findEntities(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityMatchFlags,
    allowReturningSelf: boolean
): Entity[];
declare function findEntity(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityMatchFlags,
    sortBy: EntitySortType,
    sortOrder: EntitySortOrder
): Entity;

declare function figureItOut(): void;
declare function floor(n: number): number;
declare function percentChance(chance: number): boolean;
declare function size(arr: any[]): number;

// Functions - Movement
declare function canMove(dir: Direction): boolean;
declare function canMoveTo(entity: Entity): boolean;
declare function canMoveTo(x: number, y: number): boolean;

declare function getDistanceTo(entity: Entity): number;
declare function getDistanceTo(x: number, y: number): number;

declare function move(dir: Direction): void;
declare function moveTo(entity: Entity): void;
declare function moveTo(x: number, y: number): void;
// Alias of moveTo
declare function pursue(entity: Entity): void;
declare function pursue(x: number, y: number): void;

// Functions - Weaponry
declare function willMissilesHit(entity?: Entity): boolean;
declare function fireMissiles(entity?: Entity): void;

// Functions - Support
declare function activateSensors(): void;
declare function canActivateSensors(): boolean;
declare function areSensorsActivated(): boolean;
declare function cloak(): void;
declare function canCloak(): boolean;
declare function reflect(): void;
declare function canReflect(): boolean;
declare function shield(): void;
declare function canShield(): boolean;

// Variables
declare const x: number;
declare const y: number;
declare const life: number;
declare const lifePercent: number;
declare const isAttacker: boolean;
declare const arenaWidth: number;
declare const arenaHeight: number;

// Shared Variables
declare let sharedA, sharedB, sharedC, sharedD, sharedE;

// Entities
declare interface Entity {
    x: number;
    y: number;
    life: number;
    lifePercent: number;
}
