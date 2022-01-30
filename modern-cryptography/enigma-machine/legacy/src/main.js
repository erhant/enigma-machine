const Enigma = require('./enigma');
const Bombe = require('./bombe');
const Enums = require('./enums');
const chat = require('./chat');
const Alphabet = require('./alphabet');
const readline = require('readline');
const colors = require('colors');
const args = process.argv.slice(2);

const defaultRotors = Enums.DefaultRotors;

let defaultEnigma = new Enigma({
  mode: Enums.Mode.Double,
  setupType: Enums.SetupType.InitialAlphabetWithRotors,
  fromAlphabet: new Alphabet(new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ')),
  toAlphabets: [
    new Alphabet(new String(defaultRotors[0])),
    new Alphabet(new String(defaultRotors[1])),
    new Alphabet(new String(defaultRotors[2])),
  ],
});

for (a_i = 0; a_i < args.length; a_i++) {
  // SINGLE DECRYPT TEST: node ./main.js -c <ciphertext>
  if (args[a_i] == '-c') {
    let p, c;
    a_i++;
    c = args[a_i];
    console.log('Decrypting:'.yellow, c);
    p = defaultEnigma.decrypt(c);
    console.log('Plaintext:'.blue, p);
    return;
  }
  // SINGLE ENCRYPT DECRYPT TEST: node ./main.js -p <plaintext>
  else if (args[a_i] == '-p') {
    let p, c;
    a_i++;
    p = args[a_i];

    console.log('Encrypting:'.red, p);
    c = defaultEnigma.encrypt(p);
    console.log('Ciphertext:'.yellow, c);
    let pnew = defaultEnigma.decrypt(c);
    console.log('Plaintext:'.blue, pnew);
    if (p.toUpperCase() == pnew) {
      console.log('Correctness:'.bold, 'YES'.green);
    } else {
      console.log('Correctness:'.bold, 'NO'.red);
    }
    return;
  }
  // BOMBE MODE: node ./main.js --bombe
  else if (args[a_i] == '--bombe') {
    bombeRoutine();
  }
  // CHAT MODE: node ./main.js --chat
  else if (args[a_i] == '--chat') {
    // Enable chat mode.
    a_i++;
    let username = args[a_i] || (Math.random() * 100).toString();
    chat.begin(username);
  } else if (args[a_i] == '--chat-eav') {
    // Enable chat mode eavesdropper.
    chat.eavesdrop();
  } else {
    console.log(
      'Usage:\n node main.js -p <plaintext> || -c <ciphertext> || --bombe || --chat <username> || --chat-eav'
    );
  }
}

async function bombeRoutine() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let c = await question(rl, 'Enter the ciphertext: ');
  c = c.toUpperCase();
  let keywords = [];
  let keywordNo = 1;
  console.clear();
  console.log(
    'Enter some keywords now. To start breaking, just enter without typing anyting!'
  );
  while (true) {
    let k = await question(rl, 'Keyword ' + keywordNo + ': ');
    if (k == '') {
      break;
    }
    keywordNo++;
    keywords.push(k.toUpperCase());
  }
  rl.close();
  if (keywords.length == 0) {
    throw new Error('No keywords given.');
  }
  console.clear();
  console.log('Ciphertext:'.yellow, c);
  console.log('Keywords:'.yellow, keywords);
  console.log('Alphabet:'.yellow, 'English Uppercase (26 characters)');
  console.log('Rotor Count:'.yellow, 3);
  // Create Bombe
  let bombe = new Bombe(defaultRotors[0], defaultRotors[1], defaultRotors[2]);
  bombe.crack(c, keywords);
}

function question(rl, prompt) {
  return new Promise((resolve, reject) => {
    rl.question(prompt, function (x) {
      resolve(x);
    });
  });
}
