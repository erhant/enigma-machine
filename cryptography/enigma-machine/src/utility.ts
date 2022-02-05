import {assert} from 'console';

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

// A character type for readability. It is just a string of length 1.
export type char = string;

/**
 * A lexicographically sorted permutation generator for strings, based on Naraya Pandita's (14. century) algorithm.
 * Example usage:
 * ```js
 * const gen = generate_permutations('qwerty');
 * let i = gen.next();
 * while (!i.done) {
 *   console.log(i.value);
 *   i = gen.next();
 * }
 * ```
 * @param alphabet base string
 * @returns a generator to generate permutations
 */
export function* generate_permutations(
  alphabet: string
): Generator<string, undefined, string> {
  const n: number = alphabet.length;
  const s: char[] = [...alphabet].sort(); // get a character array, sorted
  let tmp: char; // temporary variable for swapping

  yield s.join(''); // first yield the sorted string

  // then start permuting
  while (true) {
    // 1. find k
    let i: number = n - 1;
    while (i > 0 && s[i - 1] >= s[i]) i--;
    if (i === 0) return; // done, no more permutations
    const k: number = i - 1;

    // 2. find l
    i = n - 1;
    while (i > k && s[k] >= s[i]) i--;
    const l: number = i;
    assert(k !== l);

    // 3. swap k and l
    tmp = s[k];
    s[k] = s[l];
    s[l] = tmp;

    // 4. reverse from k+1 and up
    i = k + 1;
    let j = n - 1;
    while (i < j) {
      tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
      i++;
      j--;
    }

    // yield the resulting new permutation
    yield s.join('');
  }
}
