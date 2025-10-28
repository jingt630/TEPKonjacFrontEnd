// Add this helper function to TextExtraction.ts

/**
 * Get image dimensions from base64 data by parsing image headers
 * Supports JPEG, PNG, WebP
 */
private getImageDimensionsFromBase64(base64Data: string, mimeType: string): { width: number; height: number } {
  try {
    // Remove data URI prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse dimensions based on image type
    if (mimeType === 'image/png' || mimeType === 'image/PNG') {
      return this.parsePNGDimensions(bytes);
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return this.parseJPEGDimensions(bytes);
    } else if (mimeType === 'image/webp') {
      return this.parseWebPDimensions(bytes);
    }

    // Fallback to default
    console.warn(`⚠️ Unsupported image type: ${mimeType}, using defaults`);
    return { width: 1920, height: 1080 };

  } catch (error) {
    console.error(`❌ Error parsing image dimensions:`, error);
    return { width: 1920, height: 1080 }; // Fallback
  }
}

/**
 * Parse PNG dimensions from binary data
 * PNG format: First 8 bytes are signature, then IHDR chunk contains dimensions
 */
private parsePNGDimensions(bytes: Uint8Array): { width: number; height: number } {
  // PNG signature: 137 80 78 71 13 10 26 10
  // IHDR chunk starts at byte 12
  // Width: bytes 16-19 (big-endian)
  // Height: bytes 20-23 (big-endian)

  if (bytes.length < 24) {
    throw new Error('Invalid PNG data');
  }

  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

  return { width, height };
}

/**
 * Parse JPEG dimensions from binary data
 * JPEG format: Search for SOF0 (Start of Frame) marker
 */
private parseJPEGDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2; // Skip initial FF D8 marker

  while (offset < bytes.length - 9) {
    // Look for marker (FF)
    if (bytes[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // SOF0 (Start of Frame, baseline DCT) = 0xC0
    // SOF1 (Extended sequential DCT) = 0xC1
    // SOF2 (Progressive DCT) = 0xC2
    if (marker >= 0xC0 && marker <= 0xC2) {
      // Height at offset + 5 (2 bytes, big-endian)
      // Width at offset + 7 (2 bytes, big-endian)
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }

    // Skip to next marker
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += segmentLength + 2;
  }

  throw new Error('Could not find JPEG SOF marker');
}

/**
 * Parse WebP dimensions from binary data
 * WebP format: RIFF header + VP8/VP8L/VP8X chunks
 */
private parseWebPDimensions(bytes: Uint8Array): { width: number; height: number } {
  // WebP signature: "RIFF" + size + "WEBP"
  if (bytes.length < 30) {
    throw new Error('Invalid WebP data');
  }

  // Check for VP8X (extended format)
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
    // VP8X: width and height are 24-bit little-endian at offset 24-29
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width, height };
  }

  // Check for VP8 (lossy)
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
    // VP8: dimensions at different offset, more complex to parse
    // For simplicity, return default
    console.warn('⚠️ VP8 format detected, using default dimensions');
    return { width: 1920, height: 1080 };
  }

  throw new Error('Unsupported WebP format');
}
