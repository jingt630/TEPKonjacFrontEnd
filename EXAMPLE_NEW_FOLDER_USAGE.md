# Example: Using the New Folder Button

## 🎯 User Experience Flow

### Visual Flow:
```
┌─────────────────────────────────────────┐
│     TEP Konjac - Media Management      │
│                                         │
│  📂 Current Path: /                     │
│  [Refresh]                              │
└─────────────────────────────────────────┘

┌──────────────┬──────────────┬───────────┐
│   FOLDERS    │ MEDIA FILES  │  DETAILS  │
│              │              │           │
│  Folders     │              │           │
│  [+New Folder]│             │           │
│              │              │           │
│  📁 Photos   │              │           │
│  📁 Videos   │              │           │
│              │              │           │
│  ← Click this button                    │
└──────────────┴──────────────┴───────────┘
```

### What Happens When You Click:

1. **Prompt appears:**
   ```
   ┌────────────────────────────────────┐
   │  Enter folder name:                │
   │  ┌──────────────────────────────┐  │
   │  │ My Documents                  │  │
   │  └──────────────────────────────┘  │
   │            [Cancel] [OK]            │
   └────────────────────────────────────┘
   ```

2. **You type:** "My Documents"

3. **Click OK**

4. **App shows loading state:**
   ```
   ┌──────────────┐
   │   FOLDERS    │
   │              │
   │  Loading...  │
   └──────────────┘
   ```

5. **Folder appears:**
   ```
   ┌──────────────┐
   │   FOLDERS    │
   │  [+New Folder]│
   │              │
   │  📁 Photos   │
   │  📁 Videos   │
   │  📁 My Documents  ← NEW!
   └──────────────┘
   ```

---

## 📝 What Happens Behind the Scenes

### Step 1: User Clicks Button
```javascript
// FolderBrowser.vue - Line 36
<button @click="handleCreateFolder">+ New Folder</button>
```

### Step 2: Prompt Shows
```javascript
// FolderBrowser.vue - Lines 24-29
const handleCreateFolder = () => {
  const name = prompt('Enter folder name:')  // ← Browser prompt
  if (name) {
    emit('createFolder', name)  // ← Send to parent
  }
}
```

### Step 3: Parent Receives Event
```javascript
// App.vue - Lines 42-48
const handleCreateFolder = async (folderName) => {
  const result = await createFolderAction(folderName)

  if (!result.success) {
    alert('Error creating folder: ' + result.error)
  }
}
```

### Step 4: API Call to Backend
```javascript
// useMedia.js - Lines 121-144
const createFolder = async (name, filePath = null) => {
  loading.value = true  // ← Shows "Loading..."

  const result = await mediaApi.createFolder({
    filePath: filePath || currentPath.value,
    name: name
  })

  await loadMedia()  // ← Refresh folder list
  loading.value = false
}
```

### Step 5: HTTP Request
```javascript
// mediaApi.js
POST http://localhost:8000/api/folders
Body: {
  "filePath": "/",
  "name": "My Documents"
}
```

### Step 6: Backend Response
```json
{
  "_id": "abc123",
  "filePath": "/",
  "name": "My Documents",
  "owner": "user123"
}
```

### Step 7: UI Updates (Reactive!)
```javascript
// Vue automatically detects change
folders.value = [
  { name: "Photos", ... },
  { name: "Videos", ... },
  { name: "My Documents", ... }  // ← NEW!
]

// FolderBrowser component re-renders automatically
// No page refresh needed!
```

---

## 🧪 Try It Yourself

### Test Script:

1. **Start your backend:**
   ```bash
   # In your backend directory
   npm start  # or whatever command runs your backend
   ```

2. **Start the frontend:**
   ```bash
   # In TEPKonjacFrontEnd directory
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:5173
   ```

4. **Test the button:**
   ```
   ✓ Click "+ New Folder"
   ✓ Type "Test Folder"
   ✓ Click OK
   ✓ See it appear in the list
   ```

5. **Check the browser console (F12):**
   ```javascript
   // You should see:
   Folder clicked: Test Folder  // From line 35 in App.vue
   ```

6. **Check your MongoDB:**
   ```javascript
   // Your database should now have:
   {
     _id: ObjectId("..."),
     filePath: "/",
     name: "Test Folder",
     owner: "..."
   }
   ```

---

## 🔧 How to Create Your Own Similar Button

Want to create an "Upload File" button? Here's the pattern:

### 1. Add Button to Component:
```vue
<!-- src/components/MediaGallery.vue -->
<template>
  <div class="media-gallery">
    <h2>Media Files</h2>
    <button @click="handleUploadFile">📤 Upload File</button>

    <!-- Your gallery content -->
  </div>
</template>

<script setup>
const emit = defineEmits(['uploadFile'])

const handleUploadFile = () => {
  // For demo, using file input manually
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      emit('uploadFile', {
        filename: file.name,
        mediaType: file.type,
        file: file
      })
    }
  }

  input.click()
}
</script>
```

### 2. Handle Event in Parent:
```vue
<!-- App.vue -->
<template>
  <MediaGallery
    :media-files="mediaFiles"
    @upload-file="handleUploadFile"
  />
</template>

<script setup>
const handleUploadFile = async (fileData) => {
  const result = await uploadFile({
    filePath: currentPath.value,
    mediaType: fileData.mediaType,
    filename: fileData.filename,
    relativePath: fileData.file.path
  })

  if (!result.success) {
    alert('Error uploading file: ' + result.error)
  }
}
</script>
```

### 3. Use Composable Method:
```javascript
// Already exists in useMedia.js!
const {
  uploadFile,  // ← Already implemented
  // ... other methods
} = useMedia()
```

---

## 🎮 Interactive Demo Code

Here's a complete minimal example you can run:

```vue
<!-- TestNewFolder.vue - A simple test component -->
<script setup>
import { ref } from 'vue'

const folders = ref(['Photos', 'Videos', 'Documents'])

const createFolder = () => {
  const name = prompt('Enter folder name:')
  if (name) {
    // Add to array (reactive!)
    folders.value.push(name)
    alert(`Created folder: ${name}`)
  }
}

const deleteFolder = (folderName) => {
  if (confirm(`Delete ${folderName}?`)) {
    folders.value = folders.value.filter(f => f !== folderName)
    alert(`Deleted: ${folderName}`)
  }
}
</script>

<template>
  <div class="demo">
    <h2>Folders Demo</h2>

    <button @click="createFolder" class="btn-create">
      + New Folder
    </button>

    <ul>
      <li v-for="folder in folders" :key="folder">
        📁 {{ folder }}
        <button @click="deleteFolder(folder)" class="btn-delete">
          ❌
        </button>
      </li>
    </ul>

    <p v-if="folders.length === 0">
      No folders. Click "+ New Folder" to create one!
    </p>
  </div>
</template>

<style scoped>
.demo {
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 8px;
}

.btn-create {
  background: #646cff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.btn-delete {
  background: #ff6b6b;
  color: white;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
  border-radius: 4px;
}
</style>
```

---

## 📊 Comparison: Before vs After

### Before Clicking Button:
```javascript
// State
folders.value = [
  { _id: '1', name: 'Photos', filePath: '/' },
  { _id: '2', name: 'Videos', filePath: '/' }
]

// UI
📁 Photos
📁 Videos
```

### After Creating "Documents" Folder:
```javascript
// State (automatically updated!)
folders.value = [
  { _id: '1', name: 'Photos', filePath: '/' },
  { _id: '2', name: 'Videos', filePath: '/' },
  { _id: '3', name: 'Documents', filePath: '/' }  // ← NEW!
]

// UI (automatically re-rendered!)
📁 Photos
📁 Videos
📁 Documents  ← NEW!
```

---

## 🐛 Troubleshooting

### Button Doesn't Work?

**Check 1: Is Backend Running?**
```bash
# Backend should be at http://localhost:8000
curl http://localhost:8000/api/folders
```

**Check 2: Check Browser Console (F12)**
```javascript
// Look for errors like:
❌ Failed to fetch
❌ 404 Not Found
❌ CORS error
```

**Check 3: Check Network Tab**
```
POST http://localhost:8000/api/folders
Status: 200 OK  ← Should be this
Status: 404     ← Endpoint not found
Status: 500     ← Backend error
```

### Folder Doesn't Appear?

**Check 1: Did loadMedia() run?**
```javascript
// Add console.log in useMedia.js
const loadMedia = async () => {
  console.log('Loading media...')
  // ... rest of code
  console.log('Loaded folders:', folders.value)
}
```

**Check 2: Check folders prop**
```vue
<!-- FolderBrowser.vue -->
<script setup>
const props = defineProps({
  folders: Array
})

console.log('Folders received:', props.folders)
</script>
```

---

## 💡 Key Takeaways

1. **User clicks button** → Shows prompt
2. **User enters name** → Emits event to parent
3. **Parent calls API** → POST to backend
4. **Backend creates folder** → Saves to MongoDB
5. **Frontend refreshes data** → GET from backend
6. **Vue updates UI** → New folder appears (reactive!)

**No page refresh needed!** That's the power of Vue reactivity! 🎉

---

## 🎯 Next Steps

Try creating similar buttons:
- ✅ "Upload File" button
- ✅ "Delete Folder" button
- ✅ "Rename Folder" button
- ✅ "Move to Folder" button

They all follow the same pattern:
1. Button → User input
2. Emit event → Parent handler
3. API call → Backend
4. Update state → UI refreshes

Follow the "New Folder" example and you'll nail it! 🚀
