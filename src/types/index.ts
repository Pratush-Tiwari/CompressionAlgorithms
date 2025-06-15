export type CompressionAlgorithm = 'RLE' | 'Huffman' | 'LZW';

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressedData: string;
  algorithm: CompressionAlgorithm;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
} 