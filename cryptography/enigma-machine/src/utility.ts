export function fisherYatesShuffle<T>(arr: readonly T[]): T[] {
  const array: T[] = JSON.parse(JSON.stringify(arr));
  let i: number = array.length;
  let tmp: T;
  let j: number;
  // while there remain elements to shuffle
  while (i !== 0) {
    // pick a remaining element
    j = Math.floor(i * Math.random());
    i--;
    // swap it with the current element.
    tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

export const DEFAULT_CHAT_CHANNEL = './chat/history.yaml';
export const CHAT_REFRESH_TIME_MS = 2000;
export const CHAT_EXIT_TEXT = 'EXIT()';

export interface ChatEntry {
  username: string;
  message: string;
  time: string;
}
