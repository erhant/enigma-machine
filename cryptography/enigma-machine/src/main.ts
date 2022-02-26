import {Enigma} from './enigma';
import {ChatClient} from './chat';
import minimist = require('minimist');
import {EavesdropperClient} from './eavesdrop';
const args: minimist.ParsedArgs = minimist(process.argv.slice(2));

async function main() {
  // setup enigma machine
  let E: Enigma;
  if ('r' in args || 'rotors' in args) {
    // read rotors from file
    const k: string = 'r' in args ? 'r' : 'rotors';
    E = new Enigma(Enigma.makeRotorsFromFile(args[k]));
  } else {
    // generate default machine
    E = new Enigma(Enigma.makeRotorsFromFile('./rotors/default.yaml'));
  }

  // process the arguments
  for (const k of Object.keys(args)) {
    switch (k) {
      case '_': // ignore defaults
      case 'r': // ignore rotor file (processed above)
      case 'rotors': // ignore rotor file (processed above)
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
        await cli.interface();
        break;
      }
      case 'b':
      case 'bombe': {
        console.error('todo');
        break;
      }
      case 'a':
      case 'adversary': {
        console.log('Eaves dropping:');
        const cli = new EavesdropperClient();
        await cli.interface();
        break;
      }
      default: {
        console.log(`
Options:
  --rotors    / -r <path>       Setup the machine with given rotors (file).
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
