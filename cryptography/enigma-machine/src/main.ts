import {Enigma} from './enigma';
import {ENGLISH_ALPHABET, EXAMPLE_ROTOR_SETUP} from './utility';

const E2 = new Enigma(Enigma.makeRotors(ENGLISH_ALPHABET, EXAMPLE_ROTOR_SETUP));
console.log(E2.encrypt('SOMETHING'));
