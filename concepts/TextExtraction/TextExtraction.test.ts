/**
 * Deno Test Cases for TextExtraction Concept
 *
 * Run with:
 * deno test --allow-read --allow-env --allow-net concepts/TextExtraction/TextExtraction.test.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MongoClient } from "npm:mongodb";
import TextExtractionConcept from "./TextExtraction.ts";

// Load environment variables
import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ========== Setup Test Database ==========
const MONGODB_URL = Deno.env.get("MONGODB_URL") || "mongodb://localhost:27017";
const DB_NAME = Deno.env.get("DB_NAME") || "test_concept_db";

let db: any;
let textExtraction: TextExtractionConcept;
let testUserId: string;
let testMediaId: string;

// Setup: Connect to database before tests
async function setup() {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  db = client.db(DB_NAME);

  textExtraction = new TextExtractionConcept(db);

  // Create test user ID
  testUserId = "test-user-" + crypto.randomUUID();

  // Create test media file record
  const mediaFiles = db.collection("MediaManagement.mediaFiles");
  const testMediaFile = {
    _id: crypto.randomUUID(),
    filename: "Spirited away movie poster.jpg",
    filePath: "/TestImages",
    mediaType: "jpg",
    owner: testUserId,
    uploadDate: new Date(),
    updateDate: new Date(),
    cloudURL: "test://test-bucket/test.jpg"
  };

  await mediaFiles.insertOne(testMediaFile);
  testMediaId = testMediaFile._id;

  // Copy test image to expected location
  // In real scenario, you'd have uploaded this already
  const testImagePath = `./uploads/${testUserId}/TestImages`;
  await Deno.mkdir(testImagePath, { recursive: true });

  // Copy the Spirited Away poster to test location
  try {
    const sourceImage = await Deno.readFile("./Spirited away movie poster.jpg");
    await Deno.writeFile(`${testImagePath}/Spirited away movie poster.jpg`, sourceImage);
    console.log("✅ Test image copied to:", testImagePath);
  } catch (error) {
    console.warn("⚠️ Could not copy test image:", error.message);
    console.warn("   Make sure 'Spirited away movie poster.jpg' exists in the project root");
  }

  return { db, textExtraction, testUserId, testMediaId };
}

// Cleanup: Remove test data after tests
async function cleanup() {
  try {
    // Clean up test collections
    await db.collection("MediaManagement.mediaFiles").deleteMany({ owner: testUserId });
    await db.collection("TextExtraction.extractionResults").deleteMany({ imageId: testMediaId });

    // Clean up test files
    await Deno.remove(`./uploads/${testUserId}`, { recursive: true });

    console.log("✅ Test cleanup complete");
  } catch (error) {
    console.warn("⚠️ Cleanup error:", error.message);
  }
}

// ========== Test Cases ==========

Deno.test({
  name: "TextExtraction - Basic AI extraction from image",
  async fn() {
    console.log("\n🧪 Test: Basic AI extraction from Spirited Away poster\n");

    // Setup
    const { textExtraction, testUserId, testMediaId } = await setup();

    try {
      // Call the AI extraction function
      const result = await textExtraction.extractTextFromMedia({
        userId: testUserId,
        mediaId: testMediaId,
        customPrompt: undefined // Use default prompt
      });

      console.log("📊 Extraction result:", result);

      // Assertions
      assertExists(result, "Result should exist");
      assertEquals(result.error, undefined, "Should not have error");
      assertExists(result.message, "Should have success message");

      console.log("✅ AI extraction successful!");
      console.log(`   Extracted text blocks: ${result.message}`);

      // Verify extractions were saved to database
      const extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      console.log(`✅ Saved ${extractions.length} extraction results to database`);

      // Print first 3 extracted texts
      if (extractions.length > 0) {
        console.log("\n📝 Sample extracted texts:");
        extractions.slice(0, 3).forEach((ext: any, i: number) => {
          console.log(`   ${i + 1}. "${ext.extractedText}"`);
          console.log(`      Position: (${ext.position?.fromCoord[0]}, ${ext.position?.fromCoord[1]}) → (${ext.position?.toCoord[0]}, ${ext.position?.toCoord[1]})`);
        });
      }

      // Assert we got some extractions
      assertEquals(extractions.length > 0, true, "Should have extracted some text");

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TextExtraction - Custom prompt extraction",
  async fn() {
    console.log("\n🧪 Test: Custom prompt extraction\n");

    const { textExtraction, testUserId, testMediaId } = await setup();

    try {
      // Use a custom prompt focused on specific information
      const customPrompt = `Extract only the main title and director name from this movie poster.
Format:
1: <title>
2: <director name>

Coordinates should follow this format:
1: <text> (from: {x:A, y:B}, to: {x:C, y:D})`;

      const result = await textExtraction.extractTextFromMedia({
        userId: testUserId,
        mediaId: testMediaId,
        customPrompt: customPrompt
      });

      console.log("📊 Custom prompt result:", result);

      assertExists(result, "Result should exist");
      assertEquals(result.error, undefined, "Should not have error");

      const extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      console.log(`✅ Extracted ${extractions.length} items with custom prompt`);

      // With custom prompt, we expect fewer, more focused extractions
      if (extractions.length > 0) {
        console.log("\n📝 Custom extraction results:");
        extractions.forEach((ext: any, i: number) => {
          console.log(`   ${i + 1}. "${ext.extractedText}"`);
        });
      }

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TextExtraction - Error handling for missing image",
  async fn() {
    console.log("\n🧪 Test: Error handling for missing image\n");

    const { textExtraction, testUserId } = await setup();

    try {
      // Try to extract from non-existent media
      const result = await textExtraction.extractTextFromMedia({
        userId: testUserId,
        mediaId: "non-existent-id",
        customPrompt: undefined
      });

      console.log("📊 Result for missing image:", result);

      // Should return an error
      assertExists(result.error, "Should have error for missing image");
      assertEquals(
        typeof result.error === "string" && result.error.length > 0,
        true,
        "Error message should be a non-empty string"
      );

      console.log("✅ Error handling works correctly");
      console.log(`   Error: ${result.error}`);

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TextExtraction - Manual text addition",
  async fn() {
    console.log("\n🧪 Test: Manual text addition\n");

    const { textExtraction, testUserId, testMediaId } = await setup();

    try {
      // Manually add an extraction
      const manualText = "Spirited Away - Manual Entry";
      const location = { x: 100, y: 200, width: 300, height: 50 };

      const result = await textExtraction.addExtractionTxt({
        userId: testUserId,
        imageId: testMediaId,
        txt: manualText,
        location: location
      });

      console.log("📊 Manual addition result:", result);

      assertExists(result._id, "Should return created extraction with ID");
      assertEquals(result.extractedText, manualText, "Text should match");

      // Verify it's in the database
      const extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      const found = extractions.find((e: any) => e.extractedText === manualText);
      assertExists(found, "Manual extraction should be in database");

      console.log("✅ Manual text addition successful");

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TextExtraction - Edit extracted text",
  async fn() {
    console.log("\n🧪 Test: Edit extracted text\n");

    const { textExtraction, testUserId, testMediaId } = await setup();

    try {
      // First, add a text extraction
      const originalText = "Original Text";
      const addResult = await textExtraction.addExtractionTxt({
        userId: testUserId,
        imageId: testMediaId,
        txt: originalText,
        location: { x: 10, y: 10, width: 100, height: 20 }
      });

      const extractionId = addResult._id;

      // Now edit it
      const newText = "Edited Text - Corrected";
      const editResult = await textExtraction.editExtractText({
        userId: testUserId,
        extractionId: extractionId,
        newText: newText
      });

      console.log("📊 Edit result:", editResult);

      assertExists(editResult, "Edit result should exist");
      assertEquals(editResult.error, undefined, "Should not have error");

      // Verify the edit
      const extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      const edited = extractions.find((e: any) => e._id === extractionId);
      assertEquals(edited.extractedText, newText, "Text should be updated");

      console.log("✅ Text editing successful");
      console.log(`   Original: "${originalText}"`);
      console.log(`   Edited: "${newText}"`);

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ========== Integration Test ==========

Deno.test({
  name: "TextExtraction - Full workflow integration test",
  async fn() {
    console.log("\n🧪 Test: Full extraction workflow\n");

    const { textExtraction, testUserId, testMediaId } = await setup();

    try {
      // Step 1: Extract text with AI
      console.log("📝 Step 1: AI extraction...");
      const extractResult = await textExtraction.extractTextFromMedia({
        userId: testUserId,
        mediaId: testMediaId,
        customPrompt: undefined
      });

      assertExists(extractResult.message, "Extraction should succeed");
      console.log(`✅ ${extractResult.message}`);

      // Step 2: Get all extractions
      console.log("\n📝 Step 2: Retrieving extractions...");
      let extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      const initialCount = extractions.length;
      console.log(`✅ Retrieved ${initialCount} extractions`);

      // Step 3: Add a manual extraction
      console.log("\n📝 Step 3: Adding manual extraction...");
      await textExtraction.addExtractionTxt({
        userId: testUserId,
        imageId: testMediaId,
        txt: "Manual Addition - Test Caption",
        location: { x: 0, y: 0, width: 100, height: 20 }
      });
      console.log("✅ Manual extraction added");

      // Step 4: Verify count increased
      extractions = await textExtraction._getExtractionResultsForImage({
        userId: testUserId,
        imageId: testMediaId
      });

      assertEquals(extractions.length, initialCount + 1, "Count should increase by 1");
      console.log(`✅ Count increased: ${initialCount} → ${extractions.length}`);

      // Step 5: Edit one extraction
      if (extractions.length > 0) {
        console.log("\n📝 Step 5: Editing first extraction...");
        const firstId = extractions[0]._id;
        const originalText = extractions[0].extractedText;

        await textExtraction.editExtractText({
          userId: testUserId,
          extractionId: firstId,
          newText: originalText + " [EDITED]"
        });
        console.log("✅ Extraction edited");
      }

      // Step 6: Delete one extraction
      if (extractions.length > 1) {
        console.log("\n📝 Step 6: Deleting an extraction...");
        const secondId = extractions[1]._id;

        await textExtraction.deleteExtraction({
          userId: testUserId,
          extractionId: secondId
        });
        console.log("✅ Extraction deleted");

        // Verify count decreased
        extractions = await textExtraction._getExtractionResultsForImage({
          userId: testUserId,
          imageId: testMediaId
        });

        console.log(`✅ Final count: ${extractions.length}`);
      }

      console.log("\n🎉 Full workflow test completed successfully!");

    } finally {
      await cleanup();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
