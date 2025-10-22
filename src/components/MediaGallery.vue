<script setup>
import { ref, defineProps, defineEmits } from 'vue'
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
  padding: 1rem;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  margin: 0;
}

.btn-upload-toggle {
  background: #4ade80;
}

.btn-upload-toggle:hover {
  background: #3bc76a;
}

.upload-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(100, 108, 255, 0.05);
  border-radius: 12px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.empty {
  text-align: center;
  color: #888;
  padding: 3rem;
}
</style>
