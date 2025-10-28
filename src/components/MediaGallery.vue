<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import MediaCard from './MediaCard.vue'
import FileUpload from './FileUpload.vue'

const props = defineProps({
  mediaFiles: {
    type: Array,
    required: true
  },
  currentPath: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['fileSelect', 'fileDelete', 'fileMove', 'fileUploaded'])

// Debug: Watch for media files changes
watch(() => props.mediaFiles, (newFiles) => {
  console.log(`📊 MediaGallery received ${newFiles.length} files for path:`, props.currentPath)
  if (newFiles.length > 0) {
    console.log('   Files:')
    newFiles.forEach(f => console.log(`     - ${f.filename} (path: ${f.filePath})`))
  }
}, { immediate: true })

const selectedFileId = ref(null)
const showUpload = ref(false)

const handleFileSelect = (file) => {
  selectedFileId.value = file._id
  // Pass the selected file data UP to parent
  emit('fileSelect', file)
}

const handleFileDelete = async (fileId) => {
  // Pass delete request UP to parent
  emit('fileDelete', fileId)
  // Clear selection if deleted file was selected
  if (selectedFileId.value === fileId) {
    selectedFileId.value = null
  }
}

const handleFileMove = (moveData) => {
  // Pass move request UP to parent
  emit('fileMove', moveData)
}

const handleFileUploaded = (fileData) => {
  showUpload.value = false
  emit('fileUploaded', fileData)
}

const toggleUpload = () => {
  showUpload.value = !showUpload.value
}
</script>

<template>
  <div class="media-gallery">
    <div class="gallery-header">
      <h2>Media Files ({{ mediaFiles.length }})</h2>
      <button @click="toggleUpload" class="btn-upload-toggle">
        {{ showUpload ? '❌ Close' : '📤 Upload' }}
      </button>
    </div>

    <FileUpload
      v-if="showUpload"
      :current-path="currentPath"
      @file-uploaded="handleFileUploaded"
      class="upload-section"
    />

    <div v-if="mediaFiles.length === 0 && !showUpload" class="empty">
      No media files found. Click "Upload" to add images.
    </div>

    <div v-else class="gallery-grid">
      <MediaCard
        v-for="file in mediaFiles"
        :key="file._id"
        :media-file="file"
        :selected="file._id === selectedFileId"
        @select="handleFileSelect"
        @delete="handleFileDelete"
        @move="handleFileMove"
      />
    </div>
  </div>
</template>

<style scoped>
.media-gallery {
  padding: 2rem;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--soft-blue);
}

h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-blue);
}

.btn-upload-toggle {
  background: var(--primary-blue);
  color: white;
  border: none;
}

.btn-upload-toggle:hover {
  background: var(--navy-blue);
  transform: translateY(-2px);
}

.upload-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--soft-blue);
  border-radius: 16px;
  border: 2px solid var(--primary-blue);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.empty {
  text-align: center;
  color: var(--navy-blue);
  padding: 3rem;
  font-size: 1.1em;
  font-weight: 600;
  background: var(--light-gray);
  border-radius: 16px;
  border: 2px dashed var(--primary-blue);
}
</style>
