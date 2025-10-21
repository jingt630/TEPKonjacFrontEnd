# Visual Data Flow Examples

This document shows concrete examples of how data flows through the application.

## 🎬 Scenario 1: User Selects a File

```
USER ACTION: Clicks on a media card
│
├─ Component: MediaCard.vue
│  ├─ Event: @click triggered
│  └─ Action: emit('select', props.mediaFile)
│
↑ EVENT BUBBLES UP (Child → Parent)
│
├─ Component: MediaGallery.vue
│  ├─ Receives: @select="handleFileSelect"
│  ├─ Action: selectedFileId.value = file._id
│  └─ Re-emits: emit('fileSelect', file)
│
↑ EVENT BUBBLES UP (Child → Parent)
│
├─ Component: App.vue
│  ├─ Receives: @file-select="handleFileSelect"
│  ├─ Action: selectedFile.value = file
│  │
│  ↓ PROP PASSES DOWN (Parent → Child)
│  │
│  └─ Component: MediaDetails.vue
│     ├─ Receives: :media-file="selectedFile"
│     └─ Displays: File details automatically update!
│
RESULT: Details panel shows selected file (NO PAGE REFRESH!)
```

## 🗑️ Scenario 2: User Deletes a File

```
USER ACTION: Clicks "Delete" button
│
├─ Component: MediaCard.vue
│  ├─ Event: @click on delete button
│  ├─ Confirm: if (confirm('Delete?'))
│  └─ Action: emit('delete', props.mediaFile._id)
│
↑ EVENT WITH DATA (fileId)
│
├─ Component: MediaGallery.vue
│  ├─ Receives: @delete="handleFileDelete"
│  └─ Re-emits: emit('fileDelete', fileId)
│
↑ EVENT WITH DATA (fileId)
│
├─ Component: App.vue
│  ├─ Receives: @file-delete="handleFileDelete"
│  ├─ Async Action:
│  │  const result = await deleteFile(fileId)
│  │  │
│  │  ↓ HTTP REQUEST
│  │  │
│  │  Backend: DELETE http://localhost:8000/api/media/123
│  │  MongoDB: Remove document
│  │  Backend: Response { success: true }
│  │  │
│  │  ↑ HTTP RESPONSE
│  │
│  ├─ Update State:
│  │  if (selectedFile.value?._id === fileId) {
│  │    selectedFile.value = null  ← REACTIVE UPDATE
│  │  }
│  │
│  ↓ AUTOMATIC RE-RENDER (Vue Reactivity)
│  │
│  ├─ Component: MediaGallery.vue
│  │  └─ Props updated: :media-files (now missing deleted file)
│  │
│  └─ Component: MediaDetails.vue
│     └─ Props updated: :media-file="null"
│
RESULT: Card disappears, details clear (NO PAGE REFRESH!)
```

## 📁 Scenario 3: User Creates a Folder

```
USER ACTION: Clicks "New Folder" button
│
├─ Component: FolderBrowser.vue
│  ├─ Event: @click="handleCreateFolder"
│  ├─ User Input: const name = prompt('Enter name:')
│  └─ Action: emit('createFolder', name)
│
↑ EVENT WITH DATA (folder name)
│
├─ Component: App.vue
│  ├─ Receives: @create-folder="handleCreateFolder"
│  ├─ Async Action:
│  │  const result = await createFolderAction(folderName)
│  │  │
│  │  ↓ Composable: useMedia.js
│  │  │
│  │  ├─ Action: createFolder(name, currentPath.value)
│  │  │
│  │  │  ↓ HTTP REQUEST
│  │  │
│  │  Backend: POST http://localhost:8000/api/folders
│  │  Body: { filePath: '/', name: 'My Folder' }
│  │  MongoDB: Insert new folder document
│  │  Backend: Response { _id: '...', name: 'My Folder', ... }
│  │  │
│  │  │  ↑ HTTP RESPONSE
│  │  │
│  │  ├─ Action: await loadMedia()  ← Refresh data
│  │  │
│  │  │  ↓ HTTP REQUEST
│  │  │
│  │  Backend: GET http://localhost:8000/api/folders?filePath=/
│  │  Backend: Response [{ ...all folders... }]
│  │  │
│  │  │  ↑ HTTP RESPONSE
│  │  │
│  │  └─ Update State:
│  │     folders.value = [new data from backend]  ← REACTIVE
│  │
│  ↓ AUTOMATIC RE-RENDER
│  │
│  └─ Component: FolderBrowser.vue
│     ├─ Props updated: :folders (now includes new folder)
│     └─ Template: v-for creates new folder item
│
RESULT: New folder appears in list (NO PAGE REFRESH!)
```

## 🔄 Scenario 4: Component Updates Translation

```
USER ACTION: Clicks "Update" in MediaDetails
│
├─ Component: MediaDetails.vue
│  ├─ Event: @click="handleUpdateTranslation"
│  ├─ User Input: const text = prompt('Enter JSON:')
│  ├─ Parse: translationObj = JSON.parse(text)
│  └─ Action: emit('updateTranslation', {
│                mediaId: props.mediaFile._id,
│                translation: translationObj
│              })
│
↑ EVENT WITH OBJECT DATA
│
├─ Component: App.vue
│  ├─ Receives: @update-translation="handleUpdateTranslation"
│  ├─ Async Action:
│  │  const result = await addTranslatedText(mediaId, translation)
│  │  │
│  │  ↓ HTTP REQUEST
│  │  │
│  │  Backend: PUT http://localhost:8000/api/media/123/translated-text
│  │  Body: { translatedText: { "en": "Hello", "zh": "你好" } }
│  │  MongoDB: Update document
│  │  Backend: Response { success: true }
│  │  │
│  │  ↑ HTTP RESPONSE
│  │
│  ├─ Refresh Data:
│  │  await loadMedia()  ← Get updated data from backend
│  │  │
│  │  Backend: GET http://localhost:8000/api/media?filePath=/
│  │  Backend: Response [{ ...updated files with translations... }]
│  │  │
│  │  mediaFiles.value = [updated data]  ← REACTIVE
│  │
│  ├─ Update Selected:
│  │  const updated = mediaFiles.value.find(f => f._id === mediaId)
│  │  selectedFile.value = updated  ← REACTIVE
│  │
│  ↓ AUTOMATIC RE-RENDER
│  │
│  └─ Component: MediaDetails.vue
│     ├─ Props updated: :media-file (now with translations)
│     └─ Template: Shows new translation data in <pre> tag
│
RESULT: Translation appears instantly (NO PAGE REFRESH!)
```

## 📊 Data State Management

### Local Component State
```javascript
// MediaGallery.vue - only this component cares
const selectedFileId = ref(null)
```

### Shared Parent State
```javascript
// App.vue - shared via props to children
const selectedFile = ref(null)
const mediaFiles = ref([])
const folders = ref([])
```

### Global Store State (Pinia - optional for your app)
```javascript
// stores/mediaStore.js - accessible anywhere
export const useMediaStore = defineStore('media', () => {
  const currentPath = ref('/')
  const uploadQueue = ref([])

  return { currentPath, uploadQueue }
})

// Any component can access:
const store = useMediaStore()
console.log(store.currentPath)
```

## 🎭 Real Code Execution Flow

### When App.vue mounts:

```javascript
// 1. Component created
onMounted(() => {
  loadMedia()  // 2. Call composable method
})

// 3. Composable executes
const loadMedia = async () => {
  loading.value = true  // 4. UI shows loading

  // 5. API calls (parallel)
  const [files, dirs] = await Promise.all([
    mediaApi.listMediaFiles(currentPath.value),  // → Backend
    mediaApi.listFolders(currentPath.value)       // → Backend
  ])

  // 6. Backend responds

  // 7. Update reactive state
  mediaFiles.value = files   // ← Vue detects change
  folders.value = dirs       // ← Vue detects change

  loading.value = false      // ← Vue detects change
}

// 8. Vue's reactivity system triggers re-render
// 9. Template updates with new data
// 10. Child components receive new props
// 11. Child components re-render
// 12. User sees updated UI
```

## 🔍 Behind the Scenes: Vue Reactivity

```javascript
// When you do this:
mediaFiles.value.push(newFile)

// Vue does this automatically:
1. Detects the change (via Proxy)
2. Marks component as "dirty"
3. Schedules re-render in next tick
4. Compares old virtual DOM with new
5. Updates only changed parts of real DOM
6. Triggers child component updates if props changed

// You DON'T have to:
- Manually call render()
- Update DOM directly
- Refresh the page
- Tell Vue what changed
```

## 📝 Summary of Data Movement

| Direction | Mechanism | Example |
|-----------|-----------|---------|
| Parent → Child | Props (`:prop-name`) | `:media-files="mediaFiles"` |
| Child → Parent | Events (`@event-name`) | `@file-delete="handleDelete"` |
| Sibling → Sibling | Via shared parent state | Both get props from App.vue |
| Any → Any | Pinia store | `useMediaStore()` |
| Frontend → Backend | HTTP (fetch/axios) | `fetch('http://localhost:8000/api/...')` |
| Backend → Frontend | HTTP Response | `const data = await response.json()` |
| Data → UI | Vue Reactivity | `ref()` / `reactive()` |

## 🎯 Key Takeaways

1. **Props = Read-only data flowing DOWN** the component tree
2. **Events = Notifications/data flowing UP** the component tree
3. **Reactivity = Automatic UI updates** when data changes
4. **No page refreshes** needed - Vue handles DOM updates
5. **Backend (MongoDB) = Persistent storage** accessed via HTTP
6. **Frontend state = Temporary** (lost on page refresh unless saved to localStorage/backend)

Your instructor wants you to understand **#1-4** in the list above. MongoDB (#5) is separate from this concept.
