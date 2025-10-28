<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  mediaFile: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['editImage', 'renderImage'])

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

// Handle clicking the "Render" button
const handleRenderImage = () => {
  emit('renderImage', props.mediaFile)
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
        <div v-if="isImageFile" class="action-buttons">
          <button
            @click="handleEditImage"
            class="btn-edit-image"
          >
            ✏️ Edit Image
          </button>
          <button
            @click="handleRenderImage"
            class="btn-render-image"
          >
            🎨 Render Text
          </button>
        </div>
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
    </div>
  </div>
</template>

<style scoped>
.media-details {
  padding: 2rem;
  background: transparent;
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--navy-blue);
  font-size: 1.2em;
  font-weight: 600;
  background: var(--light-gray);
  border-radius: 16px;
  padding: 3rem;
  border: 2px dashed var(--primary-blue);
}

.details-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--soft-blue);
  padding: 1.5rem;
  flex-shrink: 0;
  background: var(--white);
  border-radius: 16px;
}

.header-section h2 {
  margin: 0;
  font-size: 1.6em;
  word-break: break-word;
  line-height: 1.3;
  color: var(--primary-blue);
  font-weight: 700;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  flex-wrap: nowrap;
  justify-content: flex-start;
}

.btn-edit-image,
.btn-render-image {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.2);
  white-space: nowrap;
  flex: 1;
  max-width: 200px;
}

.btn-edit-image:hover,
.btn-render-image:hover {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.3);
}

.btn-render-image {
  background: var(--accent-yellow);
  color: var(--accent-dark);
}

.btn-render-image:hover {
  background: var(--accent-light-green);
  color: var(--accent-dark);
  transform: translateY(-2px);
}

.btn-edit-image:active,
.btn-render-image:active {
  transform: translateY(0);
}

.detail-section {
  margin-bottom: 1.5rem;
  background: var(--white);
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid var(--soft-blue);
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  color: var(--navy-blue);
  font-size: 1.2em;
  font-weight: 700;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem 1.5rem;
  font-size: 1em;
}

dt {
  font-weight: 600;
  color: var(--primary-blue);
}

dd {
  margin: 0;
  color: var(--accent-dark);
  font-weight: 500;
}
</style>
