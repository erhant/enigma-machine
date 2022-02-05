import {createInterface, Interface} from 'readline';
import {Enigma, DIRECTION} from './enigma';
import {readFileSync} from 'fs';
import YAML = require('yaml');
import {
  DEFAULT_CHAT_CHANNEL,
  CHAT_EXIT_TEXT,
  CHAT_REFRESH_TIME_MS,
  ChatEntry,
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
      const candidates: string[] = await EavesdropperClient.crack(
        target,
        alphabet,
        keywords,
        rotorCount,
        percentage
      );
      if (candidates.length > 0) {
        console.log('Candidates found: ', candidates);
      } else {
        console.log('No candidates...');
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
      const e: Enigma = new Enigma(
        Enigma.makeRotors(
          alphabet,
          Array.from(Array(rotorCount).keys()).map(() => alphabet),
          DIRECTION.LEFT
        )
      );
      const candidates: string[] = [];
      let p: string; // plaintext candidate
      let cnt: number; // number of occurences of keyword in p
      const num_attempts: number = Math.pow(alphabet.length, rotorCount); // number of possible configurations
      let cur_attempt = 1;
      console.log('Running over', num_attempts, 'possibilities.');

      // TODO: use generator functions to generate permutations
      candidates.push('todo...');

      resolve(candidates);
    });
  }
}
