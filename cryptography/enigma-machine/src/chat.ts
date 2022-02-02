import {createInterface, Interface} from 'readline';
import {Enigma} from './enigma';
import {readFileSync, writeFileSync} from 'fs';

const CHAT_CHANNEL = './chat/history.json';
const REFRESH_TIME_MS = 2000;
const EXIT_TEXT = 'EXIT';

interface ChatEntry {
  username: string;
  message: string;
  time: string;
}

export class ChatClient {
  username: string; // Username
  enigma: Enigma; // Enigma machine to be used
  head: number;
  channel: string;

  constructor(
    username: string,
    enigma: Enigma,
    channel: string = CHAT_CHANNEL
  ) {
    this.username = username;
    this.enigma = enigma;
    this.channel = channel;
    this.head = 0;
    // read existing messages
    this.readChannel();
  }

  // Print an entry to your console
  private static printEntry(entry: ChatEntry) {
    console.log(`${entry.username} at ${entry.time}: ${entry.message}`);
  }

  // Add an entry to the channel
  private writeChannel(myEntry: ChatEntry) {
    const entries: ChatEntry[] = JSON.parse(readFileSync(this.channel, 'utf8'));
    // print entries, starting from the header
    for (let i = this.head; i < entries.length; ++i) {
      ChatClient.printEntry(entries[i]);
    }
    // add your own message to file, and print
    writeFileSync(this.channel, JSON.stringify(entries.concat(entries)));
    ChatClient.printEntry(myEntry);
    // move head to the end of entries
    this.head = entries.length + 1;
  }

  // Read entries in the channel
  private readChannel() {
    const entries: ChatEntry[] = JSON.parse(readFileSync(this.channel, 'utf8'));
    // print entries, starting from the header
    for (let i = this.head; i < entries.length; ++i) {
      ChatClient.printEntry(entries[i]);
    }
    // move head to the end of entries
    this.head = entries.length;
  }

  // Start the active loop, which excepts input from the user and also refreshes the channel
  public async interface() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let entry: ChatEntry;
    // launch interval for the screen refresh
    const interval: NodeJS.Timeout = setInterval(() => {
      () => this.readChannel;
    }, REFRESH_TIME_MS);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      entry = await this.prompt(rl, '>: ');
      if (entry.message === EXIT_TEXT) {
        break;
      } else {
        this.writeChannel(entry);
      }
    }

    // clear refresh
    clearInterval(interval);
  }

  // Prompt the client for input
  private prompt(I: Interface, prompt = '>: '): Promise<ChatEntry> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      I.question(prompt, input => {
        resolve({
          username: this.username,
          message: input,
          time: new Date().toTimeString(),
        });
      });
    });
  }
}
