# 🔍 Debug Image Upload Issue

## 📍 Where Files Are Stored

### Disk Location:
```
Backend folder structure:
TEPKonjacBackEnd/
├── server.ts
├── uploads/               ← Created by backend
│   └── {userId}/          ← User's folder
│       └── {filePath}/    ← Upload path
│           └── image.jpg  ← Actual file
└── ...
```

**Example:**
- User ID: `019a0a13-78af-7195-ba52-5d5f9f816eb4`
- File path: `/`
- Filename: `test.jpg`
- **Disk location:** `./uploads/019a0a13-78af-7195-ba52-5d5f9f816eb4/test.jpg`

### Database Location:
```
MongoDB collections:
├── MediaManagement.mediaFiles      ← File metadata
└── MediaStorage.storedImages       ← Actual image data (base64)
```

---

## 🧪 Debugging Steps

### Step 1: Check Backend Console When Uploading

**Restart backend and watch console:**
```powershell
deno run --allow-all server.ts
```

**Upload an image and look for these logs:**

#### ✅ Expected (Working):
```
📤 Upload starting for: test.jpg
   - User: 019a0a13-78af-7195-ba52-5d5f9f816eb4
   - Path: /
   - Type: jpg
   - Has file data: true
   - File data length: 50000 chars
📁 Creating directory: ./uploads/019a0a13-78af-7195-ba52-5d5f9f816eb4/
🔢 Decoded base64 length: 37500
📦 File bytes: 28125 bytes
✅ File saved to disk: ./uploads/019a0a13-78af-7195-ba52-5d5f9f816eb4/test.jpg
✅ File verified on disk: 28125 bytes
✅ Database record created: 019a0a14-xxxx-xxxx-xxxx-xxxxxxxxxxxx
💾 Attempting to store image in database...
✅ Image data stored in database for preview (28125 bytes)
```

#### ❌ Problem Scenarios:

**Scenario A: No fileData received**
```
📤 Upload starting for: test.jpg
   - Has file data: false
⚠️ WARNING: No fileData provided! File will NOT be saved to disk.
✅ Database record created: 019a0a14-xxxx-xxxx-xxxx-xxxxxxxxxxxx
⚠️ No fileData provided - image NOT stored in database!
```
**Issue:** Frontend not sending image data
**Fix:** Check frontend `FileUpload.vue` is reading file as base64

---

**Scenario B: Permission denied**
```
📤 Upload starting for: test.jpg
   - Has file data: true
📁 Creating directory: ./uploads/...
❌ Error saving file to disk: PermissionDenied: ...
```
**Issue:** Deno doesn't have write permissions
**Fix:** Restart backend with `--allow-all` flag

---

**Scenario C: Database storage fails**
```
✅ File saved to disk: ./uploads/.../test.jpg
✅ Database record created: 019a0a14-xxxx-xxxx-xxxx-xxxxxxxxxxxx
💾 Attempting to store image in database...
❌ Failed to store image in database: Error: ...
```
**Issue:** MongoDB storage error
**Fix:** Check MongoDB connection

---

### Step 2: Check If Files Exist on Disk

**Look for the uploads folder in your BACKEND directory:**

```powershell
# Navigate to backend folder (where server.ts is)
cd path\to\TEPKonjacBackEnd

# Check if uploads folder exists
dir uploads

# Should see user folders like:
# 019a0a13-78af-7195-ba52-5d5f9f816eb4\
```

---

### Step 3: Check Database Content

**After uploading, check MongoDB:**

```javascript
// Using MongoDB shell or Compass
db.getCollection('MediaStorage.storedImages').find({})

// Should show:
{
  _id: "...",
  mediaId: "019a0a14-...",
  imageData: "iVBORw0KGgo...",  ← Base64 data
  mimeType: "image/jpeg",
  size: 28125,
  uploadDate: ISODate("2025-10-27...")
}
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "No fileData" in console
**Cause:** Frontend not sending image data

**Fix in `src/components/FileUpload.vue`:**
```javascript
// Line 71 - Make sure this is correct:
fileData: previewUrl.value  // Should be base64 data URL
```

**Verify `previewUrl.value` contains:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...
```

---

### Issue 2: Permission denied creating directory
**Cause:** Backend lacks write permissions

**Fix:**
```powershell
# Make sure backend runs with --allow-all
deno run --allow-all server.ts

# Or specific permissions:
deno run --allow-write=./uploads --allow-read --allow-net --allow-env server.ts
```

---

### Issue 3: Database storage fails silently
**Cause:** MediaStorage concept error

**Fix:** Check `concepts/MediaManagement/MediaStorage.ts` exists and is loaded properly

---

## 🧪 Manual Test

### Create Test Upload Script:

```javascript
// test-upload.js in frontend
async function testUpload() {
  // Create a small test image (1x1 red pixel)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 1, 1);

  const base64 = canvas.toDataURL('image/png');
  console.log('Base64 data:', base64.substring(0, 50) + '...');
  console.log('Base64 length:', base64.length);

  const response = await fetch('http://localhost:8000/api/MediaManagement/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test-user-id',
      filePath: '/',
      mediaType: 'png',
      filename: 'test.png',
      relativePath: 'test.png',
      fileData: base64  // ← Make sure this is sent!
    })
  });

  const result = await response.json();
  console.log('Upload result:', result);
}

// Run in browser console
testUpload();
```

---

## 📊 Expected vs Actual

### Working Upload Flow:
```
1. User selects file in FileUpload.vue
   ↓
2. FileReader.readAsDataURL() → base64
   ↓
3. previewUrl.value = base64 data
   ↓
4. uploadFile({ fileData: previewUrl.value })
   ↓
5. Backend receives fileData
   ↓
6. Writes to disk: ./uploads/userId/filename
   ↓
7. Stores in database: MediaStorage.storedImages
   ↓
8. ✅ Both locations have the image!
```

---

## 🔍 What to Check Right Now

**1. Restart backend with this command:**
```powershell
deno run --allow-all server.ts
```

**2. Upload an image**

**3. Watch console output - copy and paste it here!**

**4. Check these locations:**
- **Disk:** Look for `uploads/` folder in backend directory
- **Database:** Check if `MediaStorage.storedImages` collection has data

---

## 💡 Quick Fix If Nothing Works

**Ensure backend has ALL the required files:**
```
concepts/
├── MediaManagement/
│   ├── MediaManagement.ts   ← Must exist
│   └── MediaStorage.ts       ← Must exist (updated version)
```

**Restart backend and try again!**

---

**Next steps:**
1. Restart backend
2. Try uploading
3. Share the console output
4. Check if `uploads/` folder was created in backend directory
