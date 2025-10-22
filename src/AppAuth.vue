<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from './stores/userStore'
import { useMedia } from './composables/useMedia'
import AuthView from './components/AuthView.vue'
import FolderBrowser from './components/FolderBrowser.vue'
import MediaGallery from './components/MediaGallery.vue'
import MediaDetails from './components/MediaDetails.vue'
import ImageEditor from './components/ImageEditor.vue'
import RenderingPanel from './components/RenderingPanel.vue'

// User store
const userStore = useUserStore()

// Restore session on mount
onMounted(() => {
  userStore.restoreSession()

  // If logged in, load media
  if (userStore.isAuthenticated) {
    loadMedia()
  }
})

// Watch for userId changes and reload media
// This ensures data is cleared when switching users
watch(() => userStore.userId, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    console.log('🔄 User changed, reloading media for userId:', newUserId)
    currentPath.value = '/'
    selectedFile.value = null
    loadMedia()
  }
})

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

// ===== HANDLING EVENTS FROM CHILD COMPONENTS =====

// Handle folder click from FolderBrowser component
const handleFolderClick = (folder) => {
  console.log('📁 Folder clicked:', folder.name)
  console.log('   - Current filePath:', folder.filePath)

  // Build new path, avoiding double slashes
  let newPath = folder.filePath
  if (!newPath.endsWith('/')) {
    newPath += '/'
  }
  newPath += folder.name

  // Normalize path (remove double slashes)
  newPath = newPath.replace(/\/+/g, '/')

  console.log('   - New path:', newPath)
  currentPath.value = newPath
  loadMedia()
}

// Handle navigation to specific path
const handleNavigateTo = (path) => {
  console.log('Navigating to:', path)
  currentPath.value = path
  loadMedia()
}

// Handle create folder from FolderBrowser component
const handleCreateFolder = async (folderName) => {
  const result = await createFolderAction(folderName)

  if (!result.success) {
    alert('❌ Error creating folder: ' + result.error)
  } else {
    console.log('✅ Folder created successfully!', result.data)
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

// Handle edit image from MediaDetails component
const showImageEditor = ref(false)
const imageToEdit = ref(null)

const handleEditImage = (mediaFile) => {
  console.log('📝 Opening image editor for:', mediaFile.filename)
  imageToEdit.value = mediaFile
  showImageEditor.value = true
}

const closeImageEditor = () => {
  showImageEditor.value = false
  imageToEdit.value = null
  // Reload media to get any updates
  loadMedia()
}

// Handle render image from MediaDetails component
const showRenderingPanel = ref(false)
const imageToRender = ref(null)

const handleRenderImage = (mediaFile) => {
  console.log('🎨 Opening rendering panel for:', mediaFile.filename)
  imageToRender.value = mediaFile
  showRenderingPanel.value = true
}

const closeRenderingPanel = () => {
  showRenderingPanel.value = false
  imageToRender.value = null
}

// Handle file upload from MediaGallery component
const handleFileUpload = async (fileData) => {
  console.log('✅ File uploaded:', fileData)
  // The uploadFile in composable already calls loadMedia()
  // But let's ensure it's refreshed in case of any timing issues
  console.log('🔄 Parent component ensuring refresh...')
  await loadMedia()
  console.log('✅ Parent refresh complete. Files:', mediaFiles.value.length, 'Folders:', folders.value.length)
}

// Handle logout
const handleLogout = () => {
  if (confirm('Are you sure you want to log out?')) {
    userStore.logout()
    selectedFile.value = null
  }
}
</script>

<template>
  <div class="app">
    <!-- Show Auth View if not logged in -->
    <AuthView v-if="!userStore.isAuthenticated" />

    <!-- Show Main App if logged in -->
    <template v-else>
      <header class="app-header">
        <div class="header-left">
          <h1>🖼️ TEP Konjac</h1>
          <span class="user-badge">👤 {{ userStore.username || userStore.email || 'User' }}</span>
        </div>
        <div class="header-info">
          <span class="current-path">📂 {{ currentPath || '/' }}</span>
          <button @click="loadMedia" class="btn-refresh" :disabled="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <button @click="handleLogout" class="btn-logout">
            🚪 Logout
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
            @navigate-to="handleNavigateTo"
          />
        </aside>

        <!-- Center: Media Gallery -->
        <main class="gallery-section">
          <MediaGallery
            :media-files="mediaFiles"
            :current-path="currentPath"
            @file-select="handleFileSelect"
            @file-delete="handleFileDelete"
            @file-move="handleFileMove"
            @file-uploaded="handleFileUpload"
          />
        </main>

        <!-- Right Sidebar: File Details -->
        <aside class="details-panel">
          <MediaDetails
            :media-file="selectedFile"
            @edit-image="handleEditImage"
            @render-image="handleRenderImage"
          />
        </aside>
      </div>

      <footer class="app-footer">
        <p><strong>Backend:</strong> http://localhost:8000/api</p>
        <p><strong>Logged in as:</strong> {{ userStore.email }}</p>
      </footer>

      <!-- Image Editor Modal -->
      <ImageEditor
        v-if="showImageEditor && imageToEdit"
        :media-file="imageToEdit"
        @close="closeImageEditor"
      />

      <!-- Rendering Panel Modal -->
      <div v-if="showRenderingPanel && imageToRender" class="modal-overlay" @click="closeRenderingPanel">
        <div class="modal-content rendering-modal" @click.stop>
          <div class="modal-header">
            <h2>🎨 Render Text on Image</h2>
            <button @click="closeRenderingPanel" class="btn-close-modal">✖ Close</button>
          </div>
          <RenderingPanel :media-file="imageToRender" />
        </div>
      </div>
    </template>
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
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em;
}

.user-badge {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
}

.header-info {
  display: flex;
  gap: 1rem;
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

.btn-logout {
  background-color: #ff6b6b;
}

.btn-logout:hover {
  background-color: #ee5a52;
}

/* Modal Overlay for Rendering Panel */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-content.rendering-modal {
  background: #1a1a1a;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.modal-header h2 {
  margin: 0;
  color: #f59e0b;
  font-size: 1.5em;
}

.btn-close-modal {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: #ee5a52;
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

  .modal-overlay {
    padding: 1rem;
  }

  .modal-content.rendering-modal {
    max-width: 100%;
    max-height: 95vh;
  }
}
</style>
