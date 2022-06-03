/**
 * Creates an array with a set number of arguments populated by a function. If
 * `skipNulls = true`, then any iterations of the function that return either
 * `undefined` or `null` will not be added to the resulting array.
 * 
 * @param length Number of items to populate the array with
 * @param fn Function that dictates what the array items should be
 * @param skipNulls Optional argument to specify whether null/undefined results
 * should be skipped, rather than added to the array. False by default.
 * @param limit Maximum length of the list. If not provided, there is no maximum
 * length.
 * @returns Array containing values generated by the function
 */
export function makeList<T>(length: number, fn: (index: number) => T, skipNulls = false, limit?: number): T[] {
  const list: T[] = [];
  for (let i = 0; i < length; i++) {
    const item = fn(i)
    if ((item != undefined) || !skipNulls) list.push(item);
    if ((limit != undefined) && (list.length >= limit)) break;
  }
  return list;
}

/**
 * Removes objects from the given array by reference equality.
 * 
 * @param toRemove Objects to remove
 * @param removeFrom Array to remove objects from
 * @returns True if at least one item was removed, else false
 */
export function removeFromArray<T>(toRemove: T[], removeFrom: T[]): boolean {
  let anyRemoved = false;
  toRemove.forEach(obj => {
    const index = removeFrom.findIndex(o => o === obj);
    if (index < 0) return;
    removeFrom.splice(index, 1);
    anyRemoved = true;
  });
  return anyRemoved;
}

/** Represents an object that has an `equals()` method. */
type Equalable = { equals(item: any): boolean; };

/**
 * Checks if the two given arrays contain the same contents, as dictacted by
 * the first array's children's `equals()` methods. The elements do not need to
 * be in the same order. Time complexity is O(n^2), so use sparingly.
 * 
 * @param arr1 First array to check
 * @param arr2 Second array to check
 */
export function arraysAreEqual(arr1: Equalable[], arr2: any[]): boolean {
  if (arr1.length !== arr2?.length) return false;
  return arr1.every(a => arr2.some(b => a.equals(b)));
}

/**
 * Checks the given buffer and returns whether or not it contains XML content.
 * This is determined by the presence of an XML header, so it will return false
 * for XML files that do not have a header.
 * 
 * @param buffer Buffer to check contents of
 * @returns True if this buffer contains XML, false otherwise
 */
export function bufferContainsXml(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.toString("utf-8", 0, 5) === "<?xml";
}

/**
 * Checks the given buffer and returns whether or not it begins with four bytes
 * that spell "DATA" in UTF-8.
 * 
 * @param buffer Buffer to check contents of
 * @returns True if this buffer begins with "DATA" in binary, false otherwise
 */
export function bufferContainsDATA(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.toString("utf-8", 0, 4) === "DATA";
}

/**
 * Returns a Promise that resolves with the result of the given function.
 * 
 * @param fn Function that returns the object to be wrapped in a Promise
 */
export function promisify<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const result = fn();
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Returns a subarray of the given array that contains of all values between the
 * given start index and the first value that is mapped to something falsey.
 * 
 * @param arr Source array
 * @param startIndex (Optional) Index to start at, 0 by default
 * @param fn (Optional) Mapper function, identity by default
 */
export function readUntilFalsey<T>(
  arr: T[],
  startIndex: number = 0,
  fn: ((t: T) => boolean) = (t: T) => Boolean(t)
): T[] {
  let i: number;
  for (i = startIndex; i < arr.length; i++)
    if (!fn(arr[i])) break;
  return arr.slice(startIndex, i);
}
