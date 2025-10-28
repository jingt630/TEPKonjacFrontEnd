// Copy this entire file to: concept_backend/src/concepts/TextExtraction/TextExtraction.ts

import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "../../../gemini-llm.ts";

// Declare collection prefix, use concept name
const PREFIX = "TextExtraction" + ".";

// Generic types of this concept
type FilePath = ID;
type ExtractionResult = ID;
type Location = ID;
type Coordinate = number;
type TextId = string;

/**
 * A set of ExtractionResults with
 *   imagePath of type FilePath
 *   extractedText of type String
 *   position of type Location
 *   textId of type String
 */
interface ExtractionResults {
  _id: ExtractionResult;
  imagePath: FilePath;
  extractedText: string;
  position: Location;
  textId: TextId;
}

/**
 * A set of Location with
 *   an ExtractionResult
 *   two Coordinate (Number, Number)
 */
interface Locations {
  _id: Location;
  extractionResultId: ExtractionResult;
  fromCoord: [Coordinate, Coordinate];
  toCoord: [Coordinate, Coordinate];
}

export default class TextExtractionConcept {
  extractionResults: Collection<ExtractionResults>;
  locations: Collection<Locations>;
  mediaFiles: Collection<any>; // Reference to MediaManagement collection
  mediaStorage: Collection<any>; // Reference to MediaStorage collection - NEW!
  private geminiLLM: GeminiLLM;

  constructor(private readonly db: Db) {
    this.extractionResults = this.db.collection(PREFIX + "extractionResults");
    this.locations = this.db.collection(PREFIX + "locations");
    this.mediaFiles = this.db.collection("MediaManagement.mediaFiles");
    this.mediaStorage = this.db.collection("MediaStorage.storedImages"); // NEW!
    this.geminiLLM = new GeminiLLM();
  }

  /**
   * Get image dimensions from file
   */
  private async getImageDimensions(
    filePath: string,
  ): Promise<{ width: number; height: number }> {
    try {
      // For simplicity, we'll use default dimensions if we can't determine
      // In a real implementation, you'd use an image library to read dimensions
      return { width: 1024, height: 768 }; // Default dimensions
    } catch (error) {
      console.warn("⚠️ Could not determine image dimensions, using defaults");
      return { width: 1024, height: 768 };
    }
  }

  /**
   * Parse numbered text list from Gemini response
   */
  private parseNumberedTextList(response: string): string[] {
    if (!response || response === "No text found") return [];

    const items: Array<{ idx: number; text: string }> = [];
    const lines = response.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip the final summary line
      if (/^Number of text block/i.test(line)) continue;

      // Match "1: text", "1. text", "1) text"
      const m = line.match(/^\s*(\d+)\s*[:\.\)]\s*(.*)$/);
      if (!m) continue;

      const idx = parseInt(m[1], 10);
      let text = m[2].trim();

      // Remove trailing coordinate parenthesis
      text = text.replace(/\s*\([^)]*(from|to)[^)]*\)\s*$/i, "").trim();
      text = text.replace(/\s*\([^)]*\)\s*$/, "").trim();

      // Strip surrounding quotes and HTML-like tags
      text = text.replace(/^["'""''\s]+|["'""''\s]+$/g, "").replace(
        /<\/?[^>]+(>|$)/g,
        "",
      ).trim();

      if (text.length > 0) items.push({ idx, text });
    }

    if (items.length === 0) return [];

    items.sort((a, b) => a.idx - b.idx);
    return items.map((p) => p.text);
  }

  /**
   * Parse coordinates list from Gemini response
   */
  private parseCoordinatesList(
    response: string,
  ): Array<
    { fromCoord: [Coordinate, Coordinate]; toCoord: [Coordinate, Coordinate] }
  > {
    const coordRegex =
      /\(\s*from:\s*\{x:(-?\d+),\s*y:(-?\d+)\},\s*to:\s*\{x:(-?\d+),\s*y:(-?\d+)\}\s*\)/g;

    const matches = [...response.matchAll(coordRegex)];
    const results = matches.map((match) => ({
      fromCoord: [parseInt(match[1], 10), parseInt(match[2], 10)] as [
        Coordinate,
        Coordinate,
      ],
      toCoord: [parseInt(match[3], 10), parseInt(match[4], 10)] as [
        Coordinate,
        Coordinate,
      ],
    }));

    return results;
  }

  /**
   * extractTextFromMedia (userId: ID, mediaId: ID, prompt?: string): (result: ExtractionResult)
   *
   * **requires**: `mediaId` exists in MediaManagement and belongs to `userId`.
   *
   * **effects**: Uses AI (Google Gemini) to extract text from the image with coordinates. Creates multiple `ExtractionResult` objects for each text block found.
   */
  async extractTextFromMedia({
    userId,
    mediaId,
  }: {
    userId: ID;
    mediaId: ID;
  }): Promise<{ results: ExtractionResult[] } | { error: string }> {
    // Get the media file from MediaManagement
    const mediaFile = await this.mediaFiles.findOne({
      _id: mediaId,
      owner: userId,
    });

    if (!mediaFile) {
      return { error: "Media file not found or access denied" };
    }

    try {
      console.log(
        `🤖 Starting Gemini AI text extraction for: ${mediaFile.filename}`,
      );

      // ========== CHANGED: Read from DATABASE instead of DISK ==========
      // Get image data from database
      const storedImage = await this.mediaStorage.findOne({ mediaId: mediaId });

      if (!storedImage || !storedImage.imageData) {
        console.error(`❌ Image data not found in database for mediaId: ${mediaId}`);
        return { error: "Image data not found in database. Please re-upload the image." };
      }

      console.log(`✅ Image data retrieved from database (${storedImage.size} bytes)`);

      // Prepare image data for AI (with data URI prefix if not already present)
      const imageDataForAI = storedImage.imageData.startsWith('data:')
        ? storedImage.imageData
        : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;

      // Get image dimensions (using default since we can't easily get from base64)
      const dimensions = { width: 1920, height: 1080 }; // Default dimensions
      console.log(
        `📐 Using default dimensions: ${dimensions.width}x${dimensions.height}`,
      );
      // ========== END CHANGES ==========

      // Build the OCR prompt
      const ocrPrompt =
        `You are an OCR assistant. Read all visible text in the given image
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
Keep numeric elements together with their associated words (e.g., "2025" and "Festival")
in a single text block whenever they belong to the same phrase or visual line.
The incoming image's dimensions is ${dimensions.width}x${dimensions.height}. Label textblocks with accurate coordinates
that is relevant to the image's dimensions.
Strictly follow this format, with no extra commentary:
An example response format:
1: <text> (from: {x:12, y:34}, to: {x:56, y:78})
2: <text> (from: {x:90, y:12}, to: {x:34, y:56})
...
N: <text> (from: {x:A, y:B}, to: {x:C, y:D})
Number of text blocks: N`;

      // Call Gemini AI with base64 image data
      console.log(`📤 Sending image data to Gemini AI...`);
      const aiResponse = await this.geminiLLM.executeLLM(ocrPrompt, imageDataForAI);
      console.log(`✅ Gemini extraction complete`);

      // Parse the response
      const textBlocks = this.parseNumberedTextList(aiResponse);
      const coordinates = this.parseCoordinatesList(aiResponse);

      console.log(`📝 Found ${textBlocks.length} text blocks`);

      // Create extraction results for each text block
      const extractionIds: ExtractionResult[] = [];

      for (let i = 0; i < textBlocks.length; i++) {
        const existingExtractions = await this.extractionResults
          .find({ imagePath: mediaId })
          .toArray();
        const textId = `${mediaId}_${existingExtractions.length}`;
        const newExtractionResultId = freshID() as ExtractionResult;

        // Get coordinates or use defaults
        const coords = coordinates[i] || {
          fromCoord: [0, 0] as [Coordinate, Coordinate],
          toCoord: [100, 100] as [Coordinate, Coordinate],
        };

        // Create location
        const newLocationId = freshID() as Location;
        await this.locations.insertOne({
          _id: newLocationId,
          extractionResultId: newExtractionResultId,
          fromCoord: coords.fromCoord,
          toCoord: coords.toCoord,
        });

        // Store the extraction result
        await this.extractionResults.insertOne({
          _id: newExtractionResultId,
          imagePath: mediaId,
          extractedText: textBlocks[i],
          position: newLocationId,
          textId: textId,
        });

        extractionIds.push(newExtractionResultId);
      }

      console.log(`✅ Created ${extractionIds.length} extraction records`);
      return { results: extractionIds };
    } catch (error) {
      console.error("❌ Error in extractTextFromMedia:", error);
      return { error: (error as Error).message };
    }
  }

  // ... rest of the methods remain the same (editExtractText, syncTranslationsForText, editLocation, etc.)
  // Copy the rest from your existing TextExtraction.ts file
}
