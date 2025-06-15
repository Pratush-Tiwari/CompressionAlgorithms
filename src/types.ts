export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressedData: string;
  algorithm: string;
}

export interface HuffmanResult {
  compressed: string;
  tree: string;
}

export type CompressionAlgorithm = "RLE" | "Huffman" | "LZW";
export type OperationMode = "compress" | "decompress";
