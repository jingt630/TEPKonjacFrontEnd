# 🤖 AI Text Extraction - Code Snippets

## 📦 Quick Reference: Calling AI Text Extraction

### **Minimal Example - Just the AI Call**

```typescript
import TextExtractionConcept from "./concepts/TextExtraction/TextExtraction.ts";
import { MongoClient } from "npm:mongodb";

// Setup database connection
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("your_database");

// Create TextExtraction instance
const textExtraction = new TextExtractionConcept(db);

// ⭐ THE MAIN AI EXTRACTION CALL ⭐
const result = await textExtraction.extractTextFromMedia({
  userId: "user-id-here",           // The user who owns the image
  mediaId: "media-id-here",          // The image's database ID
  customPrompt: undefined            // Optional: custom OCR prompt
});

// Check result
if (result.error) {
  console.error("❌ Error:", result.error);
} else {
  console.log("✅ Success:", result.message);
}

// Get extracted text from database
const extractions = await textExtraction._getExtractionResultsForImage({
  userId: "user-id-here",
  imageId: "media-id-here"
});

// Display results
extractions.forEach((ext) => {
  console.log(`Text: ${ext.extractedText}`);
  console.log(`Position: (${ext.position.fromCoord}) → (${ext.position.toCoord})`);
});
```

---

## 🧪 Complete Deno Test Case

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MongoClient } from "npm:mongodb";
import TextExtractionConcept from "./concepts/TextExtraction/TextExtraction.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

Deno.test("AI Text Extraction from Image", async () => {
  // 1. Setup database
  const client = new MongoClient(Deno.env.get("MONGODB_URL")!);
  await client.connect();
  const db = client.db("test_db");

  const textExtraction = new TextExtractionConcept(db);
  const testUserId = "test-user-123";
  const testMediaId = "test-media-456";

  // 2. Create test media file in database
  await db.collection("MediaManagement.mediaFiles").insertOne({
    _id: testMediaId,
    filename: "Spirited away movie poster.jpg",
    filePath: "/TestImages",
    mediaType: "jpg",
    owner: testUserId,
    uploadDate: new Date(),
    updateDate: new Date()
  });

  // 3. Setup image file on disk
  const imagePath = `./uploads/${testUserId}/TestImages`;
  await Deno.mkdir(imagePath, { recursive: true });
  const sourceImage = await Deno.readFile("./Spirited away movie poster.jpg");
  await Deno.writeFile(`${imagePath}/Spirited away movie poster.jpg`, sourceImage);

  // ⭐ 4. CALL AI TEXT EXTRACTION ⭐
  const result = await textExtraction.extractTextFromMedia({
    userId: testUserId,
    mediaId: testMediaId,
    customPrompt: undefined
  });

  // 5. Assertions
  assertEquals(result.error, undefined, "Should not have error");
  assertExists(result.message, "Should return success message");

  // 6. Verify extractions in database
  const extractions = await textExtraction._getExtractionResultsForImage({
    userId: testUserId,
    imageId: testMediaId
  });

  console.log(`✅ Extracted ${extractions.length} text blocks`);

  // Display results
  extractions.forEach((ext, i) => {
    console.log(`${i + 1}. "${ext.extractedText}"`);
  });

  // Assert we got results
  assertEquals(extractions.length > 0, true, "Should extract text");

  // 7. Cleanup
  await db.collection("MediaManagement.mediaFiles").deleteMany({ owner: testUserId });
  await db.collection("TextExtraction.extractionResults").deleteMany({ imageId: testMediaId });
  await Deno.remove(`./uploads/${testUserId}`, { recursive: true });
});
```

**Run with:**
```bash
deno test --allow-read --allow-env --allow-net --allow-write test-file.ts
```

---

## 🎯 With Custom Prompt

```typescript
// Use a custom prompt for specific extraction needs
const result = await textExtraction.extractTextFromMedia({
  userId: testUserId,
  mediaId: testMediaId,
  customPrompt: `You are an OCR assistant. Extract all text and format as:
1: <text> (from: {x:A, y:B}, to: {x:C, y:D})
2: <text> (from: {x:E, y:F}, to: {x:G, y:H})
...
Number of text blocks: N`
});
```

---

## 📍 What Happens Inside `extractTextFromMedia`

```typescript
async extractTextFromMedia({ userId, mediaId, customPrompt }) {
  // 1. Get media file from database
  const mediaFile = await this.mediaFiles.findOne({
    _id: mediaId,
    owner: userId
  });

  // 2. Build file path
  const imagePath = this.getImagePath(userId, mediaFile);
  // → "./uploads/userId/folderPath/filename.jpg"

  // 3. Call Gemini AI with image
  const aiResponse = await this.geminiLLM.executeLLM(
    customPrompt || this.defaultOCRPrompt,
    imagePath
  );

  // 4. Parse AI response
  // Expected format:
  // 1: Text here
  // 2: More text
  // ...
  // Coordinates:
  // 1: (x1,y1)→(x2,y2)
  // 2: (x3,y3)→(x4,y4)

  const textList = this.parseNumberedTextList(aiResponse);
  const coordsList = this.parseCoordinatesList(aiResponse);

  // 5. Save to database
  for (let i = 0; i < textList.length; i++) {
    await this.extractionResults.insertOne({
      _id: freshID(),
      imageId: mediaId,
      extractedText: textList[i],
      position: coordsList[i] || defaultPosition
    });
  }

  return { message: `Extracted ${textList.length} text blocks` };
}
```

---

## 🔧 Required Setup

### **1. Environment Variables (.env)**
```bash
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=mongodb://localhost:27017
DB_NAME=your_database
```

### **2. File Structure**
```
backend/
├── uploads/                          ← Image files stored here
│   └── {userId}/
│       └── {folderPath}/
│           └── image.jpg
├── concepts/
│   └── TextExtraction/
│       ├── TextExtraction.ts         ← Main concept
│       └── TextExtraction.test.ts    ← Test file
├── src/
│   └── gemini-llm.ts                 ← Gemini API wrapper
└── .env                               ← Environment variables
```

### **3. Database Collections**
```javascript
// MediaManagement.mediaFiles
{
  _id: "media-id",
  filename: "image.jpg",
  filePath: "/folder",
  mediaType: "jpg",
  owner: "user-id",
  uploadDate: Date,
  updateDate: Date
}

// TextExtraction.extractionResults
{
  _id: "extraction-id",
  imageId: "media-id",
  extractedText: "Text content",
  position: {
    fromCoord: [x1, y1],
    toCoord: [x2, y2]
  }
}
```

---

## 🚀 Running the Tests

### **Run all TextExtraction tests:**
```bash
deno test --allow-read --allow-env --allow-net --allow-write \
  concepts/TextExtraction/TextExtraction.test.ts
```

### **Run simple test:**
```bash
deno test --allow-read --allow-env --allow-net --allow-write \
  test-ai-extraction-simple.ts
```

### **Run with verbose output:**
```bash
deno test --allow-read --allow-env --allow-net --allow-write \
  --trace-ops \
  test-ai-extraction-simple.ts
```

---

## 📊 Expected Output

```
🎬 Testing AI extraction with Spirited Away poster

✅ Connected to MongoDB
✅ TextExtraction instance created
✅ Test media file record created
✅ Test image file copied to: ./uploads/test-user-123/TestImages

🤖 Calling AI text extraction...

📊 AI Extraction Result:
   Success: true
   Message: Extracted 12 text blocks

✅ Found 12 text extractions

📝 Extracted Texts:

======================================================================

1. "千と千尋の神隠し"
   Position: (120, 50) → (580, 120)

2. "Spirited Away"
   Position: (150, 130) → (550, 180)

3. "宮崎駿"
   Position: (280, 200) → (420, 240)

4. "Hayao Miyazaki"
   Position: (250, 250) → (450, 280)

5. "スタジオジブリ"
   Position: (260, 300) → (440, 340)

...

======================================================================

✅ Test completed and cleaned up!

test AI Text Extraction - Spirited Away Poster ... ok (5.2s)

ok | 1 passed | 0 failed (5.2s)
```

---

## ✅ Key Takeaways

| Step | Code | Purpose |
|------|------|---------|
| **1. Setup** | `const textExtraction = new TextExtractionConcept(db)` | Create instance |
| **2. Call AI** | `await textExtraction.extractTextFromMedia({...})` | Extract text |
| **3. Get Results** | `await textExtraction._getExtractionResultsForImage({...})` | Retrieve from DB |
| **4. Process** | Loop through `extractions` array | Use the data |

---

## 🎯 Quick Copy-Paste Test

Save this as `test.ts` and run it:

```typescript
import { MongoClient } from "npm:mongodb";
import TextExtractionConcept from "./concepts/TextExtraction/TextExtraction.ts";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const client = new MongoClient(Deno.env.get("MONGODB_URL")!);
await client.connect();
const db = client.db("test_db");

const textExtraction = new TextExtractionConcept(db);

// Test extraction
const result = await textExtraction.extractTextFromMedia({
  userId: "test-user",
  mediaId: "test-media-id",  // Must exist in database
  customPrompt: undefined
});

console.log(result);
```

```bash
deno run --allow-read --allow-env --allow-net test.ts
```

---

**That's it! You now have everything you need to test AI text extraction! 🎉**
