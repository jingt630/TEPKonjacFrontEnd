# 🔧 Backend Fix: Image Extraction with Base64

## 🐛 The Problem

**Error:** `The filename or extension is too long. (os error 206)`

**Cause:** The `gemini-llm.ts` file was treating base64 data as a file path!

```
Base64 data: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." (100,000+ chars)
                ↓
gemini-llm.ts tries: Deno.readFile("data:image/jpeg;base64,/9j/...")
                ↓
Error: Filename too long! ❌
```

---

## ✅ Solution (2 Files to Update)

### **File 1: `concept_backend/gemini-llm.ts`**

**Replace the ENTIRE file with this:**

```typescript
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

export class GeminiLLM {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async executeLLM(prompt: string, imageInput: string): Promise<string> {
    try {
      console.log("🤖 Calling Gemini AI...");

      let imageData: string;
      let mimeType: string = "image/jpeg";

      // ========== KEY FIX: Check if it's base64 data or file path ==========
      if (imageInput.startsWith("data:")) {
        console.log("📊 Using base64 data directly (from database)");

        // Extract mime type and base64 data
        const matches = imageInput.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error("Invalid data URI format");
        }

        mimeType = matches[1];
        imageData = matches[2];

        console.log(`   Mime type: ${mimeType}`);
        console.log(`   Base64 length: ${imageData.length} chars`);
        // ❌ Removed: console.log with actual image data

      } else {
        // It's a file path - read from disk
        console.log(`📷 Reading image from file: ${imageInput}`);

        const fileBytes = await Deno.readFile(imageInput);
        imageData = btoa(String.fromCharCode(...fileBytes));

        if (imageInput.endsWith(".png")) {
          mimeType = "image/png";
        } else if (imageInput.endsWith(".jpg") || imageInput.endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        } else if (imageInput.endsWith(".webp")) {
          mimeType = "image/webp";
        }

        console.log(`   File size: ${fileBytes.length} bytes`);
        console.log(`   Mime type: ${mimeType}`);
      }
      // ========== END FIX ==========

      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      };

      console.log("📤 Sending request to Gemini API...");

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log("✅ Gemini API response received");
      console.log(`   Response length: ${text.length} chars`);

      return text;
    } catch (error) {
      console.error("❌ Error calling Gemini API:", (error as Error).message);
      throw error;
    }
  }
}
```

---

### **File 2: `concept_backend/src/concepts/TextExtraction/TextExtraction.ts`**

**Find this section (around line 192):**
```typescript
console.log(`✅ Image data retrieved from database (${storedImage.size} bytes)`);

// Prepare image data for AI (with data URI prefix if not already present)
const imageDataForAI = storedImage.imageData.startsWith('data:')
  ? storedImage.imageData
  : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;
```

**Make sure it does NOT log the actual image data:**
```typescript
console.log(`✅ Image data retrieved from database (${storedImage.size} bytes)`);
// ❌ DO NOT LOG: console.log('Image data:', imageDataForAI)

// Prepare image data for AI (with data URI prefix if not already present)
const imageDataForAI = storedImage.imageData.startsWith('data:')
  ? storedImage.imageData
  : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;

console.log(`📐 Using default dimensions: 1920x1080`);
// ❌ DO NOT LOG: console.log('Prepared data:', imageDataForAI)
```

---

## 🔄 Restart Backend

```powershell
cd C:\Users\jingy\Downloads\concept_backend

# Stop backend (Ctrl+C)

# Restart
deno run --allow-all server.ts
```

---

## 🧪 Test

1. **Upload a new image**
2. **Extract text**

**Expected console output:**
```
🤖 Starting Gemini AI text extraction for: ChiikawaPoster.jpg
✅ Image data retrieved from database (125000 bytes)
📐 Using default dimensions: 1920x1080
📤 Sending image data to Gemini AI...
🤖 Calling Gemini AI...
📊 Using base64 data directly (from database)
   Mime type: image/jpeg
   Base64 length: 93750 chars
📤 Sending request to Gemini API...
✅ Gemini API response received
   Response length: 450 chars
✅ Gemini extraction complete
📝 Found 5 text blocks
✅ Created 5 extraction records
```

**No more:**
- ❌ "Filename too long" error
- ❌ Image data printed to console

---

## 📝 What Changed

### In `gemini-llm.ts`:

```typescript
// BEFORE (Broken):
async executeLLM(prompt: string, imagePath: string) {
  const fileBytes = await Deno.readFile(imagePath); // ← Treats everything as file path!
  // ...
}

// AFTER (Fixed):
async executeLLM(prompt: string, imageInput: string) {
  if (imageInput.startsWith("data:")) {
    // It's base64 data - use directly ✅
    const matches = imageInput.match(/^data:([^;]+);base64,(.+)$/);
    imageData = matches[2];
  } else {
    // It's a file path - read file ✅
    const fileBytes = await Deno.readFile(imageInput);
    imageData = btoa(String.fromCharCode(...fileBytes));
  }
}
```

---

## ✅ Summary

| Issue | Before | After |
|-------|--------|-------|
| Base64 treated as path | ❌ Yes | ✅ Fixed |
| "Filename too long" error | ❌ Yes | ✅ Gone |
| Console filled with image data | ❌ Yes | ✅ Removed |
| AI extraction works | ❌ No | ✅ Yes! |

---

**Update `gemini-llm.ts` and restart backend!** 🚀

The complete fixed file is in `FIXED_gemini-llm.ts` - just copy it to your backend!
