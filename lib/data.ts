import "./bot.land"

/**
 * Utilities for bots to save data across turns about themselves. Enables crazy
 * things like the chaos zapper.
 *
 * This uses sharedD to store data, and sharedE to store corresponding entities
 * for that data.
 *
 * TODO: this will conflict with missile micro potshots, so we need to have that
 * use this system when merging.
 */
export const saveData = function(datum): void {
    const me = getEntityAt(x, y);
    if (!exists(sharedE)) {
        // We are the first person to save data, put ourselves in position 1
        array1 = [];
        array2 = [];
        array1[0] = datum;
        array2[0] = me;
        sharedD = array1;
        sharedE = array2;
        return;
    }

    // Load arrays from shared variables
    array1 = sharedD;
    array2 = sharedE;

    let i = 0;
    for (i = 0; i < size(array2); i++) {
        if (array2[i] == me) {
            // That's my data!
            array1[i] = datum;
            // No change to entity
            sharedD = array1;
            sharedE = array2;
            return;
        }
    }

    // We weren't in the array, insert ourselves at the end
    array1[i] = datum;
    array2[i] = me;
    debugLog("Saved " + datum + " for " + me);
    debugLog(array2);
    debugLog(array1);
    sharedD = array1;
    sharedE = array2;
};

export const getData = function(): any {
    // No data saved yet
    if (!exists(sharedE)) return undefined;

    const me = getEntityAt(x, y);
    // Load arrays
    // debugLog("array1 before data load", array1);
    // debugLog("array2 before data load", array2);
    array1 = sharedD;
    array2 = sharedE;
    // debugLog("array1 after data load", array1);
    // debugLog("array2 after data load", array2);

    let i = 0;
    for (i = 0; i < size(array2); i++) {
        if (array2[i] == me) {
            // That's my data!
            return array1[i];
        }
    }
    // Data not found
    return undefined;
};

export const isNumber = function(value: any): boolean {
    if (value == value + 0) return true;
    else return false;
};
