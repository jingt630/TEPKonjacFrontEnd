# Component Architecture & Data Flow

This document explains how Vue.js components communicate and manage data in the TEP Konjac frontend, with practical examples.

## 📊 Understanding "Passing and Pushing Data"

**This has NOTHING to do with your MongoDB backend.** It's about how Vue components share data with each other on the frontend.

### The Two Main Patterns:

1. **Props (Parent → Child)** = "Passing data DOWN"
2. **Events (Child → Parent)** = "Pushing data UP"

---

## 🏗️ Component Hierarchy

```
App.vue (Parent)
│
├── FolderBrowser.vue (Child)
│   ├── Receives: folders array, currentPath (via PROPS ↓)
│   └── Sends: 'folderClick', 'createFolder' events (via EMIT ↑)
│
├── MediaGallery.vue (Child)
│   ├── Receives: mediaFiles array (via PROPS ↓)
│   ├── Sends: 'fileSelect', 'fileDelete', 'fileMove' events (via EMIT ↑)
│   └── Contains: MediaCard.vue (Grandchild)
│       ├── Receives: mediaFile object, selected boolean (via PROPS ↓)
│       └── Sends: 'select', 'delete', 'move' events (via EMIT ↑)
│
└── MediaDetails.vue (Child)
    ├── Receives: selectedFile object (via PROPS ↓)
    └── Sends: 'updateContext', 'updateTranslation' events (via EMIT ↑)
```

---

## 🔄 Complete Data Flow Example

### Scenario: User deletes a file

```
1. User clicks "Delete" button in MediaCard component
   └─ MediaCard.vue (Grandchild Level)

2. MediaCard emits 'delete' event with fileId
   │  emit('delete', fileId)
   ↑
3. MediaGallery receives event, handles it, then re-emits
   │  @delete="handleFileDelete"
   │  emit('fileDelete', fileId)
   ↑
4. App.vue receives event and calls API
   │  @file-delete="handleFileDelete"
   │  const result = await deleteFile(fileId)
   ↓
5. API call goes to backend (MongoDB)
   │  fetch('http://localhost:8000/api/media/123', { method: 'DELETE' })
   ↓
6. Backend returns success
   ↓
7. App.vue updates local state
   │  files.value = files.value.filter(f => f._id !== fileId)
   ↓
8. Vue's reactivity system detects change
   ↓
9. Props automatically update
   │  :media-files="mediaFiles" (now without deleted file)
   ↓
10. MediaGallery re-renders (automatically!)
    └─ MediaCard for deleted file disappears from UI
```

**Key Point:** No page refresh! Vue reactively updates the DOM.

---

## 📝 Code Examples

### Example 1: Props (Passing Data Down)

**App.vue (Parent)**
```vue
<script setup>
import { ref } from 'vue'
import MediaGallery from './components/MediaGallery.vue'

const mediaFiles = ref([
  { _id: '1', filename: 'photo.jpg', mediaType: 'jpg' },
  { _id: '2', filename: 'doc.pdf', mediaType: 'pdf' }
])
</script>

<template>
  <!-- PASSING data down to child via props -->
  <MediaGallery :media-files="mediaFiles" />
</template>
```

**MediaGallery.vue (Child)**
```vue
<script setup>
import { defineProps } from 'vue'

// RECEIVING data from parent
const props = defineProps({
  mediaFiles: {
    type: Array,
    required: true
  }
})

// Now can use props.mediaFiles
</script>

<template>
  <div>
    <!-- Loop through received data -->
    <div v-for="file in props.mediaFiles" :key="file._id">
      {{ file.filename }}
    </div>
  </div>
</template>
```

### Example 2: Events (Pushing Data Up)

**MediaCard.vue (Child)**
```vue
<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  mediaFile: Object
})

// Declare events this component can emit
const emit = defineEmits(['select', 'delete'])

const handleClick = () => {
  // PUSH data UP to parent
  emit('select', props.mediaFile)
}

const handleDelete = () => {
  // PUSH just the ID UP to parent
  emit('delete', props.mediaFile._id)
}
</script>

<template>
  <div @click="handleClick">
    <h3>{{ mediaFile.filename }}</h3>
    <button @click.stop="handleDelete">Delete</button>
  </div>
</template>
```

**MediaGallery.vue (Parent)**
```vue
<script setup>
import MediaCard from './MediaCard.vue'

// RECEIVING events from child
const handleFileSelect = (file) => {
  console.log('Child sent us:', file)
}

const handleFileDelete = (fileId) => {
  console.log('Child wants to delete:', fileId)
  // Make API call here...
}
</script>

<template>
  <!-- LISTENING for events from child -->
  <MediaCard
    v-for="file in mediaFiles"
    :key="file._id"
    :media-file="file"
    @select="handleFileSelect"
    @delete="handleFileDelete"
  />
</template>
```

---

## 🎯 Reactivity Example

### What "Reactive" Means

```vue
<script setup>
import { ref } from 'vue'

// Create reactive data
const count = ref(0)
const files = ref([])

// When you modify reactive data...
const addFile = () => {
  files.value.push({ id: 1, name: 'new.jpg' })
  // ↑ Vue AUTOMATICALLY updates the UI
  // NO manual DOM manipulation
  // NO page refresh
}

const increment = () => {
  count.value++
  // ↑ Button text updates INSTANTLY
}
</script>

<template>
  <!-- These update automatically when data changes -->
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>

  <div v-for="file in files" :key="file.id">
    {{ file.name }}
  </div>
  <button @click="addFile">Add File</button>
</template>
```

**Without Reactivity (old way):**
```javascript
// You'd have to manually update the DOM
document.getElementById('count').textContent = count
```

**With Vue Reactivity (modern way):**
```javascript
count.value++  // Vue handles DOM updates automatically!
```

---

## 🗄️ Shared State (Pinia Store)

When multiple components need the same data but aren't parent-child:

```javascript
// stores/mediaStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMediaStore = defineStore('media', () => {
  // Shared state
  const currentFile = ref(null)
  const selectedFolder = ref('/')

  // Shared actions
  function selectFile(file) {
    currentFile.value = file
  }

  function navigateToFolder(path) {
    selectedFolder.value = path
  }

  return {
    currentFile,
    selectedFolder,
    selectFile,
    navigateToFolder
  }
})
```

**Any component can access this:**

```vue
<!-- Component A -->
<script setup>
import { useMediaStore } from '@/stores/mediaStore'

const store = useMediaStore()

const handleClick = () => {
  store.selectFile(someFile)
}
</script>

<!-- Component B (completely separate) -->
<script setup>
import { useMediaStore } from '@/stores/mediaStore'

const store = useMediaStore()
// Automatically updates when Component A changes it!
</script>

<template>
  <div v-if="store.currentFile">
    {{ store.currentFile.filename }}
  </div>
</template>
```

---

## 🔄 Your Backend's Role

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue.js)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Components communicate via Props & Events              │
│  (This is what the instruction is about!)               │
│                                                         │
│  App.vue → FolderBrowser → MediaGallery → MediaCard    │
│     ↓ props              ↑ events                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    API Service Layer                    │
│             (src/services/mediaApi.js)                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ HTTP Requests (fetch)
                         ↓
┌─────────────────────────────────────────────────────────┐
│              BACKEND (http://localhost:8000)            │
├─────────────────────────────────────────────────────────┤
│                   Your Express/FastAPI                  │
│                        Routes                           │
├─────────────────────────────────────────────────────────┤
│                       MongoDB                           │
│                   (Persistent Storage)                  │
└─────────────────────────────────────────────────────────┘
```

**The instruction is ONLY about the Frontend box!**

---

## ✅ Separation of Concerns

Each component manages its own responsibilities:

| Component | Responsibility | State It Manages |
|-----------|---------------|------------------|
| `App.vue` | Orchestration, API calls | `selectedFile`, backend data fetching |
| `FolderBrowser.vue` | Display folders | None (receives via props) |
| `MediaGallery.vue` | Display files, handle selection | `selectedFileId` (which is selected) |
| `MediaCard.vue` | Display single file | None (pure presentation) |
| `MediaDetails.vue` | Show file details | None (receives via props) |
| `useMedia.js` (composable) | API interaction, loading state | `loading`, `error`, API methods |

---

## 📋 Summary

### What "Passing and Pushing Data" Means:

1. **Props (↓)** - Parent gives data to child
   ```vue
   <ChildComponent :data="myData" />
   ```

2. **Events (↑)** - Child sends data/signals to parent
   ```vue
   <!-- Child: -->
   emit('myEvent', data)

   <!-- Parent: -->
   <ChildComponent @my-event="handleEvent" />
   ```

3. **Reactivity** - UI updates automatically when data changes
   ```javascript
   files.value.push(newFile)  // UI updates instantly!
   ```

4. **Shared State** - Multiple components access same data via Pinia
   ```javascript
   const store = useMediaStore()
   store.currentFile  // Same in all components
   ```

### Your MongoDB backend:
- Is the **source of truth** for persistent data
- Responds to HTTP requests from the frontend
- **Has nothing to do with component communication**

The instruction is asking you to structure your Vue components so they communicate cleanly with each other using props and events, and the UI updates reactively without page refreshes.
