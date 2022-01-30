import {assert} from 'console';
import {fisherYatesShuffle, ENGLISH_ALPHABET} from './utility';

enum DIRECTION {
  LEFT = 0,
  RIGHT = 1,
}

type char = string; // for readability

export class Enigma {
  rotors: RotorManager;

  constructor(rotors: RotorManager | null = null) {
    if (rotors) {
      this.rotors = rotors;
    } else {
      this.rotors = Enigma.makeRotorsRandom(ENGLISH_ALPHABET, 3);
    }
  }

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

  static makeRotors(
    source: string,
    destinations: string[],
    rotationDirection: DIRECTION = DIRECTION.LEFT
  ): RotorManager {
    const rotors: Rotor[] = [];
    for (let i = 0; i < destinations.length; ++i) {
      rotors.push(
        new Rotor(
          source,
          fisherYatesShuffle<char>([...destinations[i]]).join('')
        )
      );
    }
    return new RotorManager(rotors, rotationDirection);
  }

  encrypt(p: string): string {
    return [...p].map(pl => this.rotors.encrypt(pl)).join('');
  }

  decrypt(c: string): string {
    return [...c].map(cl => this.rotors.decrypt(cl)).join('');
  }
}

class RotorManager {
  rotors: Rotor[];
  length: number;
  direction: DIRECTION;

  constructor(rotors: Rotor[], direction: DIRECTION = DIRECTION.LEFT) {
    this.rotors = rotors;
    this.length = rotors.length;
    this.direction = direction;
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
    return cl;
  }
}

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
