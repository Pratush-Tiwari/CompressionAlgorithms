# Text Compression Tool

A React-based web application that demonstrates various text compression techniques. This tool allows users to upload PDF files and compress their text content using different algorithms.

## Features

- PDF file upload and text extraction
- Multiple compression algorithms:
  - Run-Length Encoding (RLE)
  - Huffman Coding
  - LZW (Lempel–Ziv–Welch)
- Compression statistics display
- Automatic download of compressed files

## Technologies Used

- React with TypeScript
- Material-UI for the user interface
- PDF.js for PDF text extraction
- Custom compression algorithm implementations

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Usage

1. Click the "Upload PDF" button to select a PDF file
2. Choose a compression algorithm from the dropdown menu
3. Click "Compress" to process the file
4. View the compression results and download the compressed file

## Compression Algorithms

### Run-Length Encoding (RLE)

A simple compression algorithm that replaces repeated characters with a count and the character.

### Huffman Coding

A variable-length encoding algorithm that assigns shorter codes to more frequent characters.

### LZW Compression

A dictionary-based compression algorithm that builds a dictionary of repeated patterns during compression.

## Future Improvements

- Add decompression functionality
- Support for more file formats
- Additional compression algorithms
- Compression comparison tools
- Batch processing capabilities
# CompressionAlgorithms
# CompressionAlgorithms
