import {createInterface, Interface} from 'readline';
import {Enigma} from './enigma';
import {readFileSync} from 'fs';

const CHAT_CHANNEL = '../chat/history.json';
const REFRESH_TIME_MS = 2000;
const EXIT_TEXT = 'EXIT';

interface ChatEntry {
  username: string;
  message: string;
  datetime: string;
}
interface ChatHistory {
  entries: ChatEntry[];
}

class ChatClient {
  username: string; // Username
  enigma: Enigma; // Enigma machine to be used
  history: ChatHistory;
  channel: string;

  constructor(
    username: string,
    enigma: Enigma,
    channel: string = CHAT_CHANNEL
  ) {
    this.username = username;
    this.enigma = enigma;
    this.channel = channel;
    this.history = ChatClient.readChannel(channel);
  }

  private static readChannel(channel: string): ChatHistory {
    return JSON.parse(readFileSync(channel, 'utf8'));
  }

  public async interface() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let entry: ChatEntry;
    // launch interval for the screen refresh
    const interval: NodeJS.Timeout = setInterval(
      this.refresh,
      REFRESH_TIME_MS,
      this.username
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      entry = await this.prompt(rl, '>: ');
      if (entry.message === EXIT_TEXT) {
        break;
      } else {
        this.write(entry);
      }
    }

    // clear refresh
    clearInterval(interval);
  }

  private refresh() {
    // todo
  }

  // Prompt the client for input
  private prompt(I: Interface, prompt = '>: '): Promise<ChatEntry> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      I.question(prompt, input => {
        resolve({
          username: this.username,
          message: input,
          datetime: Date.toString(),
        });
      });
    });
  }
}
