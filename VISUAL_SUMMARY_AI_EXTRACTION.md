# 🎨 Visual Summary - AI Extraction Frontend Update

## 📊 What You'll See Now

### **Before (What Wasn't Working):**
```
❌ Extraction display showed: extraction.text (undefined)
❌ Backend received: { text: "...", mediaId: "..." } (wrong params)
❌ Manual add failed - parameter mismatch
❌ Only showed extraction ID
```

### **After (What Works Now):**
```
✅ Extraction display shows: extraction.extractedText (correct)
✅ Backend receives: { txt: "...", imageId: "..." } (correct params)
✅ Manual add works - parameters match backend
✅ Shows extraction ID, text ID, and position
```

---

## 🖼️ UI Layout - Image Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  ✏️ Edit Image: SpiritedAway.jpg                    ✖ Close     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┐  ┌───────────────────────────┐   │
│  │                          │  │  📄 Text Extractions (12)  │   │
│  │                          │  │                             │   │
│  │      [IMAGE PREVIEW]     │  │  ┌───────────────────────┐ │   │
│  │                          │  │  │ "千と千尋の神隠し"       │ │   │
│  │                          │  │  │ ID: abc-123-def       │ │   │
│  │     1024x768 pixels      │  │  │ Text ID: media_0      │ │   │
│  │                          │  │  │ Position: xyz-789     │ │   │
│  │                          │  │  │ [✏️ Edit] [🗑️ Delete]│ │   │
│  │                          │  │  └───────────────────────┘ │   │
│  └──────────────────────────┘  │                             │   │
│                                 │  ┌───────────────────────┐ │   │
│  [🤖 Auto Extract Text]         │  │ "Spirited Away"       │ │   │
│                                 │  │ ID: def-456-ghi       │ │   │
│                                 │  │ Text ID: media_1      │ │   │
│                                 │  │ Position: jkl-012     │ │   │
│                                 │  │ [✏️ Edit] [🗑️ Delete]│ │   │
│                                 │  └───────────────────────┘ │   │
│                                 │                             │   │
│                                 │  ... (more extractions)     │   │
│                                 │                             │   │
│                                 │  [➕ Add Manual]           │   │
│                                 └───────────────────────────┘   │
│                                                                   │
│  💡 Tip: Extract text from images for translation and rendering  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - Complete Process

### **Step 1: User Clicks "Auto Extract"**
```
User
  ↓ clicks 🤖 Auto Extract Text
  ↓
ImageEditor.vue
  ↓ autoExtractText()
  ↓ fetch(/TextExtraction/extractTextFromMedia)
  ↓ body: { userId, mediaId }
  ↓
Backend (concept_backend)
```

### **Step 2: Backend Processes Image**
```
Backend
  ↓ TextExtraction.extractTextFromMedia()
  ↓ Get media file from DB
  ↓ Build path: ./uploads/{userId}/{path}/{filename}
  ↓ Read image file
  ↓ Call Gemini AI with OCR prompt
  ↓
Gemini AI
  ↓ Analyzes image
  ↓ Extracts text + coordinates
  ↓ Returns: "1: 千と千尋の神隠し (from: {x:120, y:50}, to: {x:580, y:120})"
  ↓           "2: Spirited Away (from: {x:150, y:130}, to: {x:550, y:180})"
  ↓           ... more text blocks
  ↓
Backend
  ↓ Parse numbered text list
  ↓ Parse coordinates
  ↓ For each text block:
  ↓   - Create Location record (fromCoord, toCoord)
  ↓   - Create ExtractionResult record (text, position, textId)
  ↓ Returns: { results: [id1, id2, ...] }
```

### **Step 3: Frontend Refreshes**
```
Backend Response
  ↓ { results: ["abc-123", "def-456", ...] }
  ↓
ImageEditor.vue
  ↓ await loadExtractions()
  ↓ fetch(/TextExtraction/_getExtractionResultsForImage)
  ↓ body: { userId, mediaId }
  ↓
Backend
  ↓ Find all extractions for mediaId
  ↓ Returns: [
  ↓   {
  ↓     _id: "abc-123",
  ↓     extractedText: "千と千尋の神隠し",
  ↓     textId: "media-id_0",
  ↓     position: "location-id-1",
  ↓     imagePath: "media-id"
  ↓   },
  ↓   { ... more extractions ... }
  ↓ ]
  ↓
ImageEditor.vue
  ↓ extractions.value = data
  ↓ UI updates automatically (Vue reactivity)
  ↓
User sees updated list ✅
```

---

## 📦 Extraction Item - Detailed View

### **What Each Extraction Shows:**

```
┌─────────────────────────────────────────────────┐
│  千と千尋の神隠し                                  │  ← Extracted Text
│                                                 │
│  ID:       abc-123-def-456-ghi-789             │  ← Extraction Result ID
│  Text ID:  media-id-123_0                      │  ← Formatted text identifier
│  Position: location-id-xyz-987                 │  ← Location record reference
│                                                 │
│  [✏️ Edit]  [🗑️ Delete]                        │  ← Actions
└─────────────────────────────────────────────────┘
```

### **Field Explanations:**

| Field | Source | Purpose |
|-------|--------|---------|
| **Extracted Text** | `extraction.extractedText` | The actual text from the image |
| **ID** | `extraction._id` | Unique ID for this extraction result |
| **Text ID** | `extraction.textId` | Formatted as `{mediaId}_{index}` |
| **Position** | `extraction.position` | Reference to location coordinates in DB |

---

## 🎬 Example - Spirited Away Poster

### **Input Image:**
```
┌────────────────────┐
│  千と千尋の神隠し    │  ← Japanese title
│                    │
│  Spirited Away     │  ← English title
│                    │
│  宮崎駿            │  ← Director (Japanese)
│  Hayao Miyazaki    │  ← Director (English)
│                    │
│  スタジオジブリ     │  ← Studio (Japanese)
│  Studio Ghibli     │  ← Studio (English)
│                    │
│  2001              │  ← Year
└────────────────────┘
```

### **After AI Extraction:**

```
Extractions List (7 items)

1. ┌─────────────────────────────────────┐
   │ 千と千尋の神隠し                      │
   │ ID: 019abc01-23de-4567-8901-2345abc │
   │ Text ID: media-456_0                │
   │ Position: loc-789                   │
   └─────────────────────────────────────┘

2. ┌─────────────────────────────────────┐
   │ Spirited Away                       │
   │ ID: 019abc02-23de-4567-8901-2345def │
   │ Text ID: media-456_1                │
   │ Position: loc-790                   │
   └─────────────────────────────────────┘

3. ┌─────────────────────────────────────┐
   │ 宮崎駿                               │
   │ ID: 019abc03-23de-4567-8901-2345ghi │
   │ Text ID: media-456_2                │
   │ Position: loc-791                   │
   └─────────────────────────────────────┘

4. ┌─────────────────────────────────────┐
   │ Hayao Miyazaki                      │
   │ ID: 019abc04-23de-4567-8901-2345jkl │
   │ Text ID: media-456_3                │
   │ Position: loc-792                   │
   └─────────────────────────────────────┘

5. ┌─────────────────────────────────────┐
   │ スタジオジブリ                        │
   │ ID: 019abc05-23de-4567-8901-2345mno │
   │ Text ID: media-456_4                │
   │ Position: loc-793                   │
   └─────────────────────────────────────┘

6. ┌─────────────────────────────────────┐
   │ Studio Ghibli                       │
   │ ID: 019abc06-23de-4567-8901-2345pqr │
   │ Text ID: media-456_5                │
   │ Position: loc-794                   │
   └─────────────────────────────────────┘

7. ┌─────────────────────────────────────┐
   │ 2001                                │
   │ ID: 019abc07-23de-4567-8901-2345stu │
   │ Text ID: media-456_6                │
   │ Position: loc-795                   │
   └─────────────────────────────────────┘
```

---

## 🔧 API Calls - What Happens Under the Hood

### **1. Auto Extract (AI)**
```http
POST /api/TextExtraction/extractTextFromMedia
Content-Type: application/json

{
  "userId": "user-123",
  "mediaId": "media-456"
}

Response:
{
  "results": [
    "019abc01-23de-4567-8901-2345abc",
    "019abc02-23de-4567-8901-2345def",
    ...
  ]
}
```

### **2. Load Extractions**
```http
POST /api/TextExtraction/_getExtractionResultsForImage
Content-Type: application/json

{
  "userId": "user-123",
  "mediaId": "media-456"
}

Response:
[
  {
    "_id": "019abc01-23de-4567-8901-2345abc",
    "extractedText": "千と千尋の神隠し",
    "textId": "media-456_0",
    "position": "loc-789",
    "imagePath": "media-456"
  },
  ...
]
```

### **3. Add Manual Extraction**
```http
POST /api/TextExtraction/addExtractionTxt
Content-Type: application/json

{
  "userId": "user-123",
  "imageId": "media-456",
  "txt": "Manual text here",
  "location": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 50
  }
}

Response:
{
  "_id": "019abc08-23de-4567-8901-2345xyz",
  "extractedText": "Manual text here",
  "textId": "media-456_7",
  "position": "loc-796"
}
```

### **4. Edit Extraction**
```http
POST /api/TextExtraction/editExtractText
Content-Type: application/json

{
  "userId": "user-123",
  "extractionId": "019abc01-23de-4567-8901-2345abc",
  "newText": "千と千尋の神隠し (Corrected)"
}

Response:
{} // Empty object on success
```

### **5. Delete Extraction**
```http
POST /api/TextExtraction/deleteExtraction
Content-Type: application/json

{
  "userId": "user-123",
  "extractionId": "019abc01-23de-4567-8901-2345abc"
}

Response:
{} // Empty object on success
```

---

## ✅ Quick Test Steps

1. **Start backend:**
   ```bash
   cd concept_backend
   deno run --allow-net --allow-read --allow-write --allow-env src/concept_server.ts
   ```

2. **Start frontend:**
   ```bash
   cd TEPKonjacFrontEnd
   npm run dev
   ```

3. **Upload an image**
4. **Click "Edit Image"**
5. **Click "🤖 Auto Extract Text"**
6. **Watch magic happen!** ✨

---

## 🎉 What's Working Now

✅ AI extraction creates multiple records in database
✅ Frontend correctly displays all extraction data
✅ Shows: ID, Text ID, Position, and extracted text
✅ Edit and delete buttons work properly
✅ Manual extraction uses correct parameter names
✅ Auto-refresh after AI extraction completes
✅ Proper data structure matching backend

**Everything is connected and working!** 🚀

