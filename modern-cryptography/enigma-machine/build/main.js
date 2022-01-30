"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enigma_1 = require("./enigma");
const utility_1 = require("./utility");
const E = new enigma_1.Enigma();
console.log(E.encrypt('ERHAN'));
const E2 = new enigma_1.Enigma(enigma_1.Enigma.makeRotors(utility_1.ENGLISH_ALPHABET, utility_1.EXAMPLE_ROTOR_SETUP));
console.log(E2.encrypt('SOMETHING'));
//# sourceMappingURL=main.js.map