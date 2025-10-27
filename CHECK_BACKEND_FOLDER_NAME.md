# 🔍 Check Your Backend Folder Name

## The Problem

The backend registers API endpoints based on the **FOLDER NAME**, not the class name.

**Example:**
- If folder is `Rendering/`, endpoints are `/api/Rendering/render`
- If folder is `OutputRender/`, endpoints are `/api/OutputRender/render`
- If folder is `Render/`, endpoints are `/api/Render/render`

---

## 🎯 Quick Check

### **Step 1: Check Your Backend Logs**

When you start your backend, look for this line:

```
- Registering concept: _____ at /api/_____
```

**For rendering, it might say:**
- `- Registering concept: Rendering at /api/Rendering`
- `- Registering concept: OutputRender at /api/OutputRender`
- **Or something else!**

**Copy the exact name you see.**

---

### **Step 2: Update Frontend API Config**

Once you know the folder name, update `src/config/api.js`:

#### **If backend says "Rendering":**
```javascript
// ========== Rendering Concept ==========
RENDER_OUTPUT: '/Rendering/render',
EXPORT_OUTPUT: '/Rendering/export',
GET_OUTPUT_BY_ID: '/Rendering/_getOutputVersionById',
GET_ALL_OUTPUTS: '/Rendering/_getAllOutputVersions',
GET_OUTPUTS_BY_MEDIA: '/Rendering/_getOutputsByMediaId',
SERVE_RENDERED_IMAGE: '/Rendering/_serveRenderedImage',
```

#### **If backend says "OutputRender":**
```javascript
// ========== Rendering Concept ==========
RENDER_OUTPUT: '/OutputRender/render',
EXPORT_OUTPUT: '/OutputRender/export',
GET_OUTPUT_BY_ID: '/OutputRender/_getOutputVersionById',
GET_ALL_OUTPUTS: '/OutputRender/_getAllOutputVersions',
GET_OUTPUTS_BY_MEDIA: '/OutputRender/_getOutputsByMediaId',
SERVE_RENDERED_IMAGE: '/OutputRender/_serveRenderedImage',
```

#### **If backend says something else:**
Replace all instances with the correct name.

---

## 📋 Current Status

**I've already set the frontend to use `/OutputRender/`**

This means I'm expecting your backend to have:
```
your-backend/
└── src/
    └── concepts/
        └── OutputRender/          ← Folder named "OutputRender"
            └── OutputRender.ts     ← Or Rendering.ts (filename doesn't matter as much)
```

---

## 🧪 Quick Test

### **Test Backend Endpoint Directly**

Once your backend is running, open this URL in your browser:

```
http://localhost:8000/api/OutputRender/render
```

**✅ If you see a JSON error message:**
Good! The endpoint exists. The error is just because we're using GET instead of POST.

**❌ If you see "Cannot GET /api/OutputRender/render":**
Wrong folder name. Check backend logs for the correct name.

---

## 🔧 What If Backend Doesn't Show Rendering at All?

If your backend logs DON'T show any "Registering concept: [something for rendering]", then:

### **Option 1: Backend Doesn't Have the Concept**

Copy the file to your backend:

```powershell
# Create the folder (choose one based on what you want)
mkdir C:\path\to\backend\src\concepts\Rendering
# OR
mkdir C:\path\to\backend\src\concepts\OutputRender

# Copy the file
cp concepts\Rendering\Rendering.ts C:\path\to\backend\src\concepts\Rendering\
# OR
cp concepts\Rendering\Rendering.ts C:\path\to\backend\src\concepts\OutputRender\OutputRender.ts
```

**Important:** The filename should match the folder name for consistency:
- `Rendering/Rendering.ts` ✅
- `OutputRender/OutputRender.ts` ✅
- `Rendering/OutputRender.ts` ⚠️ (works but confusing)

### **Option 2: Backend Has It But With a Different Name**

Check all folders in `backend/src/concepts/`:

```powershell
# In your backend folder
ls src\concepts\
```

Look for any folder that might contain rendering logic.

---

## 🎯 Final Steps

1. **Start your backend**
2. **Read the startup logs carefully**
3. **Find the line that mentions rendering** (might say Rendering, OutputRender, or something else)
4. **Update `src/config/api.js`** to match that exact name
5. **Save and test**

---

## 📝 Example Backend Output

Here's what you should look for:

```
Scanning for concepts in ./src/concepts...
- Registering concept: MediaManagement at /api/MediaManagement
  - Endpoint: POST /api/MediaManagement/upload
  ...
- Registering concept: TextExtraction at /api/TextExtraction
  ...
- Registering concept: Translation at /api/Translation
  ...
- Registering concept: OutputRender at /api/OutputRender    ← THIS LINE!
  - Endpoint: POST /api/OutputRender/render                 ← THIS IS THE ONE!
  ...
```

**Copy "OutputRender" from that line and use it in your API config.**

---

## ✅ Verification

After updating the config:

1. **Restart frontend** (or just reload the page)
2. **Try rendering**
3. **Check browser console** - should now show:
   ```
   🎨 Calling render API...
      URL: http://localhost:8000/api/OutputRender/render
      Response status: 200
   ✅ Render API response: { output: {...} }
   ```

No more 404! 🎉

---

## 💡 Why This is Better

**Changing frontend config is better because:**
- ✅ No need to modify backend code
- ✅ No need to copy files to backend
- ✅ Works with existing backend structure
- ✅ Just one file to change (`src/config/api.js`)
- ✅ Easy to adjust if backend changes

**The backend folder name is the source of truth!**

---

**Current Config:** I've set it to `/OutputRender/`
**Action:** Check your backend logs and adjust if needed!
