/**
 * Simple Deno Test - AI Text Extraction
 *
 * This is a minimal example showing how to call the AI text extraction function.
 *
 * Run with:
 * deno test --allow-read --allow-env --allow-net test-ai-extraction-simple.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MongoClient } from "npm:mongodb";
import TextExtractionConcept from "./concepts/TextExtraction/TextExtraction.ts";

// Load environment variables
import "https://deno.land/std@0.224.0/dotenv/load.ts";

Deno.test("AI Text Extraction - Spirited Away Poster", async () => {
  console.log("\n🎬 Testing AI extraction with Spirited Away poster\n");

  // ========== Setup ==========

  // 1. Connect to MongoDB
  const MONGODB_URL = Deno.env.get("MONGODB_URL") || "mongodb://localhost:27017";
  const DB_NAME = Deno.env.get("DB_NAME") || "test_concept_db";

  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log("✅ Connected to MongoDB");

  // 2. Create TextExtraction instance
  const textExtraction = new TextExtractionConcept(db);
  console.log("✅ TextExtraction instance created");

  // 3. Setup test data
  const testUserId = "test-user-" + crypto.randomUUID();
  const testMediaId = crypto.randomUUID();

  // 4. Create a media file record in database
  const mediaFiles = db.collection("MediaManagement.mediaFiles");
  await mediaFiles.insertOne({
    _id: testMediaId,
    filename: "Spirited away movie poster.jpg",
    filePath: "/TestImages",
    mediaType: "jpg",
    owner: testUserId,
    uploadDate: new Date(),
    updateDate: new Date(),
    cloudURL: "test://bucket/spirited.jpg"
  });
  console.log("✅ Test media file record created");

  // 5. Setup the actual image file on disk
  const imagePath = `./uploads/${testUserId}/TestImages`;
  await Deno.mkdir(imagePath, { recursive: true });

  // Copy the poster to the expected location
  const sourceImage = await Deno.readFile("./Spirited away movie poster.jpg");
  await Deno.writeFile(`${imagePath}/Spirited away movie poster.jpg`, sourceImage);
  console.log("✅ Test image file copied to:", imagePath);

  // ========== THE ACTUAL AI EXTRACTION CALL ==========

  console.log("\n🤖 Calling AI text extraction...\n");

  const result = await textExtraction.extractTextFromMedia({
    userId: testUserId,
    mediaId: testMediaId,
    customPrompt: undefined  // Use default OCR prompt
  });

  console.log("📊 AI Extraction Result:");
  console.log("   Success:", !result.error);
  console.log("   Message:", result.message);
  if (result.error) {
    console.log("   Error:", result.error);
  }

  // ========== Verify Results ==========

  // Assert no errors
  assertEquals(result.error, undefined, "Should not have error");
  assertExists(result.message, "Should have success message");

  // Get the extracted text from database
  const extractions = await textExtraction._getExtractionResultsForImage({
    userId: testUserId,
    imageId: testMediaId
  });

  console.log(`\n✅ Found ${extractions.length} text extractions`);

  // Display extracted texts
  if (extractions.length > 0) {
    console.log("\n📝 Extracted Texts:\n");
    console.log("=".repeat(70));

    extractions.forEach((ext: any, i: number) => {
      console.log(`\n${i + 1}. "${ext.extractedText}"`);
      console.log(`   Position: (${ext.position?.fromCoord[0]}, ${ext.position?.fromCoord[1]}) → (${ext.position?.toCoord[0]}, ${ext.position?.toCoord[1]})`);
    });

    console.log("\n" + "=".repeat(70));
  }

  // Assert we got some extractions
  assertEquals(extractions.length > 0, true, "Should extract at least some text");

  // ========== Cleanup ==========

  await mediaFiles.deleteMany({ owner: testUserId });
  await db.collection("TextExtraction.extractionResults").deleteMany({ imageId: testMediaId });
  await Deno.remove(`./uploads/${testUserId}`, { recursive: true });

  console.log("\n✅ Test completed and cleaned up!");
});
