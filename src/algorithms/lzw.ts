// lzw-compression.ts

export class LZWCompression {
  /**
   * Compresses a given string using the LZW algorithm.
   *
   * @param text The input string to be compressed.
   * @returns A comma-separated string of LZW codes. Returns an empty string if input is empty.
   */
  static compress(text: string): string {
    if (!text) {
      return "";
    }

    // Initialize dictionary with single-character ASCII codes (0-255)
    // Using Map for efficient lookups.
    const dictionary = new Map<string, number>();
    let dictSize = 256; // Next available code for new phrases

    for (let i = 0; i < dictSize; i++) {
      dictionary.set(String.fromCharCode(i), i);
    }

    const result: number[] = []; // Stores the LZW codes
    let currentPhrase = ""; // Represents the current working phrase

    for (const char of text) {
      const newPhrase = currentPhrase + char; // Try extending the current phrase with the next character

      if (dictionary.has(newPhrase)) {
        // If the new phrase is already in the dictionary, extend currentPhrase
        currentPhrase = newPhrase;
      } else {
        // If the new phrase is not in the dictionary:
        // 1. Output the code for the currentPhrase (which IS in the dictionary).
        result.push(dictionary.get(currentPhrase)!);

        // 2. Add the newPhrase to the dictionary.
        dictionary.set(newPhrase, dictSize++);

        // 3. Start a new currentPhrase with the current character.
        currentPhrase = char;
      }
    }

    // After the loop, if there's any remaining `currentPhrase`,
    // its code must be added to the result.
    if (currentPhrase) {
      result.push(dictionary.get(currentPhrase)!);
    }

    // Return the codes as a comma-separated string.
    return result.join(",");
  }

  /**
   * Decompresses a comma-separated string of LZW codes back into the original text.
   *
   * @param compressed A comma-separated string of LZW codes.
   * @returns The decompressed original string. Returns an empty string if input is empty.
   * @throws Error if the compressed data is invalid.
   */
  static decompress(compressed: string): string {
    if (!compressed) {
      return "";
    }

    // Initialize dictionary with single-character ASCII codes (0-255)
    // Using Map for efficient lookups.
    const dictionary = new Map<number, string>();
    let dictSize = 256; // Next available code for new phrases

    for (let i = 0; i < dictSize; i++) {
      dictionary.set(i, String.fromCharCode(i));
    }

    // Convert the comma-separated string of codes into an array of numbers.
    const codes = compressed.split(",").map(Number);

    let result = "";
    let prevPhrase: string; // The previously decoded phrase

    // Handle the first code separately: it must be a single character.
    const firstCode = codes[0];
    if (!dictionary.has(firstCode)) {
      throw new Error(
        "Invalid compressed data: First code is not in initial dictionary."
      );
    }
    prevPhrase = dictionary.get(firstCode)!;
    result += prevPhrase;

    // Iterate through the rest of the codes.
    for (let i = 1; i < codes.length; i++) {
      const currentCode = codes[i];
      let entry: string; // The string to be decoded for the current code

      if (dictionary.has(currentCode)) {
        // If the current code is already in the dictionary, retrieve its corresponding string.
        entry = dictionary.get(currentCode)!;
      } else if (currentCode === dictSize) {
        // This is the special case: currentCode is exactly the next available code.
        // This occurs when the current code represents the previous phrase extended by its first character.
        // E.g., "ABABAB", when processing the second "AB", 'A' is previous, 'B' is current, 'AB' is added.
        // Then if 'ABA' is the next phrase, 'AB' is previous. The next code for 'ABA' will be 'prevPhrase + prevPhrase[0]'.
        entry = prevPhrase + prevPhrase[0];
      } else {
        // If the code is not in the dictionary and not the special `dictSize` case,
        // it means the compressed data is corrupted or invalid.
        throw new Error(
          `Invalid compressed data: Code ${currentCode} is out of dictionary bounds.`
        );
      }

      result += entry; // Append the decoded entry to the result.

      // Add the new phrase to the dictionary:
      // It's always the `prevPhrase` followed by the first character of the `entry` we just decoded.
      dictionary.set(dictSize++, prevPhrase + entry[0]);

      // Update `prevPhrase` for the next iteration.
      prevPhrase = entry;
    }

    return result;
  }
}
