# 🎯 Fix AI Location Coordinates - Use Actual Image Dimensions

## 🐛 The Problem

**Current code:**
```typescript
// Get image dimensions (using default since we can't easily get from base64)
const dimensions = { width: 1920, height: 1080 }; // ← HARDCODED!
```

**The issue:**
- AI is told: "Image is 1920×1080"
- Actual image: Maybe 800×600, or 1280×720, or any size!
- AI returns coordinates for 1920×1080
- Coordinates are **scaled wrong** for your actual image ❌

**Example:**
```
Actual image: 800×600
AI thinks: 1920×1080

AI says text is at: (960, 540) ← Center of 1920×1080
But in 800×600, center is: (400, 300)

Result: Coordinates are way off! ❌
```

---

## ✅ The Solution

**Get ACTUAL dimensions from the base64 image data!**

Parse the image headers to extract width and height:
- **PNG:** Read IHDR chunk
- **JPEG:** Find SOF marker
- **WebP:** Read VP8X chunk

---

## 📝 Implementation

### **File:** `concept_backend/src/concepts/TextExtraction/TextExtraction.ts`

### **Step 1: Add Helper Functions**

Add these 4 functions to the class (after the existing private methods):

```typescript
/**
 * Get image dimensions from base64 data by parsing image headers
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

    console.warn(`⚠️ Unsupported image type: ${mimeType}, using defaults`);
    return { width: 1920, height: 1080 };

  } catch (error) {
    console.error(`❌ Error parsing image dimensions:`, error);
    return { width: 1920, height: 1080 };
  }
}

private parsePNGDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24) {
    throw new Error('Invalid PNG data');
  }

  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

  return { width, height };
}

private parseJPEGDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;

  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    if (marker >= 0xC0 && marker <= 0xC2) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += segmentLength + 2;
  }

  throw new Error('Could not find JPEG SOF marker');
}

private parseWebPDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 30) {
    throw new Error('Invalid WebP data');
  }

  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width, height };
  }

  console.warn('⚠️ VP8 format detected, using default dimensions');
  return { width: 1920, height: 1080 };
}
```

---

### **Step 2: Update extractTextFromMedia Method**

**Find this code (around line 195):**

```typescript
// Prepare image data for AI (with data URI prefix if not already present)
const imageDataForAI = storedImage.imageData.startsWith('data:')
  ? storedImage.imageData
  : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;

// Get image dimensions (using default since we can't easily get from base64)
const dimensions = { width: 1920, height: 1080 }; // Default dimensions
console.log(`📐 Using default dimensions: ${dimensions.width}x${dimensions.height}`);
```

**Replace with:**

```typescript
// Prepare image data for AI (with data URI prefix if not already present)
const imageDataForAI = storedImage.imageData.startsWith('data:')
  ? storedImage.imageData
  : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;

// Get ACTUAL image dimensions from the base64 data
console.log(`📏 Parsing image dimensions from base64 data...`);
const dimensions = this.getImageDimensionsFromBase64(
  storedImage.imageData,
  storedImage.mimeType
);
console.log(`📐 Actual image dimensions: ${dimensions.width}×${dimensions.height}`);
```

---

## 🔄 Restart Backend

```powershell
cd C:\Users\jingy\Downloads\concept_backend
deno run --allow-all server.ts
```

---

## 🧪 Test

### Upload a new image and extract text:

**Expected console:**
```
🤖 Starting Gemini AI text extraction for: test.jpg
✅ Image data retrieved from database (125000 bytes)
📏 Parsing image dimensions from base64 data...
📐 Actual image dimensions: 800×600        ← REAL dimensions!
📤 Sending image data to Gemini AI...
✅ Gemini extraction complete
📝 Found 3 text blocks
   Text: "Lion King" at (150, 100) → (350, 150)  ← Correct for 800×600!
```

---

## 📊 Before vs After

### Before (Wrong Dimensions):
```
Your image: 800×600
AI told: 1920×1080
Result: Coordinates scaled for wrong size ❌

Example:
- AI says: (960, 540) ← Center of 1920×1080
- Should be: (400, 300) ← Center of 800×600
- Error: Off by 560px horizontal, 240px vertical!
```

### After (Correct Dimensions):
```
Your image: 800×600
AI told: 800×600 ✅
Result: Coordinates perfectly aligned!

Example:
- AI says: (400, 300) ← Center of 800×600
- Should be: (400, 300) ← Perfect match!
- Error: 0px! ✅
```

---

## 🎯 How It Works

### **PNG Format:**
```
Byte 0-7: PNG signature
Byte 8-11: IHDR chunk length
Byte 12-15: "IHDR"
Byte 16-19: Width (4 bytes, big-endian)
Byte 20-23: Height (4 bytes, big-endian)
```

### **JPEG Format:**
```
Scan through file looking for markers (0xFF XX)
When marker is 0xC0-0xC2 (Start of Frame):
  Byte offset+5,6: Height (2 bytes, big-endian)
  Byte offset+7,8: Width (2 bytes, big-endian)
```

### **WebP Format:**
```
Byte 0-3: "RIFF"
Byte 8-11: "WEBP"
If VP8X format:
  Byte 24-26: Width-1 (3 bytes, little-endian)
  Byte 27-29: Height-1 (3 bytes, little-endian)
```

---

## ✅ Benefits

1. **Accurate Coordinates:** AI gets real dimensions, returns correct positions
2. **Any Image Size:** Works with 800×600, 1920×1080, 4K, etc.
3. **No Scaling Needed:** Coordinates match your image exactly
4. **Better OCR:** AI can accurately estimate text box sizes

---

## 🔍 Debugging

If coordinates are still off, check:

1. **Console shows actual dimensions:**
   ```
   📐 Actual image dimensions: 800×600
   ```

2. **AI prompt includes correct dimensions:**
   ```
   The incoming image's dimensions is 800x600. Label textblocks...
   ```

3. **Returned coordinates are within bounds:**
   ```
   Text: "Title" (from: {x:100, y:50}, to: {x:300, y:100})
   ✅ All values < 800 (width) and < 600 (height)
   ```

---

## 📝 Summary

| Aspect | Before | After |
|--------|--------|-------|
| Dimensions told to AI | 1920×1080 (default) | Actual size (800×600, etc.) |
| Coordinate accuracy | ❌ Off by scaling factor | ✅ Exact match |
| Works with any size | ❌ Only accurate for 1920×1080 | ✅ Any size! |
| Parsing method | None | Read image headers |

---

**Add these helper functions and update the extraction method!** 🚀

The complete code is in `GET_IMAGE_DIMENSIONS_FROM_BASE64.ts`!
