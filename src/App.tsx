import { useState, type ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import {
  Loader2,
  FileUp,
  FileDown,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
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
  const [copyStates, setCopyStates] = useState({
    compressedText: false,
    huffmanTree: false,
    decompressedText: false,
    compressedData: false,
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert("Please select a PDF file");
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    try {
      const text = await extractTextFromPDF(selectedFile);
      if (!text) throw new Error("Could not extract text from PDF.");

      let compressedData: string;
      let compressedSize: number;

      switch (algorithm) {
        case "RLE":
          compressedData = RLECompression.compress(text);
          break;
        case "Huffman":
          const huffmanResult = HuffmanCompression.compress(text);
          compressedData = huffmanResult.compressed;
          setHuffmanTree(huffmanResult.tree);
          break;
        case "LZW":
          compressedData = LZWCompression.compress(text);
          break;
        default:
          throw new Error("Invalid algorithm selected");
      }

      compressedSize = new Blob([compressedData]).size;
      const originalSize = new Blob([text]).size;
      const compressionRatio =
        originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

      setResult({
        originalSize,
        compressedSize,
        compressionRatio,
        compressedData,
        algorithm,
      });

      // Remove auto-download
      // const filename = `${selectedFile.name.split(".")[0]}_${algorithm.toLowerCase()}_compressed.txt`;
      // downloadCompressedFile(compressedData, filename);
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
    if (!compressedText.trim()) {
      alert("Please enter compressed text to decompress");
      return;
    }
    setLoading(true);
    setDecompressedText("");
    try {
      let decompressed: string;
      switch (algorithm) {
        case "RLE":
          decompressed = RLECompression.decompress(compressedText);
          break;
        case "Huffman":
          if (!huffmanTree) {
            throw new Error(
              "Huffman tree is required. Please compress a file first to generate one."
            );
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

  const handleOperationModeChange = (value: string) => {
    if (value === "compress" || value === "decompress") {
      setOperationMode(value);
      setResult(null);
      setDecompressedText("");
      setCompressedText("");
      setSelectedFile(null);
    }
  };

  const handleCopy = async (text: string, field: keyof typeof copyStates) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates((prev) => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [field]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="h-10 w-10 text-indigo-600"
            fill="currentColor"
          >
            <path d="M248.8,114.16l-32-64A8,8,0,0,0,208.8,48H47.2a8,8,0,0,0-7.2,2.16l-32,64A8,8,0,0,0,8,120v88a16,16,0,0,0,16,16H232a16,16,0,0,0,16-16V120A8,8,0,0,0,248.8,114.16ZM232,208H24V124.23l28.8-57.6H203.2l28.8,57.6Z"></path>
          </svg>
          Text Compression Tool
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Compress and decompress text files using various algorithms
        </p>
      </header>

      <Tabs
        value={operationMode}
        onValueChange={handleOperationModeChange}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Compression Engine</CardTitle>
            <CardDescription>
              Choose your operation mode and algorithm to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 h-12 rounded-lg">
              <TabsTrigger
                value="compress"
                className="text-base h-10 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md"
              >
                <FileUp className="w-5 h-5 mr-2" />
                Compress
              </TabsTrigger>
              <TabsTrigger
                value="decompress"
                className="text-base h-10 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Decompress
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              <TabsContent value="compress" className="m-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-base" htmlFor="file-input">
                    Select PDF File
                  </Label>
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="file-input"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center text-gray-500 hover:bg-gray-50 transition-colors">
                        {selectedFile ? (
                          <span>
                            Selected: <strong>{selectedFile.name}</strong>
                          </span>
                        ) : (
                          "Click to choose a file..."
                        )}
                      </div>
                    </Label>
                    <Input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="decompress" className="m-0 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-base" htmlFor="compressed-text-area">
                      Compressed Text
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        handleCopy(compressedText, "compressedText")
                      }
                    >
                      {copyStates.compressedText ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="compressed-text-area"
                    placeholder="Paste your compressed text here..."
                    value={compressedText}
                    onChange={(e) => setCompressedText(e.target.value)}
                    rows={5}
                    className="text-base max-h-48 overflow-y-auto"
                  />
                </div>
                {algorithm === "Huffman" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base" htmlFor="huffman-tree-area">
                        Huffman Tree (JSON)
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(huffmanTree, "huffmanTree")}
                      >
                        {copyStates.huffmanTree ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="huffman-tree-area"
                      placeholder="Paste the Huffman tree JSON..."
                      value={huffmanTree}
                      onChange={(e) => setHuffmanTree(e.target.value)}
                      rows={3}
                      className="text-base max-h-32 overflow-y-auto"
                    />
                  </div>
                )}
              </TabsContent>

              <div className="space-y-2">
                <Label className="text-base" htmlFor="algorithm-select">
                  Compression Algorithm
                </Label>
                <Select
                  value={algorithm}
                  onValueChange={(val) =>
                    setAlgorithm(val as CompressionAlgorithm)
                  }
                >
                  <SelectTrigger
                    id="algorithm-select"
                    className="h-12 text-base"
                  >
                    <SelectValue placeholder="Select an algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RLE" className="text-base">
                      Run-Length Encoding (RLE)
                    </SelectItem>
                    <SelectItem value="Huffman" className="text-base">
                      Huffman Coding
                    </SelectItem>
                    <SelectItem value="LZW" className="text-base">
                      LZW Compression
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={
                  loading ||
                  (operationMode === "compress" && !selectedFile) ||
                  (operationMode === "decompress" && !compressedText.trim())
                }
                onClick={
                  operationMode === "compress"
                    ? handleCompress
                    : handleDecompress
                }
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                ) : operationMode === "compress" ? (
                  <FileUp className="w-5 h-5 mr-2" />
                ) : (
                  <FileDown className="w-5 h-5 mr-2" />
                )}
                {loading
                  ? "Processing..."
                  : operationMode === "compress"
                  ? "Compress File"
                  : "Decompress Text"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {result && operationMode === "compress" && (
        <Card className="w-full max-w-2xl mt-8 shadow-lg">
          <CardHeader>
            <CardTitle>Compression Complete</CardTitle>
            <CardDescription>
              Your file has been compressed using the{" "}
              <strong>{result.algorithm}</strong> algorithm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Original Size</p>
                <p className="text-lg font-semibold">
                  {result.originalSize.toLocaleString()} bytes
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Compressed Size</p>
                <p className="text-lg font-semibold">
                  {result.compressedSize.toLocaleString()} bytes
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  result.compressionRatio > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <p className="text-sm">Savings</p>
                <p className="text-lg font-semibold">
                  {result.compressionRatio.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="compressed-data-output">Compressed Data</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      handleCopy(result.compressedData, "compressedData")
                    }
                  >
                    {copyStates.compressedData ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const filename = `${
                        selectedFile?.name.split(".")[0]
                      }_${result.algorithm.toLowerCase()}_compressed.txt`;
                      downloadCompressedFile(result.compressedData, filename);
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                id="compressed-data-output"
                readOnly
                value={result.compressedData}
                className="h-28 font-mono text-xs max-h-48 overflow-y-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {decompressedText && operationMode === "decompress" && (
        <Card className="w-full max-w-2xl mt-8 shadow-lg">
          <CardHeader>
            <CardTitle>Decompression Complete</CardTitle>
            <CardDescription>Here is your original text.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="decompressed-output">Decompressed Text</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    handleCopy(decompressedText, "decompressedText")
                  }
                >
                  {copyStates.decompressedText ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Textarea
                id="decompressed-output"
                readOnly
                value={decompressedText}
                className="h-40 max-h-64 overflow-y-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default App;
