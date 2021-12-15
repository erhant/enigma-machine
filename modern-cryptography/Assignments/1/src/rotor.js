module.exports = class Rotor {
  // from: alphabet, to: a permutation of alphabet
  constructor(from, to) {
    this.from = from;
    this.to = to;
    if (from.length != to.length) {
      throw new Error("Rotor letter mismatch: "+ from.length +" != "+to.length);
    } else {
      this.letterCount = from.length;
    }
    this.rotations = 0;
    this.clicks = 0;
  }

  // Rotate the rotor. A click occurs after a full turn.
  rotate(direction = 'L') {
    this.rotations++;
    if (direction == 'R') {
      this.to.unshift(this.to.pop()); // rotate right
    } else {
      this.to.push(this.to.shift()); // rotate left
    }
    if (this.rotations == this.letterCount) {
      this.clicks++;
      this.rotations = 0;
      return true;
    }
    return false;
  }

  // Encrypt a single letter. The rotation is done by Enigma itself.
  encryptLetter(p_l) {
    let i = this.from.indexOf(p_l);
    if (i == -1) {
      throw new Error("Unexpected letter: "+p_l)
    }
    return this.to[i];
  }

  // Decrypt a single letter. The rotation is done by Enigma itself. 
  decryptLetter(c_l) {
    let i = this.to.indexOf(c_l);
    if (i == -1) {
      throw new Error("Unexpected letter: "+c_l)
    }
    return this.from[i];
  }

  // Snapshot of the rotor
  get state() {
    return {
      rotations: this.rotations,
      clicks: this.clicks,
      from: this.from,
      to: this.to
    }
  }
}