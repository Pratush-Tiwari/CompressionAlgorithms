// rle-compression.ts

export class RLECompression {
  /**
   * Compresses a given string using Run-Length Encoding.
   *
   * Format: `[count][character]` where `count` is omitted if 1.
   * Example: "AAABBC" -> "3A2BC"
   *
   * @param text The input string to be compressed.
   * @returns The RLE-compressed string. Returns an empty string if input is empty.
   */
  static compress(text: string): string {
    if (!text) {
      return "";
    }

    let result = "";
    let count = 1;
    let currentChar = text[0];

    // Iterate starting from the second character
    for (let i = 1; i < text.length; i++) {
      if (text[i] === currentChar) {
        // If the current character is the same as the previous, increment count
        count++;
      } else {
        // If the character changes, append the current run to the result
        // Append count only if it's greater than 1
        result += (count > 1 ? count.toString() : "") + currentChar;

        // Reset for the new run
        currentChar = text[i];
        count = 1;
      }
    }

    // Append the last run after the loop finishes
    result += (count > 1 ? count.toString() : "") + currentChar;

    return result;
  }

  /**
   * Decompresses an RLE-encoded string back into the original text.
   *
   * Assumes the format `[count][character]` where `count` is optional (defaults to 1).
   *
   * @param compressed The RLE-compressed string.
   * @returns The decompressed original string. Returns an empty string if input is empty.
   * @throws Error if the compressed data is malformed (e.g., ends with a number or has invalid format).
   */
  static decompress(compressed: string): string {
    if (!compressed) {
      return "";
    }

    let result = "";
    let countBuffer = ""; // Stores digits for the current count

    // Iterate through the compressed string
    for (let i = 0; i < compressed.length; i++) {
      const char = compressed[i];

      // Check if the current character is a digit
      if (/\d/.test(char)) {
        countBuffer += char; // Accumulate digits for the count
      } else {
        // If it's not a digit, it must be the character to repeat
        // Determine the repeat count: if countBuffer is empty, it's 1, otherwise parse it
        const repeatCount = countBuffer ? parseInt(countBuffer, 10) : 1;

        // Ensure repeatCount is valid
        if (isNaN(repeatCount) || repeatCount < 0) {
          throw new Error(
            `Invalid compressed data: Bad repeat count '${countBuffer}' at index ${
              i - countBuffer.length
            }`
          );
        }

        // Append the character repeated 'repeatCount' times
        result += char.repeat(repeatCount);

        // Reset count buffer for the next run
        countBuffer = "";
      }
    }

    // After the loop, if countBuffer is not empty, it means the compressed string
    // ended with a number, which is an invalid RLE format.
    if (countBuffer !== "") {
      throw new Error(
        "Invalid compressed data: Compressed string cannot end with a number."
      );
    }

    return result;
  }
}
