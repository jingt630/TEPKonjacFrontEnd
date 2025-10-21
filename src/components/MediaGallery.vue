<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import MediaCard from './MediaCard.vue'

const props = defineProps({
  mediaFiles: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['fileSelect', 'fileDelete', 'fileMove'])

const selectedFileId = ref(null)

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
</script>

<template>
  <div class="media-gallery">
    <h2>Media Files ({{ mediaFiles.length }})</h2>

    <div v-if="mediaFiles.length === 0" class="empty">
      No media files found. Upload a file to get started.
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

h2 {
  margin-bottom: 1.5rem;
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
