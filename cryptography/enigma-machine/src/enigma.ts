import {assert} from 'console';
import {fisherYatesShuffle, ENGLISH_ALPHABET} from './utility';
import YAML = require('yaml');
import {readFileSync} from 'fs';

enum DIRECTION {
  LEFT = 0,
  RIGHT = 1,
}

// A character type for readability. It is just a string of length 1.
type char = string;

/**
 * Enigma machine has a RotorManager that encrypts and decrypts letters, using a set of rotors.
 * Given a string, it will process letters from left to right.
 */
export class Enigma {
  rotors: RotorManager;

  constructor(rotors: RotorManager | null = null) {
    if (rotors) {
      this.rotors = rotors;
    } else {
      this.rotors = Enigma.makeRotorsRandom(ENGLISH_ALPHABET, 3);
    }
  }

  /**
   * Creates a set of rotors from a source alphabet.
   *
   * @param alphabet Source alphabet. Destinations will be created by shuffling it.
   * @param rotorCount Number of rotors.
   * @param rotationDirection Rotate rotors left or right? Left by default.
   * @returns RotorManager that can be used to construct Enigma.
   */
  static makeRotorsRandom(
    alphabet: string,
    rotorCount: number,
    rotationDirection: DIRECTION = DIRECTION.LEFT
  ): RotorManager {
    const rotors: Rotor[] = [];
    for (let i = 0; i < rotorCount; ++i) {
      rotors.push(
        new Rotor(alphabet, fisherYatesShuffle<char>([...alphabet]).join(''))
      );
    }
    return new RotorManager(rotors, rotationDirection);
  }

  static makeRotorsFromFile(path: string): RotorManager {
    const rotorDetails: {
      alphabet: string;
      rotors: string[];
      direction: boolean;
    } = YAML.parse(readFileSync(path, 'utf8').toString());
    return Enigma.makeRotors(
      rotorDetails.alphabet,
      rotorDetails.rotors,
      rotorDetails.direction ? DIRECTION.RIGHT : DIRECTION.LEFT
    );
  }

  /**
   * Creates a set of rotors from a source alphabet and a list of destination alphabets.
   *
   * @param source Source alphabet.
   * @param destinations List of destination alphabets, one for each rotor.
   * @param rotationDirection Rotate rotors left or right? Left by default.
   * @returns RotorManager that can be used to construct Enigma.
   */
  static makeRotors(
    source: string,
    destinations: string[],
    rotationDirection: DIRECTION = DIRECTION.LEFT
  ): RotorManager {
    // assert all destination lengths are equal
    assert(
      destinations.every(d => d.length === destinations[0].length),
      'Destination length mismatch'
    );
    return new RotorManager(
      [...destinations].map(destination => new Rotor(source, destination)),
      rotationDirection
    );
  }

  encrypt(p: string): string {
    let c = '';
    for (let i = 0; i < p.length; i++) {
      c += this.rotors.encrypt(p[i]);
    }
    return c;
  }

  decrypt(c: string): string {
    let p = '';
    for (let i = 0; i < c.length; i++) {
      p += this.rotors.decrypt(c[i]);
    }
    return p;
  }
}

/**
 * RotorManager manages the rotors :)
 * It encrypts letter using all of these, and rotates them.
 * If a rotor clicks, the subsequent rotor should rotate.
 */
class RotorManager {
  rotors: Rotor[];
  length: number;
  direction: DIRECTION;
  initialRotors: Rotor[];

  constructor(rotors: Rotor[], direction: DIRECTION = DIRECTION.LEFT) {
    this.rotors = rotors;
    this.length = rotors.length;
    this.direction = direction;
    this.initialRotors = JSON.parse(JSON.stringify(rotors));
  }

  encrypt(pl: char): char {
    let cl: char = pl;
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

  decrypt(cl: char): char {
    let pl: char = cl;
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
    return pl;
  }

  reset() {
    this.rotors = JSON.parse(JSON.stringify(this.initialRotors));
  }
}

/**
 * Rotor is a single rotating mapping device, that rotates once in every letter encryption.
 * When it rotates L many times where L is the length of alphabet, it clicks.
 */
class Rotor {
  from: char[];
  to: char[];
  length: number;
  rotations: number;
  clicks: number;

  constructor(from: string, to: string) {
    this.from = [...from];
    this.to = [...to];
    assert(from.length === to.length, 'Rotor source and destination mismatch.');
    this.length = from.length;
    this.rotations = 0;
    this.clicks = 0;
  }

  rotate(d: DIRECTION): boolean {
    this.rotations++;
    if (d === DIRECTION.RIGHT) {
      this.to.unshift(this.to.pop()!);
    } else {
      this.to.push(this.to.shift()!);
    }
    if (this.rotations === this.length) {
      this.clicks++;
      this.rotations = 0;
      return true;
    }
    return false;
  }

  encrypt(pl: char): char {
    const i: number = this.from.indexOf(pl);
    assert(i !== -1, `Unexpected letter: ${pl}`);
    return this.to[i];
  }

  decrypt(cl: char): char {
    const i: number = this.to.indexOf(cl);
    assert(i !== -1, `Unexpected letter: ${cl}`);
    return this.from[i];
  }
}
