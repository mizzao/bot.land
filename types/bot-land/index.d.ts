declare const IS_OWNED_BY_ME = 256;
declare const ALLY = 0;
declare const ENEMY = 1;
declare const CHIP = 1024;
declare const CPU = 512;
declare const BOT = 8;
declare const ANYTHING: any;

declare enum EntityMatchFlags {
    IS_OWNED_BY_ME = 256,
    ALLY = 0,
    ENEMY = 1,
    CHIP = 1024,
    CPU = 512,
    BOT = 8,
}

declare const SORT_BY_DISTANCE = 1;
declare const SORT_BY_LIFE = 2;
declare enum EntitySortType {
    SORT_BY_DISTANCE,
    SORT_BY_LIFE,
}

declare const SORT_ASCENDING = 1;
declare const SORT_DESCENDING = 2;
declare enum EntitySortOrder {
    SORT_ASCENDING,
    SORT_DESCENDING,
}

declare type Direction = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';

// Terminators

// Functions
declare function debugLog(...stuff: any[]): void;
declare function exists(thing: any): boolean;

declare function findEntities(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityMatchFlags,
    allowReturningSelf: boolean,
): Entity[];
declare function findEntitiesInRange(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityMatchFlags,
    allowReturningSelf: boolean,
    range: number,
): any;
declare function findEntity(
    friendlyOrEnemy: EntityMatchFlags,
    type: EntityMatchFlags,
    sortBy: EntitySortType,
    sortOrder: EntitySortOrder,
): Entity;
declare function getEntityAt(x: number, y: number): Entity;
declare function figureItOut(): void;

declare let array1: any[];
declare let array2: any[];

// Functions - Math
declare function abs(n: number): number;
declare function floor(n: number): number;
declare function max(...nums: number[]): number;
declare function min(...nums: number[]): number;
declare function percentChance(chance: number): boolean;
declare function round(n: number): number;
declare function size(arr: any[]): number;

// Functions - Movement
declare function canMove(dir: Direction): boolean;
declare function canMoveTo(entity: Entity): boolean;
declare function canMoveTo(x: number, y: number): boolean;

declare function getDistanceTo(entity: Entity): number;
declare function getDistanceTo(x: number, y: number): number;

declare function move(dir?: Direction): void;
declare function moveTo(entity: Entity): void;
declare function moveTo(x: number, y: number): void;
// Alias of moveTo
declare function pursue(entity: Entity): void;
declare function pursue(x: number, y: number): void;

// Functions - Weaponry
declare function canCharge(): boolean;
declare function willMeleeHit(entity?: Entity): boolean;
declare function melee(entity?: Entity): void;
declare function willArtilleryHit(entity?: Entity): boolean;
declare function fireArtillery(entity?: Entity): void;
declare function willLasersHit(entity?: Entity): boolean;
declare function fireLasers(entity?: Entity): void;
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
declare function canTeleport(xCoord: number, yCoord: number): boolean;
declare function teleport(entity?: Entity): void;
declare function teleport(xCoord: number, yCoord: number): void;

// Variables
declare const x: number;
declare const y: number;
declare const life: number;
declare const lifePercent: number;
declare const isAttacker: boolean;
declare const arenaWidth: number;
declare const arenaHeight: number;

// Shared Variables
declare let sharedA: any, sharedB: any, sharedC: any, sharedD: any, sharedE: any;

// Entities
declare interface Entity {
    x: number;
    y: number;
    life: number;
    lifePercent: number;
}
