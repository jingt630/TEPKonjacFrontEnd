# 🖼️ Image Storage & Preview Flow

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS IMAGE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (FileUpload.vue)                     │
│                                                                   │
│  1. User selects file                                            │
│  2. FileReader reads file as Base64                              │
│     const reader = new FileReader()                              │
│     reader.readAsDataURL(file)                                   │
│     → previewUrl.value = "data:image/jpeg;base64,/9j/4AAQ..."   │
│                                                                   │
│  3. Call uploadFile() with base64 data:                          │
│     {                                                             │
│       userId: "019a07bf-79e5-7fbc-86c4-e9f265c07fd6",           │
│       filePath: "/Manga1",                                       │
│       filename: "LionKing.jpg",                                  │
│       mediaType: "jpg",                                          │
│       fileData: "data:image/jpeg;base64,/9j/4AAQ..."  ← BASE64  │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (MediaManagement.ts)                    │
│                     upload() method                              │
│                                                                   │
│  1. Receive request with fileData                                │
│                                                                   │
│  2. Extract base64 string:                                       │
│     const base64Data = fileData.replace(                         │
│       /^data:image\/\w+;base64,/, ''                            │
│     )                                                             │
│     → "...clean base64 string..."                               │
│                                                                   │
│  3. Decode to binary:                                            │
│     const fileBytes = Uint8Array.from(                           │
│       atob(base64Data),                                          │
│       c => c.charCodeAt(0)                                       │
│     )                                                             │
│     → [255, 216, 255, 224, ...] (actual image bytes)            │
│                                                                   │
│  4. Create directory structure:                                  │
│     ./uploads/                                                   │
│       └── {userId}/                                              │
│           └── {filePath}/                                        │
│               └── {filename}                                     │
│                                                                   │
│     Example:                                                     │
│     ./uploads/019a07bf-79e5-7fbc-86c4-e9f265c07fd6/Manga1/     │
│       └── LionKing.jpg                                           │
│                                                                   │
│  5. Write file to disk:                                          │
│     await Deno.writeFile(fullPath, fileBytes)                    │
│                                                                   │
│  6. Save metadata to MongoDB:                                    │
│     {                                                             │
│       _id: "xxx",                                                │
│       filename: "LionKing.jpg",                                  │
│       filePath: "/Manga1",                                       │
│       mediaType: "jpg",                                          │
│       owner: userId,                                             │
│       uploadDate: "2025-10-21T...",                              │
│       cloudURL: "gs://..."                                       │
│     }                                                             │
│                                                                   │
│  ✅ Return success                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND AUTO-REFRESHES                       │
│              (MediaGallery shows new image card)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Image Preview Flow

```
┌─────────────────────────────────────────────────────────────────┐
│             USER VIEWS GALLERY (MediaGallery.vue)                │
│                                                                   │
│  Shows list of MediaCard components, one per uploaded image      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EACH IMAGE CARD (MediaCard.vue)                     │
│                                                                   │
│  1. On mount, call loadImage()                                   │
│     onMounted(() => { loadImage() })                             │
│                                                                   │
│  2. Fetch image from backend:                                    │
│     POST http://localhost:8000/api/MediaManagement/_serveImage  │
│     Body: {                                                       │
│       userId: "019a07bf...",                                     │
│       mediaId: "xxx-xxx-xxx"                                     │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (MediaManagement.ts)                    │
│                   _serveImage() method                           │
│                                                                   │
│  1. Lookup media file in database:                               │
│     const mediaFile = await this.mediaFiles.findOne({            │
│       _id: mediaId,                                              │
│       owner: userId  ← SECURITY: Only owner can access          │
│     })                                                            │
│                                                                   │
│  2. Construct file path:                                         │
│     const fullPath =                                             │
│       `./uploads/${userId}${mediaFile.filePath}/                │
│        ${mediaFile.filename}`                                    │
│                                                                   │
│     Example:                                                     │
│     ./uploads/019a07bf.../Manga1/LionKing.jpg                   │
│                                                                   │
│  3. Read file from disk:                                         │
│     const fileData = await Deno.readFile(fullPath)               │
│     → Uint8Array([255, 216, 255, ...])                          │
│                                                                   │
│  4. Return binary response:                                      │
│     return new Response(fileData, {                              │
│       headers: {                                                 │
│         "Content-Type": "image/jpg",                             │
│         "Access-Control-Allow-Origin": "http://localhost:5173"   │
│       }                                                           │
│     })                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (MediaCard.vue) receives binary            │
│                                                                   │
│  1. Get binary blob:                                             │
│     const blob = await response.blob()                           │
│     → Blob { size: 94284, type: "image/jpg" }                   │
│                                                                   │
│  2. Create temporary URL:                                        │
│     imageUrl.value = URL.createObjectURL(blob)                   │
│     → "blob:http://localhost:5173/abc-123-def"                  │
│                                                                   │
│  3. Display in template:                                         │
│     <img :src="imageUrl" alt="LionKing.jpg" />                  │
│                                                                   │
│  ✅ Image appears in gallery!                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File System Structure

After uploads, your backend will have:

```
backend/
├── uploads/                           ← Where ALL images are stored
│   ├── 019a07bf-79e5-7fbc-86c4...    ← User 1's folder
│   │   ├── /                          ← Root directory files
│   │   │   ├── avatar.png
│   │   │   └── screenshot.jpg
│   │   ├── Manga1/                    ← Subfolder
│   │   │   ├── LionKing.jpg
│   │   │   └── page1.png
│   │   └── Manga2/                    ← Another subfolder
│   │       └── cover.jpg
│   │
│   └── 02ab345c-67d8-8abc-12e4...    ← User 2's folder (isolated!)
│       ├── /
│       │   └── profile.jpg
│       └── Documents/
│           └── scan.pdf
│
├── src/
│   ├── concept_server.ts
│   └── gemini-llm.ts
│
└── concepts/
    ├── MediaManagement/
    │   └── MediaManagement.ts
    └── TextExtraction/
        └── TextExtraction.ts
```

---

## 🔐 Security Model

### ✅ **User Isolation**

1. **Upload**: Files saved to `./uploads/{userId}/...`
2. **Serve**: Only images where `owner === userId` can be accessed
3. **Result**: Users CANNOT see each other's images

### ✅ **Path Normalization**

Before: `./uploads/userId//Manga1/file.jpg` ❌ (double slash causes errors)
After:  `./uploads/userId/Manga1/file.jpg` ✅ (normalized)

```typescript
const rawPath = `./uploads/${userId}${filePath}/${filename}`;
const normalizedPath = rawPath.replace(/([^:]\/)\/+/g, '$1');
```

---

## 📝 Key Code Locations

### **1. Upload & Save to Disk**
📍 `concepts/MediaManagement/MediaManagement.ts` lines 100-134
```typescript
async upload({ userId, filePath, filename, fileData }) {
  // Decode base64
  const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
  const fileBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Save to disk
  const fullPath = `./uploads/${userId}${filePath}/${filename}`;
  await Deno.writeFile(fullPath, fileBytes);
}
```

### **2. Read & Serve from Disk**
📍 `concepts/MediaManagement/MediaManagement.ts` lines 334-365
```typescript
async _serveImage({ userId, mediaId }) {
  // Get metadata
  const mediaFile = await this.mediaFiles.findOne({
    _id: mediaId,
    owner: userId
  });

  // Read from disk
  const fullPath = `./uploads/${userId}${mediaFile.filePath}/${mediaFile.filename}`;
  const fileData = await Deno.readFile(fullPath);

  // Return binary
  return { data: fileData, contentType: `image/${mediaFile.mediaType}` };
}
```

### **3. Frontend Display**
📍 `src/components/MediaCard.vue` lines 35-59
```typescript
const loadImage = async () => {
  const response = await fetch('/api/MediaManagement/_serveImage', {
    method: 'POST',
    body: JSON.stringify({ userId, mediaId })
  });

  const blob = await response.blob();
  imageUrl.value = URL.createObjectURL(blob);
}
```

---

## 🧪 How to Verify It's Working

### **1. Check Upload Logs**
```
📤 Upload starting for: LionKing.jpg
   - User: 019a07bf-79e5-7fbc-86c4-e9f265c07fd6
   - Path: /Manga1
   - Has file data: true
   - File data length: 125847 chars
🔢 Decoded base64 length: 94284
📦 File bytes: 94284 bytes
✅ File saved to disk: ./uploads/.../Manga1/LionKing.jpg
✅ File verified on disk: 94284 bytes
```

### **2. Check File Exists**
```bash
cd backend
ls -R uploads/
# Should show: uploads/userId/Manga1/LionKing.jpg
```

### **3. Check Preview Logs**
```
📷 Serving image from: ./uploads/.../Manga1/LionKing.jpg
✅ Served 94284 bytes
```

### **4. Check Browser**
- ✅ Image appears in gallery
- ✅ No 404 errors in console
- ✅ Image URL is `blob:http://localhost:5173/...`

---

## 🎯 Why This Design?

### **Advantages:**

1. **✅ Persistent Storage**: Images survive server restarts
2. **✅ Fast Access**: Direct file system reads (no base64 overhead)
3. **✅ Secure**: User isolation via directory structure + DB checks
4. **✅ Scalable**: Easy to move to cloud storage (S3, GCS) later
5. **✅ Efficient**: Browser caches blob URLs automatically
6. **✅ AI-Ready**: TextExtraction can read the same files

### **Storage Comparison:**

| Method | Upload | Serve | DB Size | Complexity |
|--------|--------|-------|---------|------------|
| **Base64 in DB** | ❌ Slow | ❌ Slow | 🔴 Huge | ⭐ Easy |
| **File System** | ✅ Fast | ✅ Fast | 🟢 Small | ⭐⭐ Medium |
| **Cloud Storage** | ✅ Fast | ✅ Fast | 🟢 Small | ⭐⭐⭐ Complex |

Current implementation = File System (best for local dev)

---

## 🚀 Summary

**Images are stored in:** `./uploads/{userId}/{filePath}/{filename}`

**Images are served by:**
1. Frontend requests with `userId` + `mediaId`
2. Backend verifies ownership
3. Backend reads file from disk
4. Backend returns binary data
5. Frontend creates blob URL and displays

**Users see previews because:**
- ✅ Real files are saved to disk during upload
- ✅ Real files are read from disk for preview
- ✅ Frontend converts binary to blob URL
- ✅ Blob URL is displayed in `<img>` tag

**Everything is working correctly!** 🎉
