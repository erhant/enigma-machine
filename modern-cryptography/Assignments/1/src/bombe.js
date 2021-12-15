const Enigma = require('./enigma')
const Enums = require('./enums')
const Alphabet = require('./alphabet')
const cliProgress = require('cli-progress');

// PDF: NPWCDPBRIVDZGARYLECHBTOCKJCMJVDRFZEYFWJTRZLPDEVDHIJXYHRBRJTVVQCFDQUWHRQKYPYFAJJKSDEJVOVZNWYFYINBPBSNHZAGDACJRYRLLJAWCJKHTEVATAAZWVUHSBTCKBVHTNSGFDPHGIZDSZXMBSIKWLMMISUQNWCRPSHSNFAALBQNMKESIHCPGVRTRFTPRYTRIRMNYMVSLEKAPRISAUSTRXQFVCLYWXZLLXHHKHJJUTPKHBTFENHMFRLFLUHYQJSCMNEBB


module.exports = class Bombe {
  constructor(rotorLetters1, rotorLetters2, rotorLetters3, base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    this.rotorPermutations = permutator([rotorLetters1, rotorLetters2, rotorLetters3]);
    this.base = base;
  }

  // Try all possible rotor orders and rotation combinations
  crack(ciphertext, keywords) {
    const start = new Date();
    const progbar = new cliProgress.SingleBar({
        format: 'Exhaustive Search'.red +' |' + '{bar}'.cyan + '|\t{percentage}%\t{value}/{total} Combinations',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });
    progbar.start(26*26*26*6, 0, {
        speed: "N/A"
    });
    let candidates = [];
    for (let r = 0; r < this.rotorPermutations.length; r++) {
      let rotorLetters = this.rotorPermutations[r].map(x => x.split(''));
      for (let r0 = 0; r0 < rotorLetters[0].length; r0++) {
        for (let r1 = 0; r1 < rotorLetters[1].length; r1++) {
          for (let r2 = 0; r2 < rotorLetters[2].length; r2++) {
            // Create attempt machine
            let enigma = new Enigma({
              mode: Enums.Mode.Single,
              setupType: Enums.SetupType.InitialAlphabetWithRotors,
              fromAlphabet: new Alphabet(new String(this.base)),
              toAlphabets: [
                new Alphabet(rotorLetters[0]),
                new Alphabet(rotorLetters[1]),
                new Alphabet(rotorLetters[2])  
              ]
            });
            // Decrypt c
            let p = enigma.decrypt(ciphertext);
            // Check if keyword is contained
            for (let k = 0; k<=keywords.length; k++) {
              if (k === keywords.length) {
                // All words are matched. Save the decryption.
                candidates.push(p);
              } else {
                if (!p.includes(keywords[k])) {
                  break;
                }
              }
            }
            progbar.increment();
            // Rotate letters once
            rotorLetters[2].unshift(rotorLetters[2].pop());
          }
          rotorLetters[1].unshift(rotorLetters[1].pop());
        }
        rotorLetters[0].unshift(rotorLetters[0].pop());
      }
    }
    progbar.stop();
    console.log('\nThat took: '.yellow+((new Date()) - start)+" ms\n")
    candidates = candidates.filter((elem, pos) => candidates.indexOf(elem) == pos) // todo: for some reason there are dupes and we need to remove them
    console.log('Candidate plaintexts:\n', candidates.length == 0 ? "None".red : candidates);
  }

}

// credit: https://stackoverflow.com/questions/9960908/permutations-in-javascript
function permutator(inputArr) {
  var results = [];
  function permute(arr, memo) {
    var cur, memo = memo || [];
    for (var i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }
    return results;
  }
  return permute(inputArr);
}