declare enum DIRECTION {
    LEFT = 0,
    RIGHT = 1
}
declare type char = string;
export declare class Enigma {
    rotors: RotorManager;
    constructor(rotors?: RotorManager | null);
    static makeRotorsRandom(alphabet: string, rotorCount: number, rotationDirection?: DIRECTION): RotorManager;
    static makeRotors(source: string, destinations: string[], rotationDirection?: DIRECTION): RotorManager;
    encrypt(p: string): string;
    decrypt(c: string): string;
}
declare class RotorManager {
    rotors: Rotor[];
    length: number;
    direction: DIRECTION;
    constructor(rotors: Rotor[], direction?: DIRECTION);
    encrypt(pl: char): char;
    decrypt(cl: char): char;
}
declare class Rotor {
    from: char[];
    to: char[];
    length: number;
    rotations: number;
    clicks: number;
    constructor(from: string, to: string);
    rotate(d: DIRECTION): boolean;
    encrypt(pl: char): char;
    decrypt(cl: char): char;
}
export {};
