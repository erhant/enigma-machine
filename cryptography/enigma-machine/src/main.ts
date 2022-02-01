import {Enigma} from './enigma';
import {ChatClient} from './chat';
import {ENGLISH_ALPHABET, EXAMPLE_ROTOR_SETUP} from './utility';
import minimist = require('minimist');

const args: minimist.ParsedArgs = minimist(process.argv.slice(2));

async function main() {
  // Setup enigma machine
  let E: Enigma;
  if ('f' in args || '--file' in args) {
    // read machine configurations
    console.log('todo...');
    E = new Enigma(Enigma.makeRotors(ENGLISH_ALPHABET, EXAMPLE_ROTOR_SETUP));
  } else {
    // generate default machine
    E = new Enigma(Enigma.makeRotors(ENGLISH_ALPHABET, EXAMPLE_ROTOR_SETUP));
  }

  // Process the arguments
  for (const k of Object.keys(args)) {
    switch (k) {
      case '_': // ignore
      case 'f': // also ignore
        break;
      case 'e':
      case 'encrypt':
        console.log('Encrypting:', args[k]);
        console.log(E.encrypt(args[k]));
        break;
      case 'd':
      case 'decrypt':
        console.log('Decrypting:', args[k]);
        console.log(E.decrypt(args[k]));
        break;
      case 'c':
      case 'chat': {
        console.log('Joining chat as:', args[k]);
        const cli = new ChatClient(args[k], E);
        cli.interface();
        break;
      }
      case 'b':
      case 'bombe': {
        console.log('todo');
        break;
      }
      case 'a':
      case 'adversary': {
        console.log('todo');
        break;
      }
      default: {
        console.log(`
Options:
  --file      / -f <path>       Setup the machine with given rotors.
  --encrypt   / -e <message>    Encrypt a message of your choice
  --decrypt   / -d <message>    Decrypt a message of your choice
  --chat      / -c <username>   Join chat with some username
  --bombe     / -b              Run bombe
  --adversary / -a              Eavesdrop the chat as adversary
        `);
      }
    }
  }
}

main();
