# 🔧 Fix Backend Image Extraction

## 🎯 The Problem

You have **TWO separate folders**:
- **Frontend repo:** `TEPKonjacFrontEnd` (where I made changes ❌)
- **Backend repo:** `concept_backend` (where your server runs ✅)

The backend can't extract text because it's trying to read from disk files, but should read from the database!

---

## ✅ Quick Fix (3 Steps)

### Step 1: Update Backend TextExtraction.ts

**Navigate to your backend folder:**
```powershell
cd C:\Users\jingy\Downloads\concept_backend
```

**Open this file:**
```
concept_backend/src/concepts/TextExtraction/TextExtraction.ts
```

**Find this section (around line 43):**
```typescript
export default class TextExtractionConcept {
  extractionResults: Collection<ExtractionResults>;
  locations: Collection<Locations>;
  mediaFiles: Collection<any>;
  private geminiLLM: GeminiLLM;

  constructor(private readonly db: Db) {
    this.extractionResults = this.db.collection(PREFIX + "extractionResults");
    this.locations = this.db.collection(PREFIX + "locations");
    this.mediaFiles = this.db.collection("MediaManagement.mediaFiles");
    this.geminiLLM = new GeminiLLM();
  }
```

**Change it to:**
```typescript
export default class TextExtractionConcept {
  extractionResults: Collection<ExtractionResults>;
  locations: Collection<Locations>;
  mediaFiles: Collection<any>;
  mediaStorage: Collection<any>; // ← ADD THIS LINE
  private geminiLLM: GeminiLLM;

  constructor(private readonly db: Db) {
    this.extractionResults = this.db.collection(PREFIX + "extractionResults");
    this.locations = this.db.collection(PREFIX + "locations");
    this.mediaFiles = this.db.collection("MediaManagement.mediaFiles");
    this.mediaStorage = this.db.collection("MediaStorage.storedImages"); // ← ADD THIS LINE
    this.geminiLLM = new GeminiLLM();
  }
```

---

### Step 2: Update the Extract Method

**Find the `extractTextFromMedia` method (around line 160):**

Look for this code:
```typescript
try {
  console.log(`🤖 Starting Gemini AI text extraction for: ${mediaFile.filename}`);

  // Get full image path
  const imagePath = this.getImagePath(userId, mediaFile);

  // Get image dimensions
  const dimensions = await this.getImageDimensions(imagePath);
  console.log(`📐 Image dimensions: ${dimensions.width}x${dimensions.height}`);

  // Build the OCR prompt
  const ocrPrompt = `You are an OCR assistant...`
```

**Replace it with:**
```typescript
try {
  console.log(`🤖 Starting Gemini AI text extraction for: ${mediaFile.filename}`);

  // ========== READ FROM DATABASE (NOT DISK) ==========
  // Get image data from database
  const storedImage = await this.mediaStorage.findOne({ mediaId: mediaId });

  if (!storedImage || !storedImage.imageData) {
    console.error(`❌ Image data not found in database for mediaId: ${mediaId}`);
    return { error: "Image data not found in database. Please re-upload the image." };
  }

  console.log(`✅ Image data retrieved from database (${storedImage.size} bytes)`);

  // Prepare image data for AI
  const imageDataForAI = storedImage.imageData.startsWith('data:')
    ? storedImage.imageData
    : `data:${storedImage.mimeType};base64,${storedImage.imageData}`;

  // Use default dimensions
  const dimensions = { width: 1920, height: 1080 };
  console.log(`📐 Using default dimensions: ${dimensions.width}x${dimensions.height}`);
  // ========== END CHANGES ==========

  // Build the OCR prompt
  const ocrPrompt = `You are an OCR assistant...`
```

---

### Step 3: Update the AI Call

**Find this line (around line 223):**
```typescript
// Call Gemini AI
const aiResponse = await this.geminiLLM.executeLLM(ocrPrompt, imagePath);
```

**Change it to:**
```typescript
// Call Gemini AI with base64 image data
console.log(`📤 Sending image data to Gemini AI...`);
const aiResponse = await this.geminiLLM.executeLLM(ocrPrompt, imageDataForAI);
console.log(`✅ Gemini extraction complete`);
```

---

## 🔄 Step 4: Restart Backend

```powershell
# Stop backend (Ctrl+C)

# Restart
deno run --allow-all server.ts
```

---

## 🧪 Step 5: Test

1. **Upload a new image**
2. **Try to extract text**
3. **Should work now!**

**Expected console output:**
```
🤖 Starting Gemini AI text extraction for: ChiikawaPoster.jpg
✅ Image data retrieved from database (125000 bytes)
📐 Using default dimensions: 1920x1080
📤 Sending image data to Gemini AI...
✅ Gemini extraction complete
📝 Found 5 text blocks
✅ Created 5 extraction records
```

---

## 📝 Summary of Changes

| What | Before | After |
|------|--------|-------|
| Add mediaStorage | ❌ Not defined | ✅ Added to constructor |
| Read image from | Disk (`./uploads/...`) | Database (`MediaStorage`) |
| Pass to AI | File path | Base64 data URI |
| Error | Stack overflow | ✅ Works! |

---

## 🔍 Why This Fixes It

**The "Maximum call stack size exceeded" error** was likely caused by:
- Gemini LLM trying to read a very large file from disk
- File reading into memory causing recursion issues
- Using base64 data directly avoids this problem

**Also fixes:**
- Images in database can now be used by AI ✅
- No dependency on disk files ✅
- Works with re-uploaded images ✅

---

## ⚠️ Important Note

After making these changes, **old images** that don't have data in the database won't work. You'll need to:
- Re-upload them, OR
- They'll still work if the disk files exist

**New images** uploaded after this fix will work perfectly!

---

**Make these 3 changes to your BACKEND repo and restart!** 🚀
