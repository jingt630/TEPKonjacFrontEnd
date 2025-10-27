/**
 * Minimal test to diagnose ImageScript issue
 */

import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

console.log("🧪 Minimal ImageScript Test\n");

try {
  console.log("Test 1: Create 10x10 image");
  const img1 = new Image(10, 10);
  console.log(`✅ Created: ${img1.width}x${img1.height}`);
  console.log(`   Trying to set pixel at (0, 0)...`);
  img1.setPixelAt(0, 0, 0xFF0000FF);
  console.log(`✅ Success!\n`);
} catch (error) {
  console.error(`❌ Error:`, error.message);
  console.error(`   Stack:`, error.stack);
  console.log("");
}

try {
  console.log("Test 2: Create 200x50 image");
  const img2 = new Image(200, 50);
  console.log(`✅ Created: ${img2.width}x${img2.height}`);
  console.log(`   Trying to set pixel at (0, 0)...`);
  img2.setPixelAt(0, 0, 0xFF0000FF);
  console.log(`✅ Success!`);
  console.log(`   Trying to set pixel at (199, 49)...`);
  img2.setPixelAt(199, 49, 0xFF0000FF);
  console.log(`✅ Success!\n`);
} catch (error) {
  console.error(`❌ Error:`, error.message);
  console.error(`   Stack:`, error.stack);
  console.log("");
}

try {
  console.log("Test 3: Create and fill");
  const img3 = new Image(100, 100);
  console.log(`✅ Created: ${img3.width}x${img3.height}`);
  console.log(`   Filling with white...`);
  img3.fill(0xFFFFFFFF);
  console.log(`✅ Filled!`);
  console.log(`   Setting pixel after fill...`);
  img3.setPixelAt(0, 0, 0x000000FF);
  console.log(`✅ Success!\n`);
} catch (error) {
  console.error(`❌ Error:`, error.message);
  console.error(`   Stack:`, error.stack);
  console.log("");
}

try {
  console.log("Test 4: Create, fill, then loop");
  const img4 = new Image(50, 50);
  console.log(`✅ Created: ${img4.width}x${img4.height}`);
  img4.fill(0xFFFFFFFF);
  console.log(`✅ Filled`);

  console.log(`   Drawing border...`);
  // Top border
  for (let x = 0; x < img4.width; x++) {
    console.log(`      Setting pixel at (${x}, 0)...`);
    img4.setPixelAt(x, 0, 0x000000FF);
    if (x > 2) {
      console.log(`      (stopping early for brevity)`);
      break;
    }
  }
  console.log(`✅ Success!\n`);
} catch (error) {
  console.error(`❌ Error:`, error.message);
  console.error(`   At what x value?`);
  console.error(`   Stack:`, error.stack);
  console.log("");
}

console.log("All tests completed!");
