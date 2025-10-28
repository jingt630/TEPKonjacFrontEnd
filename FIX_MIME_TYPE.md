# 🔧 Fix MIME Type Issue

## 🐛 The Problem

**Error:** `Unsupported MIME type: image/jpg`

**Cause:**
- Backend stores MIME type as `image/jpg`
- Gemini API only accepts `image/jpeg`

---

## ✅ Solution (2 Fixes)

### **Fix 1: Update `gemini-llm.ts` (Normalize MIME Type)**

**File:** `concept_backend/gemini-llm.ts`

**Add this normalization (around line 45):**

```typescript
mimeType = matches[1];
imageData = matches[2];

// Normalize MIME type: Gemini doesn't accept "image/jpg", only "image/jpeg"
if (mimeType === "image/jpg") {
  mimeType = "image/jpeg";
  console.log(`   ✅ Normalized MIME type: image/jpg → image/jpeg`);
}

console.log(`   Mime type: ${mimeType}`);
```

---

### **Fix 2: Update MediaManagement Upload (Store Correct MIME Type)**

**File:** `concept_backend/src/concepts/MediaManagement/MediaManagement.ts`

**Find this line (around line 152):**

```typescript
if (fileData) {
  const mimeType = `image/${mediaType}`;
  await this.mediaStorage.storeImage({
    userId,
    mediaId: newMediaFile._id,
    imageData: fileData,
    mimeType,
  });
```

**Change it to:**

```typescript
if (fileData) {
  // Normalize mediaType: "jpg" → "jpeg" for proper MIME type
  let normalizedType = mediaType;
  if (mediaType === 'jpg') {
    normalizedType = 'jpeg';
  }

  const mimeType = `image/${normalizedType}`;
  console.log(`💾 Storing image with MIME type: ${mimeType}`);

  await this.mediaStorage.storeImage({
    userId,
    mediaId: newMediaFile._id,
    imageData: fileData,
    mimeType,
  });
```

---

## 🔄 Restart Backend

```powershell
cd C:\Users\jingy\Downloads\concept_backend
deno run --allow-all server.ts
```

---

## 🧪 Test

1. **Upload a new JPG image**
2. **Extract text**

**Expected console:**
```
💾 Storing image with MIME type: image/jpeg
✅ Image data stored in database for preview

🤖 Calling Gemini AI...
📊 Using base64 data directly (from database)
   Mime type: image/jpeg
📤 Sending request to Gemini API...
✅ Gemini API response received
✅ Gemini extraction complete
📝 Found 3 text blocks
```

---

## 📊 MIME Type Reference

### Accepted by Gemini:
- ✅ `image/jpeg` (correct)
- ✅ `image/png`
- ✅ `image/webp`
- ✅ `image/heic`
- ✅ `image/heif`

### NOT Accepted:
- ❌ `image/jpg` (wrong - must be jpeg!)

---

## 🎯 Quick Fix Summary

**Two places to update:**

1. **`gemini-llm.ts`** (line ~47):
   ```typescript
   if (mimeType === "image/jpg") {
     mimeType = "image/jpeg";
   }
   ```

2. **`MediaManagement.ts`** (line ~152):
   ```typescript
   let normalizedType = mediaType === 'jpg' ? 'jpeg' : mediaType;
   const mimeType = `image/${normalizedType}`;
   ```

---

**Make these changes and restart backend!** 🚀

Your updated `FIXED_gemini-llm.ts` already has Fix #1!
