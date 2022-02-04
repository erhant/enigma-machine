import {createInterface, Interface} from 'readline';
import {Enigma} from './enigma';
import {readFileSync, writeFileSync} from 'fs';
import YAML = require('yaml');
import {
  DEFAULT_CHAT_CHANNEL,
  CHAT_EXIT_TEXT,
  CHAT_REFRESH_TIME_MS,
  ChatEntry,
} from './utility';

/**
 * ChatClient connects to a local channel, reads the chat history and writes to them in YAML.
 * Read messages are decrypted, and written messages are encrypted by the Enigma machine.
 */
export class ChatClient {
  private username: string;
  private enigma: Enigma;
  private head: number;
  private channel: string;

  constructor(
    username: string,
    enigma: Enigma,
    channel: string = DEFAULT_CHAT_CHANNEL
  ) {
    this.username = username;
    this.enigma = enigma;
    this.channel = channel;
    this.head = 0;
    this.readChannel(); // read existing messages
  }

  // start the active loop, which excepts input from the user and also refreshes the channel
  public async interface() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let entry: ChatEntry;

    // launch interval for the screen refresh
    const interval: NodeJS.Timeout = setInterval(
      () => this.readChannel(), // or .bind(this)
      CHAT_REFRESH_TIME_MS
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      entry = await this.prompt(rl, '>: ');
      if (entry.message === CHAT_EXIT_TEXT) {
        rl.close();
        clearInterval(interval); // clear refresh
        return;
      } else {
        this.writeChannel(entry);
      }
    }
  }

  // print an entry to your console
  private static printEntry(entry: ChatEntry) {
    console.log(`${entry.time} ${entry.username}: ${entry.message}`);
  }

  // add an entry to the channel
  private writeChannel(myEntry: ChatEntry) {
    // read existing messages
    const entries: ChatEntry[] = YAML.parse(readFileSync(this.channel, 'utf8'));
    // print entries, starting from the header
    for (let i = this.head; i < entries.length; ++i) {
      entries[i].message = this.enigma.decrypt(entries[i].message);
      ChatClient.printEntry(entries[i]);
    }
    // print to yourself
    ChatClient.printEntry(myEntry);
    // add encrypted message to chat
    myEntry.message = this.enigma.encrypt(myEntry.message);
    writeFileSync(this.channel, YAML.stringify(entries.concat(myEntry)));
    // move head to the end of entries
    this.head = entries.length + 1;
  }

  // read entries in the channel
  private readChannel() {
    const entries: ChatEntry[] = YAML.parse(readFileSync(this.channel, 'utf8'));
    // print entries, starting from the header
    for (let i = this.head; i < entries.length; ++i) {
      entries[i].message = this.enigma.decrypt(entries[i].message);
      ChatClient.printEntry(entries[i]);
    }
    // move head to the end of entries
    this.head = entries.length;
  }

  // prompt the client for input
  private prompt(I: Interface, prompt = '>: '): Promise<ChatEntry> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      I.question(prompt, input => {
        resolve({
          username: this.username,
          message: input.toUpperCase(),
          time: new Date().toTimeString().slice(0, 'xx:xx:xx'.length),
        });
      });
    });
  }
}
