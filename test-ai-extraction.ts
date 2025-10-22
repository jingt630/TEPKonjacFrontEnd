// Test AI Text Extraction with Spirited Away Poster
import { GeminiLLM } from "./src/gemini-llm.ts";

async function testExtraction() {
  console.log("🧪 Testing AI Text Extraction with Spirited Away Poster\n");

  const imagePath = "./Spirited away movie poster.jpg";

  // Test 1: Basic OCR
  console.log("📝 Test 1: Basic OCR - Extract all text from the poster\n");
  const prompt1 = `You are an OCR assistant. Read all visible text in the given image
            and return only the readable text. Do not describe the image or repeat the base64 data.
            Return plain text only, formatted for readability by numbering each text block u recognize.
            Also keep track of the position of each text block in the image, using coordinates.
            Coordinates are given as (x,y) pairs, where (0,0) is the top-left corner of the image.
            The 'from' coordinate is the top-left corner of the text block, and the 'to' coordinate is
            the bottom-right corner. The coordinates should be integers representing pixel positions in the image
            relative to the image dimensions. If no text can be found, return "No text found". When two or more
            short text segments appear close together (within the same logical phrase or line group), merge them
            into a single text block rather than splitting them. Treat small vertical spacing as part of the same
            block if the text forms a continuous sentence or title.
            Do not add, infer, or search for any information that is not explicitly readable.
            Do not use external knowledge or guess missing words based on what the image might represent.
            Apply the same grouping logic for all languages — English, Chinese, or others — merging vertically or
            horizontally aligned characters that form a single title or phrase.
            When estimating coordinates, ensure that (from) and (to) precisely cover only the visible text area.
            Avoid random or uniform coordinates that do not match the actual layout.
            Keep numeric elements together with their associated words (e.g., “2025” and “Festival”)
            in a single text block whenever they belong to the same phrase or visual line. Label textblocks with accurate coordinates
            that is relevant to the image's dimensions.
            Strictly follow this format, with no extra commentary:
            An example response format:
            1: <text> (from: {x:12, y:34}, to: {x:56, y:78})
            2: <text> (from: {x:90, y:12}, to: {x:34, y:56})
            ...
            N: <text> (from: {x:A, y:B}, to: {x:C, y:D})
            Number of text blocks: N`;

  try {
    const llm = new GeminiLLM();
    const result1 = await llm.executeLLM(prompt1, imagePath);
    console.log("✅ RESULT 1 (Basic OCR):");
    console.log("=" .repeat(60));
    console.log(result1);
    console.log("=" .repeat(60));
    console.log("\n");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Structured extraction with coordinates
  console.log("📍 Test 2: Extract text with approximate positions\n");
  const prompt2 = `You are an OCR system with spatial awareness.

1. Identify ALL visible text in this image
2. For each text block, provide:
   - The text content
   - Approximate position (top/middle/bottom, left/center/right)
   - Font size (large/medium/small)

Format your response like this:
TEXT: "actual text here"
POSITION: top-center
SIZE: large
---
TEXT: "next text"
POSITION: middle-right
SIZE: small
---

Be thorough and accurate.`;

  try {
    const llm = new GeminiLLM();
    const result2 = await llm.executeLLM(prompt2, imagePath);
    console.log("✅ RESULT 2 (Structured with positions):");
    console.log("=" .repeat(60));
    console.log(result2);
    console.log("=" .repeat(60));
    console.log("\n");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: Multilingual detection
  console.log("🌐 Test 3: Detect languages and extract accordingly\n");
  const prompt3 = `Analyze this image and identify all text, paying special attention to multiple languages.

For each text element:
1. Identify the language (English, Japanese, etc.)
2. Provide the text content
3. If Japanese, provide romaji transliteration if possible

Format:
LANGUAGE: [language]
TEXT: [text content]
ROMAJI: [if Japanese]
---`;

  try {
    const llm = new GeminiLLM();
    const result3 = await llm.executeLLM(prompt3, imagePath);
    console.log("✅ RESULT 3 (Multilingual):");
    console.log("=" .repeat(60));
    console.log(result3);
    console.log("=" .repeat(60));
    console.log("\n");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  console.log("🎉 Testing complete!");
}

// Run the test
testExtraction();
