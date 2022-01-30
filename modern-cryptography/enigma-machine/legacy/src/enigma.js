const EnigmaCore = require('./enigmaCore');
const Enums = require('./enums');
const Rotor = require('./rotor');
const Alphabet = require('./alphabet');

module.exports = class Enigma {
  constructor(options) {
    this.mode = options.mode;
    this.setupType = options.setupType;
    const encRotors = [];
    const decRotors = [];
    if (options.setupType === Enums.SetupType.InitialAlphabetWithRotors) {
      // Given a source alphabet and a list of target alphabets (rotors initial settings)
      for (let r = 0; r < options.toAlphabets.length; r++) {
        encRotors.push(
          new Rotor(
            options.fromAlphabet.letters,
            options.toAlphabets[r].letters
          )
        );
        decRotors.push(
          new Rotor(
            options.fromAlphabet.letters,
            JSON.parse(JSON.stringify(options.toAlphabets[r].letters))
          )
        );
      }
    } else if (options.setupType === Enums.SetupType.LetterCount) {
      // Given a number N where 1 <= N <= 26, chooses the first N letters of English alphabet.
      let alphabet = new Alphabet(new Number(options.letterCount));
      for (let r = 0; r < options.rotorCount; r++) {
        let shuffled = alphabet.shuffleNew();
        encRotors.push(new Rotor(alphabet.letters, shuffled));
        decRotors.push(
          new Rotor(alphabet.letters, JSON.parse(JSON.stringify(shuffled)))
        );
      }
    } else if (options.setupType === Enums.SetupType.InitialAlphabet) {
      // Given a source alphabet only. Randomly create rotors.
      for (let r = 0; r < options.rotorCount; r++) {
        const shuffled = options.alphabet.shuffleNew();
        encRotors.push(new Rotor(options.alphabet.letters, shuffled));
        decRotors.push(
          new Rotor(
            options.alphabet.letters,
            JSON.parse(JSON.stringify(shuffled))
          )
        );
      }
    } else {
      throw new Error('Unknown setup option:', options.setupType);
    }
    // Encryptor and Decryptor are decoupled, because the
    if (options.mode == Enums.Mode.Double) {
      this.encryptor = new EnigmaCore(encRotors);
      this.decryptor = new EnigmaCore(decRotors);
    } else if (options.mode == Enums.Mode.Single) {
      this.machine = new EnigmaCore(encRotors);
    } else {
      throw new Error('Unknown mode:', options.mode);
    }
  }

  decrypt(ciphertex) {
    if (this.mode === Enums.Mode.Double) {
      return this.decryptor.decrypt(ciphertex);
    } else if (this.mode === Enums.Mode.Single) {
      return this.machine.decrypt(ciphertex);
    }
  }

  encrypt(plaintext) {
    if (this.mode === Enums.Mode.Double) {
      return this.encryptor.encrypt(plaintext);
    } else if (this.mode === Enums.Mode.Single) {
      return this.machine.encrypt(plaintext);
    }
  }

  printState() {
    if (this.mode === Enums.Mode.Double) {
      console.log('Encryptor:\n');
      console.log(EnigmaCore.stateToStr(this.encryptor.state));
      console.log('Decryptor:\n');
      console.log(EnigmaCore.stateToStr(this.decryptor.state));
    } else if (this.mode === Enums.Mode.Single) {
      console.log('Machine:\n');
      console.log(EnigmaCore.stateToStr(this.machine.state));
    }
  }
};
