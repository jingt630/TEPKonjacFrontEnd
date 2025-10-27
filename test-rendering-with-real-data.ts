/**
 * Test rendering with real-world data structure
 * This simulates what the frontend actually sends
 */

import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

interface Position {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

interface TextElement {
  text: string;
  position: Position;
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
}

// Simulate the actual rendering function
async function testRender(textElements: TextElement[]) {
  console.log("🎨 ========== SIMULATING ACTUAL RENDER ==========\n");

  try {
    // Create a dummy image (800x600)
    console.log("📷 Creating main image (800x600)...");
    const mainImage = new Image(800, 600);
    mainImage.fill((200 << 24) | (200 << 16) | (200 << 8) | 255);
    console.log("✅ Main image created\n");

    // Process each text element
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      console.log(`📦 Element ${i + 1}/${textElements.length}:`);
      console.log(`   Text: "${element.text}"`);
      console.log(`   Position:`, element.position);

      const pos = element.position;

      // Validate
      if (!pos) {
        console.error(`   ❌ No position!`);
        continue;
      }

      console.log(`   Raw coordinates:`);
      console.log(`      From: (${pos.x}, ${pos.y})`);
      console.log(`      To: (${pos.x2}, ${pos.y2})`);

      // Calculate dimensions
      const rawWidth = pos.x2 - pos.x;
      const rawHeight = pos.y2 - pos.y;

      console.log(`   Raw dimensions: ${rawWidth}x${rawHeight}`);

      const boxWidth = Math.floor(rawWidth);
      const boxHeight = Math.floor(rawHeight);

      console.log(`   Floored dimensions: ${boxWidth}x${boxHeight}`);

      // Check validity
      if (boxWidth <= 0 || boxHeight <= 0) {
        console.error(`   ❌ Invalid dimensions after flooring!`);
        console.log(`   🔍 Analysis:`);
        console.log(`      x2 - x = ${pos.x2} - ${pos.x} = ${rawWidth}`);
        console.log(`      y2 - y = ${pos.y2} - ${pos.y} = ${rawHeight}`);
        console.log(`      floor(width) = ${boxWidth}`);
        console.log(`      floor(height) = ${boxHeight}`);
        continue;
      }

      // Ensure minimum
      const minWidth = Math.max(1, boxWidth);
      const minHeight = Math.max(1, boxHeight);

      console.log(`   Final dimensions: ${minWidth}x${minHeight}`);

      // Try to create canvas
      try {
        console.log(`   🎨 Creating canvas...`);
        const textCanvas = new Image(minWidth, minHeight);
        console.log(`   ✅ Canvas created successfully`);

        // Fill white
        textCanvas.fill((255 << 24) | (255 << 16) | (255 << 8) | 255);

        // Composite
        const startX = Math.floor(Math.max(0, pos.x));
        const startY = Math.floor(Math.max(0, pos.y));

        console.log(`   🎨 Compositing at (${startX}, ${startY})...`);

        for (let y = 0; y < minHeight && startY + y < mainImage.height; y++) {
          for (let x = 0; x < minWidth && startX + x < mainImage.width; x++) {
            const pixel = textCanvas.getPixelAt(x, y);
            mainImage.setPixelAt(startX + x, startY + y, pixel);
          }
        }

        console.log(`   ✅ Composited successfully\n`);
      } catch (error) {
        console.error(`   ❌ ERROR:`, error.message);
        console.error(`   Stack:`, error.stack);
        console.log(`   🔍 Debug info:`);
        console.log(`      Tried to create: Image(${minWidth}, ${minHeight})`);
        console.log(`      Position data:`, JSON.stringify(pos, null, 2));
        throw error;
      }
    }

    // Save
    console.log("💾 Saving result...");
    const encoded = await mainImage.encode();
    await Deno.writeFile("test-real-data-output.png", encoded);
    console.log("✅ Saved to: test-real-data-output.png");

    console.log("\n✅ ========== TEST COMPLETED ==========");
  } catch (error) {
    console.error("\n❌ ========== TEST FAILED ==========");
    console.error(error);
    throw error;
  }
}

// Test with various real-world scenarios
const testData: TextElement[] = [
  // Normal case
  {
    text: "ライオン・キング",
    position: { x: 100, y: 50, x2: 300, y2: 100 }
  },
  // Small box
  {
    text: "小",
    position: { x: 100, y: 120, x2: 110, y2: 130 }
  },
  // Fractional coordinates (common from frontend)
  {
    text: "Test",
    position: { x: 100.5, y: 150.7, x2: 150.3, y2: 170.9 }
  },
  // Very small box (might cause issues)
  {
    text: "T",
    position: { x: 100, y: 200, x2: 100.5, y2: 201 }
  },
  // Another fractional case
  {
    text: "Another",
    position: { x: 200.8, y: 250.2, x2: 280.4, y2: 275.6 }
  },
  // Edge case: width/height exactly 1
  {
    text: "E",
    position: { x: 100, y: 300, x2: 101, y2: 301 }
  },
  // Edge case: less than 1 after flooring
  {
    text: "Problematic",
    position: { x: 100.1, y: 350.2, x2: 100.8, y2: 351.5 }
  }
];

// Run test
if (import.meta.main) {
  console.log("📋 Testing with real-world data scenarios...\n");
  testRender(testData).catch((error) => {
    console.error("\n💥 Fatal error:", error);
    Deno.exit(1);
  });
}
