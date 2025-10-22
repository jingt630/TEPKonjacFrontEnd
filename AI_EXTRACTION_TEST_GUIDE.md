# 🤖 AI Text Extraction Test Guide

## 🎬 Testing with Spirited Away Poster

Since I can't run the test directly in this environment, here's **exactly** how to test it on your backend:

---

## 🚀 Quick Test (Copy-Paste Ready)

### **Step 1: Copy test file to your backend**

```bash
# In your backend directory
cat > test-spirited-away.ts << 'EOF'
import { GeminiLLM } from "./src/gemini-llm.ts";

async function testSpiritedAway() {
  console.log("🎬 Testing AI with Spirited Away Poster\n");

  // Path to the image (adjust if needed)
  const imagePath = "./Spirited away movie poster.jpg";

  const prompt = `You are an advanced OCR system designed to extract text from movie posters.

TASK: Extract ALL visible text from this movie poster.

Instructions:
1. List each text element on a new line
2. Include movie titles (in both Japanese and English if present)
3. Include names, credits, taglines
4. Note the language for each text
5. Maintain spatial order (top to bottom)

Format your response like:
[LANGUAGE] Text content
Example:
[JAPANESE] 千と千尋の神隠し
[ENGLISH] Spirited Away

Be thorough and accurate.`;

  try {
    const llm = new GeminiLLM();
    console.log("🔄 Calling Gemini AI...\n");

    const result = await llm.executeLLM(prompt, imagePath);

    console.log("✅ AI EXTRACTION RESULT:");
    console.log("=".repeat(70));
    console.log(result);
    console.log("=".repeat(70));
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testSpiritedAway();
EOF
```

### **Step 2: Copy the Spirited Away poster to backend**

```bash
# Copy from frontend to backend
cp "path/to/TEPKonjacFrontEnd/Spirited away movie poster.jpg" ./
```

### **Step 3: Set up environment variables**

Make sure your backend has a `.env` file:

```bash
cat > .env << 'EOF'
GEMINI_API_KEY=AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=First_Concept_DB
EOF
```

### **Step 4: Run the test**

```bash
deno run --allow-read --allow-env test-spirited-away.ts
```

---

## 📊 Expected Output

Based on typical Spirited Away posters, you should see something like:

```
🎬 Testing AI with Spirited Away Poster

🔄 Calling Gemini AI...

✅ AI EXTRACTION RESULT:
======================================================================
[JAPANESE] 千と千尋の神隠し
[ENGLISH] Spirited Away
[JAPANESE] スタジオジブリ
[JAPANESE] 宮崎駿
[ENGLISH] Hayao Miyazaki
[ENGLISH] Studio Ghibli
[JAPANESE] 日本テレビ放送網
[JAPANESE] 東宝
[JAPANESE] 三鷹の森ジブリ美術館
[ENGLISH] Winner of the Academy Award for Best Animated Feature
[ENGLISH] 2001
======================================================================
```

**Note:** The actual output depends on:
- Which Spirited Away poster image you're using
- What text is actually visible in that specific poster
- Gemini AI's interpretation

---

## 🧪 How the AI Extraction Works

### **In TextExtraction.ts**

```typescript
async extractTextFromMedia({ userId, mediaId, customPrompt }) {
  // 1. Get the media file from database
  const mediaFile = await this.mediaFiles.findOne({
    _id: mediaId,
    owner: userId
  });

  // 2. Construct path to actual image file
  const imagePath = this.getImagePath(userId, mediaFile);
  // Example: ./uploads/userId/Manga1/LionKing.jpg

  // 3. Build AI prompt for OCR
  const defaultPrompt = `You are an advanced OCR system...
Extract all text and provide coordinates...`;

  const prompt = customPrompt || defaultPrompt;

  // 4. Call Gemini AI with image
  const aiResponse = await this.geminiLLM.executeLLM(prompt, imagePath);

  // 5. Parse AI response
  // Expected format:
  // 1. Text content here
  // 2. More text content
  // ...
  // Coordinates:
  // 1. (x1,y1)→(x2,y2)
  // 2. (x3,y3)→(x4,y4)

  const textList = this.parseNumberedTextList(aiResponse);
  const coordsList = this.parseCoordinatesList(aiResponse);

  // 6. Create ExtractionResult objects
  for (let i = 0; i < textList.length; i++) {
    const extraction = {
      _id: freshID(),
      imageId: mediaId,
      extractedText: textList[i],
      position: coordsList[i] || { fromCoord: [0,0], toCoord: [100,20] }
    };

    await this.extractionResults.insertOne(extraction);
  }

  return { success: true, count: textList.length };
}
```

---

## 🎯 Different Test Scenarios

### **Test 1: Basic OCR (Just extract text)**

```typescript
const prompt = "Extract all visible text from this image. List each on a new line.";
```

**Use case:** Quick text extraction without coordinates

---

### **Test 2: Structured OCR (Text + Coordinates)**

```typescript
const prompt = `Extract all text and provide coordinates.

Format:
1. First text
2. Second text

Coordinates:
1. (10,50)→(200,80)
2. (10,100)→(250,130)`;
```

**Use case:** When you need spatial positioning for overlays

---

### **Test 3: Multilingual OCR**

```typescript
const prompt = `Extract all text. For each:
- Identify language
- Provide transliteration if non-Latin script
- Indicate position (top/middle/bottom)`;
```

**Use case:** Manga, anime, multilingual documents

---

### **Test 4: Selective OCR**

```typescript
const prompt = `Extract only dialogue text bubbles.
Ignore title text and sound effects.`;
```

**Use case:** Comic/manga translation workflows

---

## 🔍 Debugging AI Extraction

### **Check 1: Is Gemini API key valid?**

```bash
# In your backend
cat .env | grep GEMINI_API_KEY
```

Should show: `GEMINI_API_KEY=AIzaSy...`

---

### **Check 2: Can Gemini LLM read the file?**

Add debug logging:

```typescript
// In gemini-llm.ts, in executeLLM()
if (imagePath) {
  const imageData = await Deno.readFile(imagePath);
  console.log(`📷 Image loaded: ${imageData.length} bytes`);
}
```

Should show: `📷 Image loaded: 150000 bytes` (or similar)

---

### **Check 3: Is Gemini responding?**

```typescript
// In gemini-llm.ts
console.log("🤖 Calling Gemini API...");
const result = await ai.models.generateContent({...});
console.log("✅ Got response from Gemini");
console.log("Response type:", typeof result.text);
console.log("Response length:", result.text?.length);
```

---

### **Check 4: Is the response being parsed correctly?**

```typescript
// In TextExtraction.ts
const textList = this.parseNumberedTextList(aiResponse);
console.log(`📝 Parsed ${textList.length} text blocks`);
console.log("First 3:", textList.slice(0, 3));
```

---

## ⚠️ Common Issues

### **Issue 1: "result.text is undefined"**

**Cause:** Gemini API response structure changed or API error

**Fix:** Check if you're using `.text` property correctly:

```typescript
// ✅ Correct
const text = result.text;

// ❌ Wrong
const text = await result.text();
```

---

### **Issue 2: "File not found"**

**Cause:** Image path is incorrect

**Debug:**
```typescript
const imagePath = this.getImagePath(userId, mediaFile);
console.log(`📂 Looking for image at: ${imagePath}`);

try {
  const stat = await Deno.stat(imagePath);
  console.log(`✅ File exists: ${stat.size} bytes`);
} catch {
  console.log(`❌ File does not exist!`);
}
```

---

### **Issue 3: "Empty AI response"**

**Cause:**
- API key invalid
- Image unreadable
- Prompt unclear

**Fix:**
```typescript
if (!aiResponse || aiResponse.trim() === "") {
  console.error("❌ Empty response from AI");
  console.log("Prompt was:", prompt);
  console.log("Image path:", imagePath);
}
```

---

### **Issue 4: "Cannot parse coordinates"**

**Cause:** AI didn't return coordinates in expected format

**Solution:** Make prompt more specific:

```typescript
const prompt = `Extract text and provide coordinates.

REQUIRED FORMAT:
Numbered list:
1. Text one
2. Text two

Coordinates (REQUIRED):
1. (x1,y1)→(x2,y2)
2. (x3,y3)→(x4,y4)

You MUST provide coordinates for every text.`;
```

---

## 📝 What You Should See in Backend Logs

### **Successful Extraction:**

```
📝 Opening image editor for: SpiritedAway.jpg
🤖 Starting text extraction for media: xxx-xxx-xxx
📂 Constructed path: ./uploads/.../Manga1/SpiritedAway.jpg
📷 Reading image from: ./uploads/.../Manga1/SpiritedAway.jpg
✅ Image file read successfully: 150000 bytes
🤖 Calling Gemini AI for text extraction
✅ Gemini response received
📝 Parsed 12 text blocks
📍 Parsed 12 coordinate pairs
✅ Created 12 extraction results
```

---

### **Failed Extraction:**

```
📝 Opening image editor for: SpiritedAway.jpg
🤖 Starting text extraction for media: xxx-xxx-xxx
📂 Constructed path: ./uploads/.../Manga1/SpiritedAway.jpg
📷 Reading image from: ./uploads/.../Manga1/SpiritedAway.jpg
❌ Error reading image file: NotFound: The system cannot find the file...
```

**→ This means file wasn't saved during upload!**

---

## 🎯 Testing Checklist

Before testing AI extraction:

- [ ] ✅ Spirited Away image copied to backend
- [ ] ✅ `.env` file has GEMINI_API_KEY
- [ ] ✅ `gemini-llm.ts` uses `.text` property (not `.text()`)
- [ ] ✅ Backend has `--allow-read` and `--allow-env` permissions
- [ ] ✅ Image is uploaded via frontend first
- [ ] ✅ Image preview works (confirms file on disk)
- [ ] ✅ Backend logs show file saved successfully

---

## 🚀 Quick Manual Test

If you just want to see if Gemini works:

```typescript
// test-gemini-simple.ts
import { GeminiLLM } from "./src/gemini-llm.ts";

const llm = new GeminiLLM();

// Test 1: Text-only
console.log("Test 1: Text only");
const result1 = await llm.executeLLM("What is 2+2?");
console.log("Response:", result1);

// Test 2: With image
console.log("\nTest 2: With image");
const result2 = await llm.executeLLM(
  "Describe this image briefly",
  "./Spirited away movie poster.jpg"
);
console.log("Response:", result2);
```

Run:
```bash
deno run --allow-read --allow-env test-gemini-simple.ts
```

---

## 📚 Files Involved in AI Extraction

| File | Purpose |
|------|---------|
| `src/gemini-llm.ts` | Gemini API wrapper |
| `concepts/TextExtraction/TextExtraction.ts` | Extraction logic |
| `src/components/ImageEditor.vue` | UI to trigger extraction |
| `src/composables/useTextExtraction.js` | Frontend state management |

---

## 🎉 Success Indicators

You'll know AI extraction is working when:

1. ✅ Click "Auto Extract Text" in ImageEditor
2. ✅ Backend logs show: `🤖 Calling Gemini AI...`
3. ✅ Backend logs show: `✅ Gemini response received`
4. ✅ Backend logs show: `✅ Created N extraction results`
5. ✅ Frontend shows extracted text in the list
6. ✅ Each text block has coordinates

---

**Ready to test? Copy the files to your backend and run the test!** 🚀
