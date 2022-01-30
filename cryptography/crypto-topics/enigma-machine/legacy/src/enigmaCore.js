module.exports = class EnigmaCore {
  // Rotors is an array of array of strings. e.g. [['A', 'B', 'C'], ['C', 'A', 'B'], ['B', 'A', 'C']]
  constructor(rotors) {
    this.rotorCount = rotors.length;
    this.rotors = rotors;
  }

  // Encrypt a message. This mutates the rotors. To decrypt, you need to reset.
  encrypt(plaintext) {
    plaintext = plaintext.toUpperCase();
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i++) {
      let c_l = plaintext[i];
      // Encrypt from the first rotor to the last
      for (let r = 0; r < this.rotorCount; r++) {
        c_l = this.rotors[r].encryptLetter(c_l);
      }
      // Rotate rotors from last to the first. If a rotation returns true,
      // it means a click occured so we can rotate the next rotor.
      for (let r = this.rotorCount - 1; r >= 0; r--) {
        if (!this.rotors[r].rotate()) {
          break;
        }
      }
      ciphertext += c_l;
    }
    return ciphertext;
  }

  // Decrypt a ciphertext. This mutates the rotors. To encrypt, you need to reset.
  decrypt(ciphertex) {
    ciphertex = ciphertex.toUpperCase();
    let plaintext = '';
    for (let i = 0; i < ciphertex.length; i++) {
      let p_l = ciphertex[i];
      // Decrypt from the last rotor to the first
      for (let r = this.rotorCount - 1; r >= 0; r--) {
        p_l = this.rotors[r].decryptLetter(p_l);
      }
      // Rotate rotors from last to the first. If a rotation returns true, it means a click occured so we can rotate the next rotor.
      for (let r = this.rotorCount - 1; r >= 0; r--) {
        if (!this.rotors[r].rotate()) {
          break;
        }
      }
      plaintext += p_l;
    }
    return plaintext;
  }

  // Snapshot of the current state of the rotors.
  get state() {
    return {
      rotorStates: this.rotors.map(r => r.state),
      rotorCount: this.rotorCount,
    };
  }

  // Print the state of the rotors and machine.
  static stateToStr(state) {
    let ans = 'MACHINE STATE:\n';
    for (let r = 0; r < state.rotorCount; r++) {
      ans += `Rotor [${r}] of [${state.rotorCount}]:\n`;
      ans += `${state.rotorStates[r].rotations} rotations, ${state.rotorStates[r].clicks} clicks.\n`;
      for (let j = 0; j < state.rotorStates[r].from.length; j++) {
        ans += `\t${state.rotorStates[r].from[j]} -> ${state.rotorStates[r].to[j]}\n`;
      }
      ans += '\n';
    }
    return ans;
  }
};
