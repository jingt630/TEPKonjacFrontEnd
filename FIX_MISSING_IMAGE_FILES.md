# 🔧 Fix: Missing Image Files (Database Record Exists, File Doesn't)

## ❌ **The Problem**

```
Error: NotFound: readfile './uploads/.../Manga1/LionKing.jpg'
```

**What this means:**
- ✅ Database has a record for `LionKing.jpg`
- ❌ The actual image file doesn't exist on disk
- Result: Gallery shows the image, but preview fails

---

## 🔍 **Why This Happens**

### **Most Common Causes:**

1. **Image uploaded before fileData feature was added**
   - Old uploads only created database records
   - Didn't save actual files to disk

2. **Upload failed midway**
   - Database record created ✅
   - File save failed ❌

3. **Backend doesn't have write permissions**
   - Can't create `./uploads/` directory

4. **fileData was null/undefined during upload**
   - Frontend didn't send the base64 data

---

## ✅ **Solution 1: Re-upload the Image (Recommended)**

### **Step 1: Delete the old record**

In your frontend, click the "Delete" button on `LionKing.jpg` in the gallery.

Or, manually delete from MongoDB:
```javascript
// MongoDB Shell or Compass
db.getCollection("MediaManagement.mediaFiles").deleteOne({
  filename: "LionKing.jpg",
  owner: "019a07bf-79e5-7fbc-86c4-e9f265c07fd6"
})
```

### **Step 2: Re-upload with file data**

1. Go to the Manga1 folder in your UI
2. Click "Upload" button
3. Select `LionKing.jpg` again
4. Upload

### **Step 3: Verify in backend logs**

You should see:
```
📤 Upload starting for: LionKing.jpg
   - User: 019a07bf-79e5-7fbc-86c4-e9f265c07fd6
   - Path: /Manga1
   - Type: jpg
   - Has file data: true  ← ✅ Must be true!
   - File data length: 125847 chars
📁 Creating directory: ./uploads/019a07bf.../Manga1
🔢 Decoded base64 length: 94284
📦 File bytes: 94284 bytes
✅ File saved to disk: ./uploads/019a07bf.../Manga1/LionKing.jpg
✅ File verified on disk: 94284 bytes
✅ Database record created: [new-id]
```

### **Step 4: Test preview**

Click on the image in the gallery - it should now display!

---

## ✅ **Solution 2: Bulk Fix All Missing Images**

If you have many images with this problem:

### **Create a cleanup script:**

```typescript
// cleanup-orphaned-records.ts
import { MongoClient } from "npm:mongodb";

const client = new MongoClient(Deno.env.get("MONGODB_URL")!);
await client.connect();
const db = client.db(Deno.env.get("DB_NAME")!);

const mediaFiles = db.collection("MediaManagement.mediaFiles");
const allFiles = await mediaFiles.find({}).toArray();

console.log(`Checking ${allFiles.length} files...`);

let orphanedCount = 0;

for (const file of allFiles) {
  const path = `./uploads/${file.owner}${file.filePath}/${file.filename}`;

  try {
    await Deno.stat(path);
    console.log(`✅ ${file.filename} - File exists`);
  } catch {
    console.log(`❌ ${file.filename} - MISSING (${path})`);
    orphanedCount++;

    // Optionally delete the orphaned record
    // await mediaFiles.deleteOne({ _id: file._id });
  }
}

console.log(`\nFound ${orphanedCount} orphaned database records.`);
```

**Run it:**
```bash
deno run --allow-read --allow-env --allow-net cleanup-orphaned-records.ts
```

---

## ✅ **Solution 3: Verify Upload Flow**

Test that new uploads are saving files correctly:

### **1. Open browser console (F12)**

### **2. Upload a test image**

Watch for these logs:

**Frontend (browser console):**
```
🚀 Starting upload... { path: '/Manga1', filename: 'test.jpg', hasFileData: true }
📤 Uploading file to: /Manga1
✅ Upload successful! Refreshing media list...
```

**Backend (terminal):**
```
📤 Upload starting for: test.jpg
   - Has file data: true
   - File data length: 50000 chars
✅ File saved to disk: ./uploads/.../Manga1/test.jpg
✅ File verified on disk: 37500 bytes
```

### **3. Verify file exists**

```bash
# In backend directory
ls -la uploads/019a07bf-79e5-7fbc-86c4-e9f265c07fd6/Manga1/

# Should show:
# test.jpg    37500 bytes
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Has file data: false"**

**Frontend not sending fileData:**

Check `FileUpload.vue`:
```javascript
// Should see this in console:
console.log('hasFileData:', !!previewUrl.value);  // Should be true

// If false, the FileReader failed
reader.onload = (e) => {
  previewUrl.value = e.target.result;  // Should contain base64 data
}
```

**Fix:** Make sure you're selecting an actual image file (jpg, png, etc)

---

### **Issue 2: "Permission denied" when creating directory**

**Backend can't write to disk:**

```bash
# In backend directory
mkdir -p uploads
chmod 755 uploads

# On Windows, make sure the folder isn't read-only
```

---

### **Issue 3: Files exist but wrong location**

**Backend looking in wrong place:**

Backend looks relative to where it's running:
```
C:/Users/jingy/Downloads/concept_backend/
  └── uploads/
      └── {userId}/
          └── {filePath}/
              └── {filename}
```

Make sure backend is running from the correct directory:
```bash
# Must be in backend root
cd C:/Users/jingy/Downloads/concept_backend
deno run --allow-net --allow-read --allow-write --allow-env src/concept_server.ts
```

---

### **Issue 4: "File too large"**

**Image exceeds size limits:**

If you see "Maximum call stack size exceeded", the image is too large.

**Fix:** Resize the image:
```bash
# Use online tool: https://www.iloveimg.com/resize-image
# Or ImageMagick:
magick input.jpg -resize 1024x1024\> -quality 85 output.jpg
```

---

## 📋 **Quick Diagnostic Checklist**

When upload fails:

- [ ] Check frontend console: `hasFileData: true`?
- [ ] Check backend logs: `Has file data: true`?
- [ ] Check backend logs: `File saved to disk: ...`?
- [ ] Check file exists: `ls uploads/.../file.jpg`?
- [ ] Check permissions: Can backend write to `./uploads/`?
- [ ] Check path: Backend running from correct directory?
- [ ] Check size: Image < 1 MB?

---

## 🎯 **Prevention: Validate Before Upload**

Add this to your frontend to catch issues early:

```javascript
// In FileUpload.vue
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('❌ Please select an image file')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ File too large. Max size: 5MB')
    return
  }

  selectedFile.value = file

  // Read file
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    console.log('✅ File read successfully:', {
      name: file.name,
      size: file.size,
      type: file.type,
      dataLength: e.target.result.length
    })
  }
  reader.onerror = (e) => {
    console.error('❌ FileReader error:', e)
    alert('Failed to read file')
  }
  reader.readAsDataURL(file)
}
```

---

## 🎉 **Summary**

**Quick fix for LionKing.jpg:**
1. Delete the old database record
2. Re-upload the image through the UI
3. Verify it appears in gallery AND preview works

**For future uploads:**
- Frontend is correctly sending `fileData` ✅
- Backend is correctly saving files ✅
- Just need to re-upload old files that are missing

**Your code is correct!** The issue is just with files uploaded before the storage feature was fully implemented.

---

**Ready to re-upload! 🚀**
