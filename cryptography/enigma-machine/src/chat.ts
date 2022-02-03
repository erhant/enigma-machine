import {createInterface, Interface} from 'readline';
import {Enigma} from './enigma';
import {readFileSync, writeFileSync} from 'fs';
import YAML = require('yaml');

const CHAT_CHANNEL = './chat/history.yaml';
const REFRESH_TIME_MS = 2000;

interface ChatEntry {
  username: string;
  message: string;
  time: string;
}

export class ChatClient {
  private username: string;
  private history: ChatEntry[];
  private enigma: Enigma;
  private head: number;
  private channel: string;
  private static EXIT_TEXT = 'EXIT()';

  constructor(
    username: string,
    enigma: Enigma,
    channel: string = CHAT_CHANNEL
  ) {
    this.username = username;
    this.enigma = enigma;
    this.channel = channel;
    this.history = [];
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
      REFRESH_TIME_MS
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      entry = await this.prompt(rl, '>: ');
      if (entry.message === ChatClient.EXIT_TEXT) {
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
