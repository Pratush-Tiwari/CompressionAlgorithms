import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF processing for file:", file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log("File loaded, size:", arrayBuffer.byteLength, "bytes");

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    console.log("PDF loaded, number of pages:", pdf.numPages);

    let text = "";
    let hasText = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      if (content.items.length > 0) {
        hasText = true;
        const strings = content.items.map((item: any) => item.str);
        const pageText = strings.join(" ");
        console.log(`Page ${i} text length:`, pageText.length);
        text += pageText + "\n";
      } else {
        console.log(`Page ${i} has no text content`);
      }
    }

    if (!hasText) {
      console.error("No text content found in any page of the PDF");
      throw new Error(
        "The PDF appears to be empty or contains no extractable text. It might be a scanned document or contain only images."
      );
    }

    if (!text.trim()) {
      console.error("Extracted text is empty after trimming");
      throw new Error(
        "No readable text content found in the PDF. The file might be corrupted or contain only images."
      );
    }

    console.log("Successfully extracted text, total length:", text.length);
    return text;
  } catch (error) {
    console.error("Detailed PDF processing error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF structure")) {
        throw new Error(
          "The file appears to be corrupted or is not a valid PDF file."
        );
      } else if (error.message.includes("password")) {
        throw new Error(
          "The PDF file is password protected. Please remove the password protection and try again."
        );
      }
    }
    throw new Error(
      "Failed to extract text from PDF. Please make sure the file is a valid PDF and contains text."
    );
  }
}

export function downloadCompressedFile(
  content: string,
  filename: string
): void {
  try {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw new Error("Failed to download the compressed file");
  }
}
