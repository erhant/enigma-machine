"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fisherYatesShuffle = exports.EXAMPLE_ROTOR_SETUP = exports.ENGLISH_ALPHABET = void 0;
exports.ENGLISH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.EXAMPLE_ROTOR_SETUP = [
    'SHBMFWEIQRODTAVXCPYZUJKGNL',
    'GYRFNUCZLQDWMKHSJOEPBVITXA',
    'MSEWGQHDPRFNXATOIBUJLCZVYK',
];
function fisherYatesShuffle(arr) {
    const array = JSON.parse(JSON.stringify(arr));
    let i = array.length;
    let tmp;
    let j;
    // while there remain elements to shuffle
    while (0 !== i) {
        // pick a remaining element
        j = Math.floor(i * Math.random());
        i--;
        // swap it with the current element.
        tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
    return array;
}
exports.fisherYatesShuffle = fisherYatesShuffle;
//# sourceMappingURL=utility.js.map