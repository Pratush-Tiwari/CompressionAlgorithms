import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import { RLECompression } from "./algorithms/rle";
import { HuffmanCompression } from "./algorithms/huffman";
import { LZWCompression } from "./algorithms/lzw";
import { extractTextFromPDF, downloadCompressedFile } from "./utils/pdfUtils";
import type { CompressionAlgorithm, CompressionResult } from "./types";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<CompressionAlgorithm>("RLE");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [operationMode, setOperationMode] = useState<"compress" | "decompress">(
    "compress"
  );
  const [compressedText, setCompressedText] = useState("");
  const [decompressedText, setDecompressedText] = useState("");
  const [huffmanTree, setHuffmanTree] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert("Please select a PDF file");
    }
  };

  const handleCompress = async () => {
    setLoading(true);
    try {
      if (!selectedFile) return;
      const text = await extractTextFromPDF(selectedFile);

      let compressedData: string;
      let compressedSize: number;

      switch (algorithm) {
        case "RLE":
          compressedData = RLECompression.compress(text);
          compressedSize = compressedData.length;
          break;
        case "Huffman":
          const huffmanResult = HuffmanCompression.compress(text);
          compressedData = huffmanResult.compressed;
          compressedSize = compressedData.length;
          setHuffmanTree(huffmanResult.tree);
          break;
        case "LZW":
          compressedData = LZWCompression.compress(text);
          compressedSize = compressedData.length;
          break;
        default:
          throw new Error("Invalid algorithm selected");
      }

      if (!compressedData || compressedData.length === 0) {
        throw new Error("Compression failed - no output generated");
      }

      const originalSize = text.length;
      const compressionRatio = (1 - compressedSize / originalSize) * 100;

      setResult({
        originalSize,
        compressedSize,
        compressionRatio,
        compressedData,
        algorithm,
      });

      // Download the compressed file
      const filename = `${
        selectedFile.name.split(".")[0]
      }_${algorithm.toLowerCase()}_compressed.txt`;
      downloadCompressedFile(compressedData, filename);
    } catch (error) {
      console.error("Compression error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred during compression"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecompress = () => {
    setLoading(true);
    try {
      if (!compressedText.trim()) {
        throw new Error("Please enter compressed text to decompress");
      }

      let decompressed: string;

      switch (algorithm) {
        case "RLE":
          decompressed = RLECompression.decompress(compressedText);
          break;
        case "Huffman":
          if (!huffmanTree) {
            throw new Error("Huffman tree is required for decompression");
          }
          decompressed = HuffmanCompression.decompress(
            compressedText,
            huffmanTree
          );
          break;
        case "LZW":
          decompressed = LZWCompression.decompress(compressedText);
          break;
        default:
          throw new Error("Invalid algorithm selected");
      }

      setDecompressedText(decompressed);
    } catch (error) {
      console.error("Decompression error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred during decompression"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOperationModeChange = (
    _: React.SyntheticEvent,
    newValue: "compress" | "decompress"
  ) => {
    setOperationMode(newValue);
    setResult(null);
    setDecompressedText("");
    setCompressedText("");
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Text Compression Tool
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Tabs
            value={operationMode}
            onChange={handleOperationModeChange}
            sx={{ mb: 3 }}
            centered
          >
            <Tab value="compress" label="Compress" />
            <Tab value="decompress" label="Decompress" />
          </Tabs>

          {operationMode === "compress" ? (
            <Box sx={{ mb: 3 }}>
              <input
                accept=".pdf"
                style={{ display: "none" }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button variant="contained" component="span">
                  Upload PDF
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Box>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={compressedText}
              onChange={(e) => setCompressedText(e.target.value)}
              placeholder="Enter compressed text to decompress..."
              sx={{ mb: 3 }}
            />
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Compression Algorithm</InputLabel>
            <Select
              value={algorithm}
              label="Compression Algorithm"
              onChange={(e) =>
                setAlgorithm(e.target.value as CompressionAlgorithm)
              }
            >
              <MenuItem value="RLE">Run-Length Encoding (RLE)</MenuItem>
              <MenuItem value="Huffman">Huffman Coding</MenuItem>
              <MenuItem value="LZW">LZW Compression</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={
              operationMode === "compress" ? handleCompress : handleDecompress
            }
            disabled={
              loading ||
              (operationMode === "compress"
                ? !selectedFile
                : !compressedText.trim())
            }
            fullWidth
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : operationMode === "compress" ? (
              "Compress"
            ) : (
              "Decompress"
            )}
          </Button>
        </Paper>

        {result && operationMode === "compress" && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Compression Results
            </Typography>
            <Typography variant="body1">
              Original Size: {result.originalSize} bytes
            </Typography>
            <Typography variant="body1">
              Compressed Size: {result.compressedSize} bytes
            </Typography>
            <Typography variant="body1">
              Compression Ratio: {result.compressionRatio.toFixed(2)}%
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, wordBreak: "break-all" }}>
              Compressed Data: {result.compressedData}
            </Typography>
          </Paper>
        )}

        {decompressedText && operationMode === "decompress" && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Decompression Results
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
              Decompressed Text: {decompressedText}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App;
