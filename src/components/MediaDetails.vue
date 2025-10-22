<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  mediaFile: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['editImage'])

// Check if the file is an image that can be edited
const isImageFile = computed(() => {
  if (!props.mediaFile) return false
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  return imageTypes.includes(props.mediaFile.mediaType?.toLowerCase())
})

// Handle clicking the "Edit Image" button
const handleEditImage = () => {
  emit('editImage', props.mediaFile)
}
</script>

<template>
  <div class="media-details">
    <div v-if="!mediaFile" class="no-selection">
      <p>Select a media file to view details</p>
    </div>

    <div v-else class="details-content">
      <div class="header-section">
        <h2>{{ mediaFile.filename }}</h2>
        <button
          v-if="isImageFile"
          @click="handleEditImage"
          class="btn-edit-image"
        >
          ✏️ Edit Image
        </button>
      </div>

      <div class="detail-section">
        <h3>File Information</h3>
        <dl>
          <dt>Type:</dt>
          <dd>{{ mediaFile.mediaType }}</dd>

          <dt>Path:</dt>
          <dd>{{ mediaFile.filePath }}</dd>

          <dt>Uploaded:</dt>
          <dd>{{ new Date(mediaFile.uploadDate).toLocaleString() }}</dd>

          <dt>Last Updated:</dt>
          <dd>{{ new Date(mediaFile.updateDate).toLocaleString() }}</dd>

          <dt>Cloud URL:</dt>
          <dd>{{ mediaFile.cloudURL || 'N/A' }}</dd>
        </dl>
      </div>

      <div class="detail-section">
        <h3>Extracted Context</h3>
        <pre v-if="mediaFile.context">{{ JSON.stringify(mediaFile.context, null, 2) }}</pre>
        <p v-else class="empty">No context available</p>
        <p class="note">Auto-updated by text extraction system</p>
      </div>

      <div class="detail-section">
        <h3>Translations</h3>
        <pre v-if="mediaFile.translatedText">{{ JSON.stringify(mediaFile.translatedText, null, 2) }}</pre>
        <p v-else class="empty">No translations available</p>
        <p class="note">Auto-updated after translation processing</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-details {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  min-height: 400px;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #888;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #646cff;
  padding-bottom: 0.5rem;
}

.header-section h2 {
  margin: 0;
}

.btn-edit-image {
  background: #646cff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.3);
}

.btn-edit-image:hover {
  background: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.5);
}

.btn-edit-image:active {
  transform: translateY(0);
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  margin: 0 0 0.75rem 0;
  color: #646cff;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
}

dt {
  font-weight: bold;
  color: #888;
}

dd {
  margin: 0;
}

pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
}

.empty {
  color: #666;
  font-style: italic;
}

.note {
  margin-top: 0.5rem;
  font-size: 0.85em;
  color: #888;
  font-style: italic;
}
</style>
