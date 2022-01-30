const fs = require('fs');
const Alphabet = require('./alphabet');
const Enigma = require('./enigma');
const Bombe = require('./bombe');
const Enums = require('./enums');
const readline = require('readline');

const defaultRotors = Enums.DefaultRotors;

function begin(username) {
  console.log('Hey!', username.green, 'here.');
  fs.writeFileSync('./chat/history.json', JSON.stringify([]));
  interface(username);
}

async function interface(username) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let text;
  let interval = setInterval(refresh, 2000, username);
  while (true) {
    text = await question(rl, '>: ');
    text = text.toUpperCase();
    if (!!text) {
      if (text === 'EXIT') break;
      write(username, text);
    }
  }
  clearInterval(interval);
  rl.close();
}

function refresh(username) {
  const enigma = new Enigma({
    mode: Enums.Mode.Single,
    setupType: Enums.SetupType.InitialAlphabetWithRotors,
    fromAlphabet: new Alphabet(new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ')),
    toAlphabets: [
      new Alphabet(new String(defaultRotors[0])),
      new Alphabet(new String(defaultRotors[1])),
      new Alphabet(new String(defaultRotors[2])),
    ],
  });
  console.clear();
  console.log('Type ' + 'EXIT'.red + ' to terminate.');
  let history = JSON.parse(fs.readFileSync('./chat/history.json', 'utf8'));
  for (let i = 0; i < history.length; i++) {
    console.log(
      history[i].username.green +
        ' (' +
        history[i].timestamp.yellow +
        '): ' +
        enigma.decrypt(history[i].text)
    );
  }
  process.stdout.write(username.green + ' >: ');
}

function write(user, text) {
  let enigma = new Enigma({
    mode: Enums.Mode.Single,
    setupType: Enums.SetupType.InitialAlphabetWithRotors,
    fromAlphabet: new Alphabet(new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ')),
    toAlphabets: [
      new Alphabet(new String(defaultRotors[0])),
      new Alphabet(new String(defaultRotors[1])),
      new Alphabet(new String(defaultRotors[2])),
    ],
  });

  let history = JSON.parse(fs.readFileSync('./chat/history.json', 'utf8'));
  for (let i = 0; i < history.length; i++) {
    enigma.decrypt(history[i].text);
  }
  let msg = {
    text: enigma.encrypt(text),
    timestamp: new Date().toLocaleTimeString('tr'),
    username: user,
  };
  history.push(msg);
  fs.writeFileSync('./chat/history.json', JSON.stringify(history));
}

async function eavesdrop() {
  console.log('Ssshh.', 'someone'.red, 'is listening...');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let text;
  let interval = setInterval(refreshWithoutDecrypting, 2000);
  while (true) {
    text = await question(rl, 'Decrypt something: '.red);
    text = text.toUpperCase();
    if (!!text) {
      clearInterval(interval);
      await bombeRoutine(rl, text);
      break;
    }
  }
  rl.close();
}

function question(rl, prompt) {
  return new Promise((resolve, reject) => {
    rl.question(prompt, function (x) {
      resolve(x);
    });
  });
}

function refreshWithoutDecrypting() {
  console.clear();
  console.log('Ssshh.' + ' You are eavesdropping...'.red);
  let history = JSON.parse(fs.readFileSync('./chat/history.json', 'utf8'));
  for (let i = 0; i < history.length; i++) {
    console.log(
      history[i].username.green +
        ' (' +
        history[i].timestamp.yellow +
        '): ' +
        history[i].text
    );
  }
  process.stdout.write('Decrypt something: '.red);
}

async function bombeRoutine(rl, c) {
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

module.exports = {
  begin,
  eavesdrop,
};
