const EN = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];
const ENSTR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function fisherYatesShuffle(arr) {
  const array = JSON.parse(JSON.stringify(arr));
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

module.exports = class Alphabet {
  constructor(source) {
    if (source instanceof Number) {
      const letterCount = Math.round(source);
      if (letterCount < 1 || letterCount > 26) {
        letterCount = 26; // use English alphabet if the value is out of range
      }
      this.alphabet = EN.slice(0, letterCount);
    } else if (source instanceof String) {
      this.alphabet = source.split('');
      if (this.alphabet.length < 1 || this.alphabet.length > 26) {
        throw new Error('Invalid letter string.');
      }
    } else if (source instanceof Array) {
      this.alphabet = source;
    } else {
      throw new Error('Expected either a number, string or array as source.');
    }
  }

  get letters() {
    return this.alphabet;
  }

  get asString() {
    return this.alphabet.join('');
  }

  shuffleNew() {
    return fisherYatesShuffle(this.alphabet);
  }
};
