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
