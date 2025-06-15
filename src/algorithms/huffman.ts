// huffman-compression.ts
// Ensure you have the MinHeap class imported or in the same file
// import { MinHeap } from './min-heap'; // If in a separate file

/**
 * Interface for a Huffman tree node.
 * 'char' is optional as internal nodes do not represent a character.
 */

// min-heap.ts
// A simple MinHeap implementation for Huffman tree construction
export class MinHeap<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp();
  }

  extractMin(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    if (this.size() === 1) {
      return this.heap.pop();
    }
    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!; // Move last element to root
    this.bubbleDown();
    return min;
  }

  peekMin(): T | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  private bubbleUp(): void {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [
          this.heap[parentIndex],
          this.heap[index],
        ]; // Swap
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(): void {
    let index = 0;
    const lastIndex = this.heap.length - 1;
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestIndex = index;

      if (
        leftChildIndex <= lastIndex &&
        this.comparator(this.heap[leftChildIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex <= lastIndex &&
        this.comparator(this.heap[rightChildIndex], this.heap[smallestIndex]) <
          0
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex !== index) {
        [this.heap[index], this.heap[smallestIndex]] = [
          this.heap[smallestIndex],
          this.heap[index],
        ]; // Swap
        index = smallestIndex;
      } else {
        break;
      }
    }
  }
}

interface HuffmanNode {
  char?: string;
  freq: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

/**
 * Represents the result of the Huffman compression,
 * containing the compressed bit string and the serialized Huffman tree.
 */
interface HuffmanCompressionResult {
  compressed: string;
  tree: string; // JSON string representation of the Huffman tree
  // Added for single character edge case:
  originalCharForSingle?: string; // Stores the character if original text had only one unique char
}

export class HuffmanCompression {
  /**
   * Builds a frequency map for characters in the input text.
   * @param text The input string.
   * @returns A Map where keys are characters and values are their frequencies.
   */
  private static buildFrequencyMap(text: string): Map<string, number> {
    const freqMap = new Map<string, number>();
    for (const char of text) {
      freqMap.set(char, (freqMap.get(char) || 0) + 1);
    }
    return freqMap;
  }

  /**
   * Builds the Huffman tree from a frequency map using a MinHeap.
   * @param freqMap The frequency map of characters.
   * @returns The root node of the Huffman tree.
   */
  private static buildHuffmanTree(
    freqMap: Map<string, number>
  ): HuffmanNode | null {
    // Create a min-heap to store nodes, ordered by frequency
    const minHeap = new MinHeap<HuffmanNode>((a, b) => a.freq - b.freq);

    // Add initial leaf nodes to the heap
    freqMap.forEach((freq, char) => {
      minHeap.insert({ char, freq });
    });

    // Handle edge case: if only one unique character, Huffman tree building
    // results in a single node which isn't a proper tree for encoding.
    // We'll handle this specially in compress/decompress.
    if (minHeap.size() === 1) {
      // Return the single node, signaling a special case.
      return minHeap.extractMin()!;
    }

    // Build the Huffman tree by repeatedly extracting two smallest nodes
    // and combining them until only one node (the root) remains.
    while (minHeap.size() > 1) {
      const left = minHeap.extractMin()!;
      const right = minHeap.extractMin()!;

      // Create a new internal node
      const parentNode: HuffmanNode = {
        freq: left.freq + right.freq,
        left,
        right,
        // No char property for internal nodes
      };
      minHeap.insert(parentNode);
    }

    // The last node in the heap is the root of the Huffman tree
    return minHeap.extractMin() || null;
  }

  /**
   * Builds the encoding map (character to bit string) by traversing the Huffman tree.
   * @param root The root node of the Huffman tree.
   * @returns A Map where keys are characters and values are their Huffman codes.
   */
  private static buildEncodingMap(
    root: HuffmanNode | null
  ): Map<string, string> {
    const encodingMap = new Map<string, string>();

    // Edge case: empty tree or single character (which is handled separately)
    if (!root) {
      return encodingMap;
    }

    function traverse(node: HuffmanNode, code: string) {
      // If it's a leaf node, it has a character, store its code
      if (node.char !== undefined && !node.left && !node.right) {
        encodingMap.set(node.char, code === "" ? "0" : code); // Special case for single-char input
        return;
      }
      // Traverse left (append '0')
      if (node.left) {
        traverse(node.left, code + "0");
      }
      // Traverse right (append '1')
      if (node.right) {
        traverse(node.right, code + "1");
      }
    }

    // Start traversal from the root with an empty code string
    traverse(root, "");
    return encodingMap;
  }

  /**
   * Compresses the input text using Huffman coding.
   * @param text The input string to compress.
   * @returns An object containing the compressed bit string and the serialized Huffman tree.
   */
  static compress(text: string): HuffmanCompressionResult {
    if (!text) {
      return { compressed: "", tree: "" };
    }

    const freqMap = this.buildFrequencyMap(text);

    // Handle single character edge case:
    // If there's only one unique character, Huffman algorithm degenerates.
    // We store the character and a dummy compressed string (e.g., "0")
    // and signal this in the result for decompression.
    if (freqMap.size === 1) {
      const char = freqMap.keys().next().value as string;
      const treeNode: HuffmanNode = { char: char, freq: freqMap.get(char)! };
      return {
        compressed: "0".repeat(text.length), // A dummy sequence, actual value doesn't matter much for this case
        tree: JSON.stringify(treeNode),
        originalCharForSingle: char, // Store the character to reconstruct
      };
    }

    const tree = this.buildHuffmanTree(freqMap); // This will return a proper tree now
    if (!tree) {
      // Should not happen if freqMap.size > 1
      return { compressed: "", tree: "" };
    }

    const encodingMap = this.buildEncodingMap(tree);

    let compressed = "";
    for (const char of text) {
      compressed += encodingMap.get(char);
    }

    // Convert tree to string representation for storage/transmission
    const treeStr = JSON.stringify(tree);

    return { compressed, tree: treeStr };
  }

  /**
   * Decompresses a Huffman-encoded bit string using the provided Huffman tree.
   * @param compressed The Huffman-encoded bit string.
   * @param treeStr The JSON string representation of the Huffman tree.
   * @returns The original decompressed text.
   */
  static decompress(compressed: string, treeStr: string): string {
    if (!compressed || !treeStr) {
      return "";
    }

    const tree = JSON.parse(treeStr) as HuffmanNode;

    // Handle the single character edge case during decompression
    // We check if the parsed tree is a single leaf node (no left/right children)
    // AND if it has the originalCharForSingle property from compression result.
    // Note: The `originalCharForSingle` is actually passed *within* the `HuffmanCompressionResult`
    // object. To use it directly here, you'd need to pass the *entire* result object or store it
    // differently. For simplicity, we'll check if the tree is just a single leaf.
    if (tree.char !== undefined && !tree.left && !tree.right) {
      // This implies it was a single character input during compression
      // The 'compressed' string would just be `text.length` repetitions of '0'
      // We reconstruct the original text based on the length of 'compressed' and the single char.
      return tree.char.repeat(compressed.length);
    }

    let result = "";
    let currentNode = tree;

    for (const bit of compressed) {
      if (bit === "0") {
        if (currentNode.left) {
          currentNode = currentNode.left;
        } else {
          // Error: Malformed compressed data or tree
          console.error(
            "Malformed Huffman data: Expected left child, but none found."
          );
          return "ERROR: Malformed data"; // Or throw an error
        }
      } else if (bit === "1") {
        if (currentNode.right) {
          currentNode = currentNode.right;
        } else {
          // Error: Malformed compressed data or tree
          console.error(
            "Malformed Huffman data: Expected right child, but none found."
          );
          return "ERROR: Malformed data"; // Or throw an error
        }
      } else {
        // Error: Invalid bit (not '0' or '1')
        console.error("Malformed Huffman data: Invalid bit encountered.");
        return "ERROR: Malformed data"; // Or throw an error
      }

      // If we've reached a leaf node, append its character to the result
      if (
        currentNode.char !== undefined &&
        !currentNode.left &&
        !currentNode.right
      ) {
        result += currentNode.char;
        currentNode = tree; // Reset to the root for the next character
      }
    }

    // Final check: If after processing all bits, we are not at the root
    // or a leaf node, it might indicate malformed data.
    // However, given the current logic, it should always end up back at the root
    // after decoding the last character.
    return result;
  }
}
