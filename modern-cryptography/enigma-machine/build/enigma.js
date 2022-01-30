"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enigma = void 0;
const console_1 = require("console");
const utility_1 = require("./utility");
var DIRECTION;
(function (DIRECTION) {
    DIRECTION[DIRECTION["LEFT"] = 0] = "LEFT";
    DIRECTION[DIRECTION["RIGHT"] = 1] = "RIGHT";
})(DIRECTION || (DIRECTION = {}));
class Enigma {
    constructor(rotors = null) {
        if (rotors) {
            this.rotors = rotors;
        }
        else {
            this.rotors = Enigma.makeRotorsRandom(utility_1.ENGLISH_ALPHABET, 3);
        }
    }
    static makeRotorsRandom(alphabet, rotorCount, rotationDirection = DIRECTION.LEFT) {
        const rotors = [];
        for (let i = 0; i < rotorCount; ++i) {
            rotors.push(new Rotor(alphabet, (0, utility_1.fisherYatesShuffle)([...alphabet]).join('')));
        }
        return new RotorManager(rotors, rotationDirection);
    }
    static makeRotors(source, destinations, rotationDirection = DIRECTION.LEFT) {
        const rotors = [];
        for (let i = 0; i < destinations.length; ++i) {
            rotors.push(new Rotor(source, (0, utility_1.fisherYatesShuffle)([...destinations[i]]).join('')));
        }
        return new RotorManager(rotors, rotationDirection);
    }
    encrypt(p) {
        return [...p].map(pl => this.rotors.encrypt(pl)).join('');
    }
    decrypt(c) {
        return [...c].map(cl => this.rotors.decrypt(cl)).join('');
    }
}
exports.Enigma = Enigma;
class RotorManager {
    constructor(rotors, direction = DIRECTION.LEFT) {
        this.rotors = rotors;
        this.length = rotors.length;
        this.direction = direction;
    }
    encrypt(pl) {
        let cl = pl;
        // encrypt from first rotor to the last
        for (let r = 0; r < this.length; ++r) {
            cl = this.rotors[r].encrypt(cl);
        }
        // rotate motors last to first
        for (let r = this.length - 1; r >= 0; --r) {
            if (!this.rotors[r].rotate(this.direction)) {
                break;
            }
        }
        return cl;
    }
    decrypt(cl) {
        let pl = cl;
        // decrypt from last rotor to the first
        for (let r = this.length - 1; r >= 0; --r) {
            pl = this.rotors[r].decrypt(pl);
        }
        // rotate motors last to first
        for (let r = this.length - 1; r >= 0; --r) {
            if (!this.rotors[r].rotate(this.direction)) {
                break;
            }
        }
        return cl;
    }
}
class Rotor {
    constructor(from, to) {
        this.from = [...from];
        this.to = [...to];
        (0, console_1.assert)(from.length === to.length, 'Rotor source and destination mismatch.');
        this.length = from.length;
        this.rotations = 0;
        this.clicks = 0;
    }
    rotate(d) {
        this.rotations++;
        if (d === DIRECTION.RIGHT) {
            this.to.unshift(this.to.pop());
        }
        else {
            this.to.push(this.to.shift());
        }
        if (this.rotations === this.length) {
            this.clicks++;
            this.rotations = 0;
            return true;
        }
        return false;
    }
    encrypt(pl) {
        const i = this.from.indexOf(pl);
        (0, console_1.assert)(i !== -1, `Unexpected letter: ${pl}`);
        return this.to[i];
    }
    decrypt(cl) {
        const i = this.to.indexOf(cl);
        (0, console_1.assert)(i !== -1, `Unexpected letter: ${cl}`);
        return this.from[i];
    }
}
//# sourceMappingURL=enigma.js.map