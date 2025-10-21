# 👀 What to Expect After Restarting Backend

## 🎬 Step-by-Step Visual Guide

### Step 1: Restart Backend
```bash
deno run --allow-net --allow-read --allow-sys --allow-env concept_server_with_cors.ts --port 8000 --baseUrl /api
```

**You should see:**
```
Scanning for concepts in ./src/concepts...
- Registering concept: MediaManagement at /api/MediaManagement
  - Endpoint: POST /api/MediaManagement/upload
  - Endpoint: POST /api/MediaManagement/createFolder
  - Endpoint: POST /api/MediaManagement/_listFolders
  ... (more endpoints)
Server listening on http://localhost:8000
```

---

### Step 2: Open Frontend
Go to: http://localhost:5173

**You'll see:**
```
┌────────────────────────────────────────────┐
│                                            │
│         🔐 Welcome to Media Manager        │
│                                            │
│         [   Login   ] [ Sign Up ]          │ ← Toggle tabs
│                                            │
│         Email: [________________]          │
│         Password: [___________]            │
│                                            │
│         [  Login  ]                        │
│                                            │
└────────────────────────────────────────────┘
```

---

### Step 3: Create Account (First Time)
Click **Sign Up** tab:

```
┌────────────────────────────────────────────┐
│         🔐 Welcome to Media Manager        │
│                                            │
│         [  Login  ] [  Sign Up  ]          │ ← Sign Up active
│                                            │
│         Username: [________________]       │
│         Email: [___________________]       │
│         Password: [________________]       │
│                                            │
│         [  Sign Up  ]                      │
│                                            │
└────────────────────────────────────────────┘
```

Fill in:
- Username: `john`
- Email: `john@example.com`
- Password: `password123`

Click **Sign Up** → You'll be logged in automatically!

---

### Step 4: Main Application View
**You should now see:**

```
┌────────────────────────────────────────────────────────────────────┐
│  📁 Media Manager                              Logout | john       │ ← Header
├──────────────┬──────────────────────────────┬──────────────────────┤
│              │                              │                      │
│  📂 Folders  │   Media Files (0)  📤Upload  │   📋 File Details   │
│  ───────────│   ────────────────           │   ─────────────────  │
│              │                              │                      │
│  [📁 New]    │   No media files found.      │   No file selected   │ ← Three panels
│              │   Click "Upload" to add      │                      │
│  Current: /  │   images.                    │                      │
│              │                              │                      │
│  No folders  │                              │                      │
│  found       │                              │                      │
│              │                              │                      │
│              │                              │                      │
├──────────────┴──────────────────────────────┴──────────────────────┤
│  Backend: http://localhost:8000/api                                │
│  Logged in as: john@example.com                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Step 5: Create Your First Folder
Click **📁 New Folder** button:

```
┌──────────────────────────┐
│  Create New Folder       │
│                          │
│  Folder name:            │
│  [________________]      │ ← Type "My Images"
│                          │
│  [Create]  [Cancel]      │
└──────────────────────────┘
```

Type "My Images" and click **Create**

**Result:**
```
┌──────────────┐
│  📂 Folders  │
│  ───────────│
│              │
│  [📁 New]    │
│              │
│  Current: /  │
│              │
│  📁 My Images│ ← NEW! Your folder appears!
│              │
└──────────────┘
```

✅ **SUCCESS!** The folder now shows up!

---

### Step 6: Upload an Image
Click **📤 Upload** button in Media Gallery:

```
┌─────────────────────────────────────┐
│  📤 Upload Image                    │
│                                      │
│  ┌────────────────────────────┐    │
│  │         📁                  │    │
│  │  Click to select image      │    │ ← Click here
│  │  PNG, JPG, JPEG (Max 10MB)  │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

**After selecting a file:**
```
┌─────────────────────────────────────┐
│  📤 Upload Image                    │
│                                      │
│  ┌────────────────────────────┐    │
│  │    [Your Image Preview]     │    │ ← Preview
│  └────────────────────────────┘    │
│                                      │
│  vacation-photo.png                 │ ← File info
│  2456.78 KB                         │
│                                      │
│  ┌──────────┐  ┌──────────┐        │
│  │ ⬆️ Upload│  │ ❌ Cancel│        │ ← Click Upload
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

Click **⬆️ Upload**

**Result:**
```
┌────────────────────────────────────────┐
│  Media Files (1)           📤 Upload  │
│                                        │
│  ┌──────────────────┐                │
│  │ vacation-photo   │                │ ← Your image!
│  │  [Thumbnail]     │                │
│  │  📷 PNG          │                │
│  │  2.4 MB          │                │
│  └──────────────────┘                │
└────────────────────────────────────────┘
```

✅ **SUCCESS!** Your image appears in the gallery!

---

## 🎯 What You Should Be Able to Do

### ✅ Authentication
- [x] Create a new user account
- [x] Log in with email/password
- [x] See your username in the header
- [x] Log out and return to login screen
- [x] Stay logged in after page refresh

### ✅ Folder Management
- [x] Create folders with custom names
- [x] See folders immediately after creation
- [x] Navigate into folders by clicking them
- [x] See current path (e.g., `/`, `/My Images/`)
- [x] Navigate back up using breadcrumbs
- [x] Blocked from creating duplicate folder names

### ✅ File Upload
- [x] Click Upload button to open upload panel
- [x] Select PNG/JPG/JPEG files
- [x] Preview image before uploading
- [x] See file name and size
- [x] Upload successfully
- [x] See uploaded files in gallery
- [x] Cancel selection if needed

---

## 🐛 If Something Doesn't Work

### Folders Still Don't Show
**Check browser console (F12):**
```javascript
📤 Sending createFolder with userId: 019a064b-c751-7714-ae2f-ce3c07930189
📤 Sending listFolders with userId: 019a064b-c751-7714-ae2f-ce3c07930189
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    These MUST be the same!
```

**If userId is different or missing:**
- Clear browser cache and cookies
- Log out and log back in
- Check localStorage: `localStorage.getItem('userId')`

### Upload Button Missing
**Make sure you're logged in:**
- Check footer: Should show `Logged in as: your-email@example.com`
- If not, you're still on the login page

### "Failed to fetch" Errors
**Check backend:**
- Is it running? Look for `Server listening on http://localhost:8000`
- Are you using `concept_server_with_cors.ts`? (Not the old one!)
- Any errors in backend terminal?

**Check frontend:**
- Is it running on http://localhost:5173?
- Browser console showing CORS errors?

---

## 📊 Console Logs to Look For

### ✅ Successful Folder Creation
```
🆕 Creating folder: My Images at path: /
📤 Sending createFolder with userId: 019a064b-c751-7714-ae2f-ce3c07930189
📨 Backend response: {name: "My Images", filePath: "/", _id: "..."}
✅ Folder created! Refreshing list...
📂 Loading media from path: /
📤 Sending listFolders with userId: 019a064b-c751-7714-ae2f-ce3c07930189
📁 Folders received: Array(1)
  0: {name: "My Images", filePath: "/", _id: "..."}
✅ Media loaded. Folders count: 1
🔄 List refreshed!
```

### ✅ Successful Upload
```
📤 Uploading file: vacation-photo.png to path: /
📨 Upload response: {_id: "...", filename: "vacation-photo.png", ...}
✅ File uploaded! Refreshing list...
📂 Loading media from path: /
```

---

## 🎓 Understanding the Fix

### The Problem
```
Frontend sends:     Backend creates:      _listFolders filters by:
userId: "abc123" →  folder.owner = ?   →  owner = undefined  ❌
                    (no user context!)    (returns empty [])
```

### The Solution
```
Frontend sends:     Backend creates:        _listFolders filters by:
userId: "abc123" →  new Concept("abc123") → owner = "abc123"  ✅
                    folder.owner = "abc123"  (returns your folders!)
```

**Now the userId flows through:**
1. Frontend gets userId from `userStore` (logged in user)
2. Includes it in every API request body
3. Backend extracts userId from request
4. Creates concept instance WITH userId
5. Instance uses userId to filter data
6. Returns only YOUR folders/files

---

## 🎉 You Did It!

If you can:
1. ✅ Create a folder and SEE it
2. ✅ Upload an image and SEE it
3. ✅ Log out and log back in

**Then everything is working perfectly!**

Enjoy your new Media Manager application! 🚀
