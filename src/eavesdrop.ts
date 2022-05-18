import {createInterface, Interface} from 'readline';
import {Enigma, DIRECTION} from './enigma';
import {readFileSync} from 'fs';
import YAML = require('yaml');
import {
  DEFAULT_CHAT_CHANNEL,
  CHAT_EXIT_TEXT,
  CHAT_REFRESH_TIME_MS,
  ChatEntry,
  generate_permutations,
} from './utility';
import {assert} from 'console';

/**
 * EavesdropperClient connects to a local channel, reads the chat history without decrypting.
 * It asks for the user to decrypt a word, by asking possible keywords for it and running an exhaustive search (bombe).
 */
export class EavesdropperClient {
  private head: number;
  private channel: string;

  constructor(channel: string = DEFAULT_CHAT_CHANNEL) {
    this.channel = channel;
    this.head = 0;
    this.eavesdropChannel(); // read existing messages
  }

  // start the active loop, which excepts input from the user and also refreshes the channel
  public async interface() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // launch interval for the screen refresh
    const interval: NodeJS.Timeout = setInterval(
      () => this.eavesdropChannel(), // or .bind(this)
      CHAT_REFRESH_TIME_MS
    );

    // ask the eavesdropper to choose a word to decrypt
    const target = await this.prompt(rl, 'Decrypt something: ');
    clearInterval(interval); // clear refresh
    if (target === CHAT_EXIT_TEXT) {
      rl.close();
    } else {
      // ask for keywords
      const keywords: string[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const k: string = await this.prompt(
          rl,
          'Enter key phrases one by one (empty to exit): '
        );
        if (k === '') break;
        keywords.push(k);
      }
      // get the candidate alphabet
      const alphabet: string = await this.prompt(rl, 'Enter the alphabet: ');
      // get the suspected rotor count
      const rotorCount: number = parseInt(
        await this.prompt(rl, 'Enter the rotor count: ')
      );
      // get percentage of matches keywords
      const percentage: number = parseFloat(
        await this.prompt(
          rl,
          'Enter the percentage of matches keywords in plaintext in range (0, 100]: '
        )
      );
      rl.close();

      // start cracking!
      const rotorCandidates: string[] = await EavesdropperClient.crack(
        target,
        alphabet,
        keywords,
        rotorCount,
        percentage
      );

      // decrypt if you have found candidates
      if (rotorCandidates.length === 0) {
        console.log('No candidate rotors were found...');
      } else {
        console.log('Rotor candidates found. Decrypting the chat');
        const decryptor = new Enigma(
          Enigma.makeRotors(alphabet, rotorCandidates, DIRECTION.LEFT)
        );
        const entries: ChatEntry[] = YAML.parse(
          readFileSync(this.channel, 'utf8')
        );
        // print entries and decrypt
        for (let i = 0; i < entries.length; ++i) {
          entries[i].message = decryptor.decrypt(entries[i].message);
          EavesdropperClient.printEntry(entries[i]);
        }
      }
    }
  }

  // print an entry to your console
  private static printEntry(entry: ChatEntry) {
    console.log(`${entry.time} ${entry.username}: ${entry.message}`);
  }

  // read entries in the channel without decrypting
  private eavesdropChannel() {
    const entries: ChatEntry[] = YAML.parse(readFileSync(this.channel, 'utf8'));
    // print entries, starting from the header
    for (let i = this.head; i < entries.length; ++i) {
      EavesdropperClient.printEntry(entries[i]);
    }
    // move head to the end of entries
    this.head = entries.length;
  }

  // prompt the client for input
  private prompt(I: Interface, prompt = '>: '): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      I.question(prompt, input => {
        resolve(input.toUpperCase());
      });
    });
  }

  private static crack(
    target: string,
    alphabet: string,
    keywords: string[],
    rotorCount: number,
    percentage: number
  ): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<string[]>((resolve, reject) => {
      assert(
        percentage <= 100 && percentage > 0,
        'Percentage outside (0, 100] range.'
      );
      // create an enigma machine with all rotors initially equal to the alphabet

      const candidates: string[] = [];
      let plaintext: string; // plaintext candidate
      let cnt: number; // number of occurences of keyword in p
      const num_attempts: number = Math.pow(alphabet.length, rotorCount); // number of possible configurations
      let attempt_no = 0;
      console.log('Running over', num_attempts, 'possibilities.');

      const destinations: string[] = Array<string>(rotorCount);
      const search = (i: number) => {
        // permutation generator
        const gen: Generator<string, undefined, string> =
          generate_permutations(alphabet);

        let dest = gen.next();
        while (!dest.done) {
          destinations[i] = dest.value;
          if (i < rotorCount) {
            // move on to the next rotor
            search(i + 1);
          } else {
            // rotors ready, attempt crack
            attempt_no++;
            plaintext = new Enigma(
              Enigma.makeRotors(alphabet, destinations, DIRECTION.LEFT)
            ).decrypt(target);

            // see if we have keywords in this
            cnt = keywords.filter(k => plaintext.includes(k)).length;
            if ((100 * cnt) / keywords.length >= percentage) {
              // matches are good
              if (!(plaintext in candidates)) {
                console.log(
                  `Attempt ${attempt_no}: found new candidate: ${plaintext}`
                );
                resolve(destinations);
              }
            }
          }
          // next permutation
          dest = gen.next();
        }
      };
      search(0);
      resolve([]);
    });
  }
}
