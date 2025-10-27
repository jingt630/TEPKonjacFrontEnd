/**
 * Deep diagnostic for ImageScript issue
 */

console.log("🔍 Deep ImageScript Diagnostic\n");

// Test with 1.2.15
console.log("=" .repeat(50));
console.log("Testing ImageScript 1.2.15");
console.log("=" .repeat(50));

try {
  const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");

  console.log("\n1. Import successful");
  console.log("   Image type:", typeof Image);
  console.log("   Is function:", typeof Image === 'function');

  console.log("\n2. Creating image...");
  const width = 200;
  const height = 50;
  console.log(`   Dimensions: ${width}x${height}`);
  console.log(`   Width type: ${typeof width} (value: ${width})`);
  console.log(`   Height type: ${typeof height} (value: ${height})`);

  const img = new Image(width, height);

  console.log("\n3. Image created!");
  console.log(`   img.width: ${img.width} (type: ${typeof img.width})`);
  console.log(`   img.height: ${img.height} (type: ${typeof img.height})`);
  console.log(`   Bitmap exists: ${!!img.bitmap}`);
  console.log(`   Bitmap length: ${img.bitmap?.length || 'N/A'}`);

  console.log("\n4. Methods available:");
  console.log(`   setPixelAt: ${typeof img.setPixelAt}`);
  console.log(`   getPixelAt: ${typeof img.getPixelAt}`);
  console.log(`   fill: ${typeof img.fill}`);
  console.log(`   encode: ${typeof img.encode}`);

  console.log("\n5. Testing fill...");
  img.fill(0xFFFFFFFF);
  console.log("   ✅ Fill successful");

  console.log("\n6. Testing getPixelAt(0, 0)...");
  const pixel = img.getPixelAt(0, 0);
  console.log(`   Pixel value: 0x${pixel.toString(16)}`);
  console.log("   ✅ getPixelAt successful");

  console.log("\n7. Testing setPixelAt(1, 1)... (not at edge)");
  img.setPixelAt(1, 1, 0x000000FF);
  console.log("   ✅ setPixelAt(1, 1) successful");

  console.log("\n8. Testing setPixelAt(0, 1)... (left edge, not corner)");
  img.setPixelAt(0, 1, 0x000000FF);
  console.log("   ✅ setPixelAt(0, 1) successful");

  console.log("\n9. Testing setPixelAt(1, 0)... (top edge, not corner)");
  img.setPixelAt(1, 0, 0x000000FF);
  console.log("   ✅ setPixelAt(1, 0) successful");

  console.log("\n10. Testing setPixelAt(0, 0)... (THE CORNER)");
  console.log("    This is where it should fail if there's a bug...");
  img.setPixelAt(0, 0, 0x000000FF);
  console.log("   ✅ setPixelAt(0, 0) successful!");

  console.log("\n11. Testing encode...");
  const encoded = await img.encode();
  console.log(`   ✅ Encoded: ${encoded.length} bytes`);

  await Deno.writeFile("test-debug-output.png", encoded);
  console.log("   ✅ Saved to test-debug-output.png");

  console.log("\n" + "=".repeat(50));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(50));

} catch (error) {
  console.error("\n" + "=".repeat(50));
  console.error("❌ ERROR OCCURRED");
  console.error("=".repeat(50));
  console.error("\nError message:", error.message);
  console.error("\nError name:", error.name);
  console.error("\nError constructor:", error.constructor.name);
  console.error("\nStack trace:");
  console.error(error.stack);

  // Try to extract more info
  if (error.message.includes("boundaries")) {
    console.error("\n🔍 Boundary Error Details:");
    const match = error.message.match(/\(x=(\d+)\)<(\d+)/);
    if (match) {
      console.error(`   x value: ${match[1]}`);
      console.error(`   Compared against: ${match[2]}`);
      console.error(`   This means: x=${match[1]} is being checked if < ${match[2]}`);
    }
  }
}

// Also test if the issue is with the color value
console.log("\n\n" + "=".repeat(50));
console.log("Testing different color formats");
console.log("=".repeat(50));

try {
  const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
  const img2 = new Image(10, 10);
  img2.fill(0xFFFFFFFF);

  console.log("\nTesting various color formats:");

  console.log("1. 0xFF0000FF (red, fully opaque)");
  img2.setPixelAt(0, 0, 0xFF0000FF);
  console.log("   ✅ Success");

  console.log("2. 0x00FF00FF (green, fully opaque)");
  img2.setPixelAt(0, 1, 0x00FF00FF);
  console.log("   ✅ Success");

  console.log("3. Image.rgbaToColor(0, 0, 0, 255) if available");
  if (typeof Image.rgbaToColor === 'function') {
    const color = Image.rgbaToColor(0, 0, 0, 255);
    img2.setPixelAt(0, 2, color);
    console.log("   ✅ Success");
  } else {
    console.log("   ⚠️ rgbaToColor not available");
  }

  console.log("\n✅ All color formats work");

} catch (error) {
  console.error("\n❌ Color format error:", error.message);
}
