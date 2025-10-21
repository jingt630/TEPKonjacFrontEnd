<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { textExtractionApi } from '../services/textExtractionApi'

const props = defineProps({
  selectedImage: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['extractionCreated', 'extractionDeleted'])

const extractions = ref([])
const loading = ref(false)
const error = ref(null)

// Extract text from image using AI
const extractText = async () => {
  if (!props.selectedImage) {
    alert('Please select an image first')
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await textExtractionApi.extractText(props.selectedImage.filePath)

    if (result.error) {
      error.value = result.error
    } else {
      emit('extractionCreated', result)
      await loadExtractions()
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Load all extractions for current image
const loadExtractions = async () => {
  if (!props.selectedImage) return

  loading.value = true
  const results = await textExtractionApi.getExtractionsForImage(props.selectedImage.filePath)
  extractions.value = results
  loading.value = false
}

// Edit extraction text
const editExtraction = async (extractionId) => {
  const newText = prompt('Enter new text:')
  if (!newText) return

  const result = await textExtractionApi.editText(extractionId, newText)

  if (result.error) {
    alert('Error: ' + result.error)
  } else {
    await loadExtractions()
  }
}

// Delete extraction
const deleteExtraction = async (textId) => {
  if (!confirm('Delete this extraction?')) return

  const result = await textExtractionApi.deleteExtraction(textId, props.selectedImage.filePath)

  if (result.error) {
    alert('Error: ' + result.error)
  } else {
    emit('extractionDeleted', textId)
    await loadExtractions()
  }
}

// Watch for image changes
import { watch } from 'vue'
watch(() => props.selectedImage, () => {
  if (props.selectedImage) {
    loadExtractions()
  }
}, { immediate: true })
</script>

<template>
  <div class="text-extraction-panel">
    <h3>Text Extraction</h3>

    <div v-if="!selectedImage" class="no-selection">
      <p>Select an image to extract text</p>
    </div>

    <div v-else class="extraction-content">
      <div class="actions">
        <button @click="extractText" :disabled="loading" class="btn-primary">
          {{ loading ? '🔄 Extracting...' : '🤖 AI Extract Text' }}
        </button>
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="loading && extractions.length === 0" class="loading">
        Loading extractions...
      </div>

      <div v-else-if="extractions.length > 0" class="extractions-list">
        <h4>Extracted Text ({{ extractions.length }})</h4>
        <div
          v-for="extraction in extractions"
          :key="extraction._id"
          class="extraction-item"
        >
          <div class="extraction-text">
            {{ extraction.extractedText || '(empty)' }}
          </div>
          <div class="extraction-meta">
            <span class="text-id">ID: {{ extraction.textId }}</span>
          </div>
          <div class="extraction-actions">
            <button @click="editExtraction(extraction._id)" class="btn-edit">
              ✏️ Edit
            </button>
            <button @click="deleteExtraction(extraction.textId)" class="btn-delete">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty">
        <p>No extractions yet. Click "AI Extract Text" to start.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-extraction-panel {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

h3 {
  margin-top: 0;
  color: #646cff;
}

.no-selection {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.actions {
  margin-bottom: 1rem;
}

.btn-primary {
  background: #646cff;
  width: 100%;
}

.error {
  background: #ff6b6b;
  color: white;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  color: #888;
  padding: 2rem;
}

.extractions-list h4 {
  margin-bottom: 1rem;
  color: #888;
}

.extraction-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.extraction-text {
  font-size: 1.1em;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.extraction-meta {
  font-size: 0.85em;
  color: #888;
  margin-bottom: 0.75rem;
}

.extraction-actions {
  display: flex;
  gap: 0.5rem;
}

.extraction-actions button {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.9em;
}

.btn-edit {
  background: #60a5fa;
}

.btn-delete {
  background: #ff6b6b;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>

