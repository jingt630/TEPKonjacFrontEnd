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
const renderingPanelRef = ref(null)

const handleRenderImage = (mediaFile) => {
  console.log('🎨 Opening rendering panel for:', mediaFile.filename)
  imageToRender.value = mediaFile
  showRenderingPanel.value = true
}

const closeRenderingPanel = () => {
  showRenderingPanel.value = false
  imageToRender.value = null
}

// Handle coordinates changed from ImageEditor
const handleCoordinatesChanged = (mediaId) => {
  console.log('📍 Coordinates changed for media:', mediaId)

  // If rendering panel is open for the same image, trigger auto-render
  if (showRenderingPanel.value && imageToRender.value?._id === mediaId) {
    console.log('🔄 Auto-rendering because RenderingPanel is open for this image...')

    // Wait a bit for extractions to reload, then trigger render
    setTimeout(() => {
      if (renderingPanelRef.value && renderingPanelRef.value.triggerAutoRender) {
        renderingPanelRef.value.triggerAutoRender()
      }
    }, 500)
  }
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
          <img src="/Logo.jpg" alt="TEP Konjac Logo" class="app-logo" />
          <h1>TEP Konjac</h1>
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
        @coordinates-changed="handleCoordinatesChanged"
      />

      <!-- Rendering Panel Modal -->
      <div v-if="showRenderingPanel && imageToRender" class="modal-overlay" @click="closeRenderingPanel">
        <div class="modal-content rendering-modal" @click.stop>
          <div class="modal-header">
            <h2>🎨 Render Text on Image</h2>
            <button @click="closeRenderingPanel" class="btn-close-modal">✖ Close</button>
          </div>
          <RenderingPanel ref="renderingPanelRef" :media-file="imageToRender" />
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
  width: 100vw;
  max-width: 100%;
  background: var(--white);
}

/* Header */
.app-header {
  padding: 2rem 3rem;
  background: linear-gradient(135deg, var(--white) 0%, var(--soft-blue) 100%);
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(37, 150, 190, 0.15);
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg,
    var(--primary-blue) 0%,
    var(--accent-yellow) 25%,
    var(--accent-light-green) 50%,
    var(--accent-pink) 75%,
    var(--navy-blue) 100%);
}

.app-header::after {
  content: '◯';
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  font-size: 8em;
  color: var(--primary-blue);
  opacity: 0.05;
  font-weight: bold;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.app-logo {
  height: 45px;
  width: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.25);
  border: 2px solid var(--primary-blue);
  transition: all 0.3s ease;
}

.app-logo:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.4);
}

.app-header h1 {
  margin: 0;
  font-size: 2.8em;
  font-weight: 700;
  font-family: 'Fredoka', 'Quicksand', cursive;
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--navy-blue) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(37, 150, 190, 0.1);
  filter: drop-shadow(0 2px 4px rgba(37, 150, 190, 0.2));
}

.user-badge {
  background: var(--primary-blue);
  color: white;
  padding: 0.65rem 1.5rem;
  border-radius: 50px;
  font-size: 1em;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.3);
}

.header-info {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.current-path {
  font-family: 'Quicksand', sans-serif;
  color: var(--navy-blue);
  font-size: 1em;
  font-weight: 600;
  background: var(--soft-blue);
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
}

/* Error Banner */
.error-banner {
  background: var(--accent-red);
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  font-size: 1em;
  border-bottom: 2px solid var(--accent-dark);
}

/* Main Content - Three Column Layout */
.main-content {
  display: grid;
  grid-template-columns: 300px 1fr 500px;
  gap: 2rem;
  padding: 2rem 3rem;
  flex: 1;
  overflow: hidden;
  max-width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.sidebar,
.details-panel {
  background: var(--white);
  border-radius: 16px;
  overflow-y: auto;
  padding: 0.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--soft-blue);
}

.sidebar {
  min-width: 300px;
}

.details-panel {
  min-width: 500px;
  display: flex;
  flex-direction: column;
}

.gallery-section {
  background: var(--white);
  border-radius: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--soft-blue);
}

/* Footer */
.app-footer {
  padding: 1.2rem 2rem;
  background: var(--navy-blue);
  border-top: 2px solid var(--primary-blue);
  text-align: center;
  color: white;
  font-size: 0.9em;
  font-weight: 500;
}

.app-footer p {
  margin: 0.3rem 0;
}

/* Buttons */
button {
  border-radius: 50px;
  border: 2px solid transparent;
  padding: 0.7em 1.5em;
  font-size: 1em;
  font-weight: 600;
  font-family: 'Quicksand', sans-serif;
  background-color: var(--primary-blue);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.2);
}

button:hover:not(:disabled) {
  background-color: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.3);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-logout {
  background-color: var(--accent-red);
}

.btn-logout:hover {
  background-color: #a00e16;
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.3);
}

/* Modal Overlay for Rendering Panel */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 100, 177, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(8px);
}

.modal-content.rendering-modal {
  background: var(--white);
  border-radius: 20px;
  width: 100%;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--primary-blue);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid var(--soft-blue);
  background: var(--white);
  border-radius: 18px 18px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: var(--primary-blue);
  font-size: 1.8em;
  font-weight: 700;
  font-family: 'Fredoka', 'Quicksand', cursive;
}

.btn-close-modal {
  background: var(--accent-red);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(205, 19, 27, 0.3);
}

.btn-close-modal:hover {
  background: #a00e16;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.4);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 250px 1fr 420px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 220px 1fr 380px;
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
