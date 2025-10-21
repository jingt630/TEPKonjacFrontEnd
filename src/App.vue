<script setup>
import { ref, onMounted } from 'vue'
import { useMedia } from './composables/useMedia'
import FolderBrowser from './components/FolderBrowser.vue'
import MediaGallery from './components/MediaGallery.vue'
import MediaDetails from './components/MediaDetails.vue'

// Use the media composable for state and methods
const {
  mediaFiles,
  folders,
  currentPath,
  loading,
  error,
  loadMedia,
  createFolder: createFolderAction,
  deleteFile,
  moveFile,
  updateContext,
  addTranslatedText
} = useMedia()

// Local state for selected file
const selectedFile = ref(null)

// Load media on component mount
onMounted(() => {
  loadMedia()
})

// ===== HANDLING EVENTS FROM CHILD COMPONENTS =====

// Handle folder click from FolderBrowser component
const handleFolderClick = (folder) => {
  console.log('Folder clicked:', folder.name)
  // TODO: Navigate to folder
  currentPath.value = folder.filePath + '/' + folder.name
  loadMedia()
}

// Handle create folder from FolderBrowser component
const handleCreateFolder = async (folderName) => {
  const result = await createFolderAction(folderName)

  if (!result.success) {
    alert('Error creating folder: ' + result.error)
  }
}

// Handle file selection from MediaGallery component
const handleFileSelect = (file) => {
  console.log('File selected:', file.filename)
  selectedFile.value = file
}

// Handle file deletion from MediaGallery component
const handleFileDelete = async (fileId) => {
  const result = await deleteFile(fileId)

  if (result.success) {
    // Clear selection if the deleted file was selected
    if (selectedFile.value?._id === fileId) {
      selectedFile.value = null
    }
  } else {
    alert('Error deleting file: ' + result.error)
  }
}

// Handle file move from MediaGallery component
const handleFileMove = async ({ id, newPath }) => {
  const result = await moveFile(id, newPath)

  if (!result.success) {
    alert('Error moving file: ' + result.error)
  }
}

// Handle context update from MediaDetails component
const handleUpdateContext = async ({ mediaId, context }) => {
  const result = await updateContext(mediaId, context)

  if (result.success) {
    // Update the selected file to show new context
    await loadMedia()
    if (selectedFile.value?._id === mediaId) {
      const updated = mediaFiles.value.find(f => f._id === mediaId)
      if (updated) selectedFile.value = updated
    }
  } else {
    alert('Error updating context: ' + result.error)
  }
}

// Handle translation update from MediaDetails component
const handleUpdateTranslation = async ({ mediaId, translation }) => {
  const result = await addTranslatedText(mediaId, translation)

  if (result.success) {
    // Update the selected file to show new translation
    await loadMedia()
    if (selectedFile.value?._id === mediaId) {
      const updated = mediaFiles.value.find(f => f._id === mediaId)
      if (updated) selectedFile.value = updated
    }
  } else {
    alert('Error updating translation: ' + result.error)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>TEP Konjac - Media Management</h1>
      <div class="header-info">
        <span class="current-path">📂 {{ currentPath || '/' }}</span>
        <button @click="loadMedia" class="btn-refresh" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="main-content">
      <!-- Left Sidebar: Folders -->
      <aside class="sidebar">
        <FolderBrowser
          :folders="folders"
          :current-path="currentPath"
          @folder-click="handleFolderClick"
          @create-folder="handleCreateFolder"
        />
      </aside>

      <!-- Center: Media Gallery -->
      <main class="gallery-section">
        <MediaGallery
          :media-files="mediaFiles"
          @file-select="handleFileSelect"
          @file-delete="handleFileDelete"
          @file-move="handleFileMove"
        />
      </main>

      <!-- Right Sidebar: File Details -->
      <aside class="details-panel">
        <MediaDetails
          :media-file="selectedFile"
          @update-context="handleUpdateContext"
          @update-translation="handleUpdateTranslation"
        />
      </aside>
    </div>

    <footer class="app-footer">
      <p><strong>Backend:</strong> http://localhost:8000/api</p>
      <p><strong>Data Flow:</strong> Components communicate via props ↓ and events ↑</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
}

/* Header */
.app-header {
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8em;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-path {
  font-family: monospace;
  color: #646cff;
  font-size: 1.1em;
}

/* Error Banner */
.error-banner {
  background: #ff6b6b;
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 500;
}

/* Main Content - Three Column Layout */
.main-content {
  display: grid;
  grid-template-columns: 250px 1fr 350px;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
  overflow: hidden;
}

.sidebar,
.details-panel {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  overflow-y: auto;
}

.gallery-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  overflow-y: auto;
}

/* Footer */
.app-footer {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: #888;
  font-size: 0.9em;
}

.app-footer p {
  margin: 0.25rem 0;
}

/* Buttons */
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #646cff;
  color: white;
  cursor: pointer;
  transition: all 0.25s;
}

button:hover:not(:disabled) {
  background-color: #535bf2;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 200px 1fr 300px;
  }
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .details-panel {
    order: 3;
  }
}
</style>
