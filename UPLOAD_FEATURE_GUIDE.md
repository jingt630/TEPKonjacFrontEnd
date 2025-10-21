# 📤 Image Upload Feature Guide

## How to Upload Images

### Step 1: Open Upload Panel
1. Navigate to your media gallery (main page after login)
2. Click the **📤 Upload** button in the top-right of the Media Gallery section

### Step 2: Select Image
- Click the upload area to browse files
- Or drag & drop an image directly into the area

**Supported formats:**
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)

**Max file size:** 10MB

### Step 3: Preview & Confirm
- You'll see a preview of your image
- File name and size are displayed
- Click **⬆️ Upload** to proceed
- Or click **❌ Cancel** to select a different file

### Step 4: Upload Complete
- The upload panel closes automatically
- Your media gallery refreshes
- The new image appears in the gallery

---

## 📸 Visual Guide

```
┌─────────────────────────────────────┐
│  Media Files (0)       📤 Upload   │ ← Click this button
└─────────────────────────────────────┘

              ↓

┌─────────────────────────────────────┐
│  📤 Upload Image                    │
│                                      │
│  ┌────────────────────────────┐    │
│  │         📁                  │    │ ← Click to select file
│  │  Click to select image      │    │
│  │  PNG, JPG, JPEG (Max 10MB)  │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘

              ↓

┌─────────────────────────────────────┐
│  📤 Upload Image                    │
│                                      │
│  ┌────────────────────────────┐    │
│  │    [Image Preview Here]     │    │
│  └────────────────────────────┘    │
│                                      │
│  my-image.png                       │
│  1234.56 KB                         │
│                                      │
│  ┌──────────┐  ┌──────────┐        │
│  │ ⬆️ Upload│  │ ❌ Cancel│        │ ← Upload or cancel
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘

              ↓

┌─────────────────────────────────────┐
│  Media Files (1)       📤 Upload   │
│                                      │
│  ┌────────────────┐                │
│  │  my-image.png  │                │ ← Your uploaded image!
│  │  [Thumbnail]   │                │
│  └────────────────┘                │
└─────────────────────────────────────┘
```

---

## 🎯 Features

### File Validation
- ✅ Only accepts image files (PNG, JPG, JPEG)
- ✅ Blocks files larger than 10MB
- ✅ Shows clear error messages if validation fails

### Preview
- 🖼️ See your image before uploading
- 📝 View file name and size
- 🔄 Change selection before committing

### Auto-Refresh
- 📋 Gallery updates automatically after upload
- 🔄 No need to refresh the page
- ✨ Smooth user experience

### User-Scoped
- 🔐 Each user's uploads are private
- 👤 Files are automatically associated with your account
- 🗂️ Organized by folder structure

---

## 🐛 Troubleshooting

### "Failed to fetch" error
- ✅ Make sure backend is running: `http://localhost:8000`
- ✅ Check browser console (F12) for CORS errors
- ✅ Verify you're using `concept_server_with_cors.ts`

### Image doesn't appear after upload
- ✅ Check browser console for errors
- ✅ Verify the backend processed the upload (check backend logs)
- ✅ Make sure you're logged in (check footer for your email)

### "Please select a file first" message
- ✅ You clicked Upload without selecting a file
- ✅ Click the upload area to choose an image first

---

## 💡 Tips

1. **Organize with Folders**: Create folders first, then navigate into them before uploading
2. **Batch Upload**: Upload multiple files by repeating the process
3. **Preview Check**: Always preview your image before uploading to ensure it's correct
4. **Size Limit**: If your image is too large, use an image compression tool first

---

## 🔮 Coming Soon

Potential future enhancements:
- Drag & drop support
- Multiple file upload at once
- Progress bar for large files
- Image cropping/editing before upload
- Video support
- PDF support
