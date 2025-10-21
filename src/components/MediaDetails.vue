<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  mediaFile: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['updateContext', 'updateTranslation'])

const handleUpdateContext = () => {
  const newContext = prompt('Enter extracted text context (JSON format):')
  if (newContext) {
    try {
      const contextObj = JSON.parse(newContext)
      // Send update request UP to parent
      emit('updateContext', {
        mediaId: props.mediaFile._id,
        context: contextObj
      })
    } catch (e) {
      alert('Invalid JSON format')
    }
  }
}

const handleUpdateTranslation = () => {
  const translation = prompt('Enter translation (JSON format):')
  if (translation) {
    try {
      const translationObj = JSON.parse(translation)
      // Send update request UP to parent
      emit('updateTranslation', {
        mediaId: props.mediaFile._id,
        translation: translationObj
      })
    } catch (e) {
      alert('Invalid JSON format')
    }
  }
}
</script>

<template>
  <div class="media-details">
    <div v-if="!mediaFile" class="no-selection">
      <p>Select a media file to view details</p>
    </div>

    <div v-else class="details-content">
      <h2>{{ mediaFile.filename }}</h2>

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
        <div class="section-header">
          <h3>Extracted Context</h3>
          <button @click="handleUpdateContext">Update</button>
        </div>
        <pre v-if="mediaFile.context">{{ JSON.stringify(mediaFile.context, null, 2) }}</pre>
        <p v-else class="empty">No context available</p>
      </div>

      <div class="detail-section">
        <div class="section-header">
          <h3>Translations</h3>
          <button @click="handleUpdateTranslation">Update</button>
        </div>
        <pre v-if="mediaFile.translatedText">{{ JSON.stringify(mediaFile.translatedText, null, 2) }}</pre>
        <p v-else class="empty">No translations available</p>
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

.details-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #646cff;
  padding-bottom: 0.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
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
</style>
