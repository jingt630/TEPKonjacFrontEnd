<script setup>
import { ref, computed, onMounted, watch, defineProps, defineEmits } from 'vue'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { useUserStore } from '../stores/userStore'

const props = defineProps({
  mediaFile: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const userStore = useUserStore()

// State
const imageUrl = ref(null)
const loading = ref(false)
const extractions = ref([])
const selectedExtraction = ref(null)
const showAddExtraction = ref(false)

// Coordinate editing state
const editingCoordinates = ref({}) // Track which extraction is being edited

// New extraction form
const newExtraction = ref({
  text: '',
  x: 0,
  y: 0,
  width: 100,
  height: 50
})

// Load the image
const loadImage = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SERVE_IMAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        mediaId: props.mediaFile._id
      }),
    })

    if (response.ok) {
      const blob = await response.blob()
      imageUrl.value = URL.createObjectURL(blob)
    } else {
      console.error('Failed to load image')
    }
  } catch (error) {
    console.error('Error loading image:', error)
  }
}

// Load existing text extractions with location data
const loadExtractions = async () => {
  loading.value = true
  try {
    console.log('🔍 Loading extractions for mediaId:', props.mediaFile._id)
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_EXTRACTIONS_FOR_IMAGE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        mediaId: props.mediaFile._id
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('📦 Raw extraction data:', data)
      extractions.value = Array.isArray(data) ? data : []
      console.log('📄 Loaded extractions:', extractions.value.length, extractions.value)

      // Load location data and translations for each extraction
      for (const extraction of extractions.value) {
        console.log('🔍 Processing extraction:', extraction._id, 'Position ID:', extraction.position)
        if (extraction.position) {
          await loadLocationForExtraction(extraction)
        }
        // Load translations
        await loadTranslationsForExtraction(extraction)
      }

      console.log('✅ All extractions processed:', extractions.value)
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to load extractions:', response.status, errorText)
    }
  } catch (error) {
    console.error('❌ Error loading extractions:', error)
  } finally {
    loading.value = false
  }
}

// Load location coordinates for an extraction
const loadLocationForExtraction = async (extraction) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_EXTRACTION_LOCATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        extractionResultId: extraction._id
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('📦 Raw location response for', extraction._id, ':', data)

      // Backend returns an array, take the first element
      if (Array.isArray(data) && data.length > 0) {
        extraction.locationData = data[0]
        console.log('📍 Location loaded:', extraction.locationData)
      } else if (!Array.isArray(data)) {
        // If it's not an array, use it directly (backward compatibility)
        extraction.locationData = data
        console.log('📍 Location loaded (direct):', extraction.locationData)
      } else {
        console.warn('⚠️ No location data in response for extraction:', extraction._id)
      }
    } else {
      console.warn('⚠️ Failed to load location for extraction:', extraction._id)
    }
  } catch (error) {
    console.error('Error loading location:', error)
  }
}

// State for translation
const showTranslateDialog = ref(false)
const translatingExtraction = ref(null)
const selectedLanguage = ref('en')

// Languages available for translation
const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
]

// Open translation dialog
const openTranslateDialog = (extraction) => {
  translatingExtraction.value = extraction
  showTranslateDialog.value = true
  selectedLanguage.value = 'en'
}

// Translate extraction text
const translateExtraction = async () => {
  if (!translatingExtraction.value) return

  loading.value = true
  try {
    console.log(`🌐 Translating "${translatingExtraction.value.extractedText}" to ${selectedLanguage.value}`)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_TRANSLATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        imagePath: props.mediaFile._id,
        originalTextId: translatingExtraction.value.textId,
        originalText: translatingExtraction.value.extractedText,
        targetLanguage: selectedLanguage.value
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Translation result:', result)

      alert(`✅ Translation created!\n\nOriginal: ${translatingExtraction.value.extractedText}\n\nTranslated (${selectedLanguage.value}): ${result.translatedText}`)

      showTranslateDialog.value = false

      // Force complete reload to ensure translations display
      console.log('🔄 Reloading all extractions to show new translation...')
      await loadExtractions()
      console.log('✅ Extractions reloaded, translation should now be visible')
    } else {
      const error = await response.json()
      alert('❌ Translation failed: ' + (error.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error translating:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Load translations for an extraction
const loadTranslationsForExtraction = async (extraction) => {
  try {
    if (!extraction.textId) {
      console.log('⚠️ Extraction has no textId:', extraction._id)
      return
    }

    console.log('🔍 Loading translations for textId:', extraction.textId)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_TRANSLATIONS_BY_ORIGINAL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        originalTextId: extraction.textId
      }),
    })

    if (response.ok) {
      const translations = await response.json()
      console.log('📦 Raw translation data for', extraction.textId, ':', translations)

      if (Array.isArray(translations) && translations.length > 0) {
        extraction.translations = {}
        extraction.translationIds = {} // Store IDs for deletion
        translations.forEach(t => {
          extraction.translations[t.targetLanguage] = t.translatedText
          extraction.translationIds[t.targetLanguage] = t._id // Store ID
          console.log(`  ✅ ${t.targetLanguage}: ${t.translatedText} (ID: ${t._id})`)
        })
        console.log('🌐 Final translations object for extraction:', extraction._id, extraction.translations)
      } else {
        console.log('⚠️ No translations found for textId:', extraction.textId)
      }
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to load translations:', response.status, errorText)
    }
  } catch (error) {
    console.error('❌ Error loading translations:', error)
  }
}

// Add manual text extraction
const addExtraction = async () => {
  if (!newExtraction.value.text) {
    alert('Please enter text to extract')
    return
  }

  loading.value = true
  try {
    console.log('📝 Adding manual extraction:', newExtraction.value)
    console.log('   - MediaId:', props.mediaFile._id)
    console.log('   - Text:', newExtraction.value.text)
    console.log('   - Location:', newExtraction.value.x, newExtraction.value.y, newExtraction.value.width, newExtraction.value.height)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_MANUAL_EXTRACTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        mediaId: props.mediaFile._id,  // Backend expects mediaId
        text: newExtraction.value.text,  // Backend expects text
        location: {
          x: newExtraction.value.x,
          y: newExtraction.value.y,
          width: newExtraction.value.width,
          height: newExtraction.value.height
        }
      }),
    })

    if (response.ok) {
      alert('✅ Extraction added successfully!')
      showAddExtraction.value = false
      newExtraction.value = { text: '', x: 0, y: 0, width: 100, height: 50 }
      await loadExtractions()
    } else {
      const error = await response.json()
      alert('❌ Failed to add extraction: ' + (error.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error adding extraction:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Edit extraction text
const editExtraction = async (extraction) => {
  const newText = prompt('Edit extracted text:', extraction.extractedText)
  if (!newText || newText === extraction.extractedText) return

  loading.value = true
  try {
    console.log(`✏️ Updating extraction text from "${extraction.extractedText}" to "${newText}"`)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_EXTRACTED_TEXT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        extractionId: extraction._id,
        newText: newText
      }),
    })

    if (response.ok) {
      console.log('✅ Text updated successfully')

      // Check if this extraction has translations
      if (extraction.translations && Object.keys(extraction.translations).length > 0) {
        console.log(`🔄 Found ${Object.keys(extraction.translations).length} translations, auto-retranslating...`)

        // Re-translate for each language
        const languages = Object.keys(extraction.translations)
        let successCount = 0

        for (const lang of languages) {
          try {
            console.log(`🌐 Re-translating to ${lang}...`)
            const translateResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_TRANSLATION}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userStore.userId,
                imagePath: props.mediaFile._id,
                originalTextId: extraction.textId,
                originalText: newText, // Use new text
                targetLanguage: lang
              }),
            })

            if (translateResponse.ok) {
              successCount++
              console.log(`  ✅ ${lang} translation updated`)
            } else {
              console.warn(`  ⚠️ Failed to update ${lang} translation`)
            }
          } catch (err) {
            console.error(`  ❌ Error re-translating to ${lang}:`, err)
          }
        }

        alert(`✅ Text updated!\n🌐 ${successCount}/${languages.length} translations updated automatically.`)
      } else {
        alert('✅ Text updated!')
      }

      await loadExtractions()
    } else {
      alert('❌ Failed to update text')
    }
  } catch (error) {
    console.error('Error editing extraction:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Enable coordinate editing mode
const startEditingCoordinates = (extraction) => {
  if (!extraction.locationData) {
    alert('No location data available')
    return
  }

  const currentFrom = extraction.locationData.fromCoord || [0, 0]
  const currentTo = extraction.locationData.toCoord || [100, 100]

  editingCoordinates.value[extraction._id] = {
    fromX: currentFrom[0],
    fromY: currentFrom[1],
    toX: currentTo[0],
    toY: currentTo[1]
  }
}

// Cancel coordinate editing
const cancelEditingCoordinates = (extractionId) => {
  delete editingCoordinates.value[extractionId]
}

// Save edited coordinates
const saveCoordinates = async (extraction) => {
  const coords = editingCoordinates.value[extraction._id]
  if (!coords) return

  loading.value = true
  try {
    console.log('💾 Saving coordinates:', coords)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_EXTRACTION_LOCATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        extractionId: extraction._id,  // Backend expects extractionId, not extractionResultId
        fromCoord: [parseInt(coords.fromX), parseInt(coords.fromY)],  // Backend expects fromCoord
        toCoord: [parseInt(coords.toX), parseInt(coords.toY)]  // Backend expects toCoord
      }),
    })

    if (response.ok) {
      console.log('✅ Coordinates saved successfully')
      delete editingCoordinates.value[extraction._id]
      await loadExtractions()
      alert('✅ Coordinates updated!')
    } else {
      const error = await response.json()
      alert('❌ Failed to update coordinates: ' + (error.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error updating coordinates:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Check if extraction is being edited
const isEditingCoordinates = (extractionId) => {
  return !!editingCoordinates.value[extractionId]
}

// Delete extraction
const deleteExtraction = async (extraction) => {
  if (!confirm(`Delete extraction: "${extraction.extractedText}"?`)) return

  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_EXTRACTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        extractionId: extraction._id
      }),
    })

    if (response.ok) {
      alert('✅ Extraction deleted!')
      await loadExtractions()
    } else {
      alert('❌ Failed to delete extraction')
    }
  } catch (error) {
    console.error('Error deleting extraction:', error)
  } finally {
    loading.value = false
  }
}

// Delete translation
const deleteTranslation = async (extraction, languageCode) => {
  const languageName = availableLanguages.find(l => l.code === languageCode)?.name || languageCode
  if (!confirm(`Delete ${languageName} translation?\n\nThis will permanently delete it from the database.`)) return

  if (!extraction.translationIds || !extraction.translationIds[languageCode]) {
    alert('❌ Translation ID not found')
    return
  }

  loading.value = true
  try {
    const translationId = extraction.translationIds[languageCode]

    console.log(`🗑️ ========== DELETE TRANSLATION REQUEST ==========`)
    console.log(`   - Language: ${languageName} (${languageCode})`)
    console.log(`   - Translation ID: ${translationId}`)
    console.log(`   - Original Text ID: ${extraction.textId}`)
    console.log(`   - User ID: ${userStore.userId}`)
    console.log(`   - Sending request to backend...`)

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_TRANSLATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        translationId: translationId
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ ========== TRANSLATION DELETED FROM DATABASE ==========`)
      console.log(`   - Translation ID: ${translationId}`)
      console.log(`   - Language: ${languageName}`)
      console.log(`   - Backend response:`, result)
      console.log(`   - Status: Permanently removed from database`)
      console.log(`========================================`)

      // Remove from local state immediately for quick UI update
      if (extraction.translations) {
        delete extraction.translations[languageCode]
        console.log(`   - Removed from local UI state`)
      }
      if (extraction.translationIds) {
        delete extraction.translationIds[languageCode]
      }

      // Show success message
      alert(`✅ ${languageName} translation deleted from database!`)

      // Reload to ensure consistency
      console.log(`🔄 Reloading extractions to verify deletion...`)
      await loadExtractions()
      console.log(`✅ Reload complete - translation should be gone`)
    } else {
      const error = await response.json()
      console.error(`❌ Failed to delete translation:`, error)
      alert('❌ Failed to delete translation: ' + (error.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('❌ Error deleting translation:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Auto-extract text using AI (if available)
const autoExtractText = async () => {
  if (!confirm('Run automatic text extraction on this image?')) return

  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXTRACT_TEXT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        mediaId: props.mediaFile._id
      }),
    })

    if (response.ok) {
      alert('✅ Text extraction complete!')
      await loadExtractions()
    } else {
      const error = await response.json()
      alert('❌ Extraction failed: ' + (error.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error in auto extraction:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  console.log('🎬 ImageEditor mounted for:', props.mediaFile.filename)
  loadImage()
  loadExtractions()
})

// Watch for media file changes (when switching between images)
watch(() => props.mediaFile._id, (newId, oldId) => {
  if (newId !== oldId) {
    console.log('🔄 Media file changed, reloading extractions')
    extractions.value = []
    loadImage()
    loadExtractions()
  }
})

// Handle close
const handleClose = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  emit('close')
}
</script>

<template>
  <div class="image-editor-overlay">
    <div class="image-editor-container">
      <!-- Header -->
      <div class="editor-header">
        <h2>✏️ Edit Image: {{ mediaFile.filename }}</h2>
        <button @click="handleClose" class="btn-close">✖ Close</button>
      </div>

      <!-- Main Content -->
      <div class="editor-content">
        <!-- Left: Image Preview -->
        <div class="image-section">
          <div class="image-wrapper">
            <img v-if="imageUrl" :src="imageUrl" :alt="mediaFile.filename" />
            <div v-else class="loading">Loading image...</div>
          </div>

          <div class="image-actions">
            <button @click="autoExtractText" :disabled="loading" class="btn-extract">
              🤖 Auto Extract Text
            </button>
          </div>
        </div>

        <!-- Right: Text Extractions -->
        <div class="extractions-section">
          <div class="section-header">
            <h3>📄 Text Extractions ({{ extractions.length }})</h3>
            <button @click="showAddExtraction = !showAddExtraction" class="btn-add">
              {{ showAddExtraction ? '✖ Cancel' : '➕ Add Manual' }}
            </button>
          </div>

          <!-- Add Extraction Form -->
          <div v-if="showAddExtraction" class="add-form">
            <h4>Add Text Extraction</h4>
            <textarea
              v-model="newExtraction.text"
              placeholder="Enter extracted text..."
              rows="3"
            ></textarea>

            <div class="location-inputs">
              <label>
                X: <input type="number" v-model.number="newExtraction.x" />
              </label>
              <label>
                Y: <input type="number" v-model.number="newExtraction.y" />
              </label>
              <label>
                Width: <input type="number" v-model.number="newExtraction.width" />
              </label>
              <label>
                Height: <input type="number" v-model.number="newExtraction.height" />
              </label>
            </div>

            <button @click="addExtraction" :disabled="loading" class="btn-save">
              💾 Save Extraction
            </button>
          </div>

          <!-- Extractions List -->
          <div class="extractions-list">
            <div v-if="loading" class="loading">Loading...</div>

            <div v-else-if="extractions.length === 0" class="empty">
              <p>No text extractions yet.</p>
              <p>Use "Auto Extract" or "Add Manual" to get started.</p>
            </div>

            <div
              v-else
              v-for="(extraction, index) in extractions"
              :key="extraction._id"
              class="extraction-item"
            >
              <!-- Extraction Header with Number -->
              <div class="extraction-header">
                <span class="extraction-number">📝 Text Box #{{ index + 1 }}</span>
                <span v-if="extraction.locationData && extraction.locationData.fromCoord" class="extraction-size">
                  {{ Math.abs((extraction.locationData.toCoord[0] || 0) - (extraction.locationData.fromCoord[0] || 0)) }} ×
                  {{ Math.abs((extraction.locationData.toCoord[1] || 0) - (extraction.locationData.fromCoord[1] || 0)) }} px
                </span>
              </div>

              <!-- Extracted Text -->
              <div class="extraction-text">{{ extraction.extractedText }}</div>

              <!-- Coordinates Display Box - ENHANCED WITH INLINE EDITING -->
              <div v-if="extraction.locationData && extraction.locationData.fromCoord" class="coordinates-box">
                <div class="coordinates-header">
                  📍 Location on Image
                </div>

                <!-- EDIT MODE: Editable Input Fields -->
                <div v-if="isEditingCoordinates(extraction._id)" class="coordinates-edit-mode">
                  <div class="coord-row-edit">
                    <!-- Top-Left Inputs -->
                    <div class="coord-edit-group">
                      <div class="coord-edit-header">
                        <span class="coord-icon">↖️</span>
                        <span class="coord-label-small">Top-Left</span>
                      </div>
                      <div class="coord-inputs">
                        <label class="coord-input-label">
                          <span>X:</span>
                          <input
                            type="number"
                            v-model.number="editingCoordinates[extraction._id].fromX"
                            class="coord-input"
                          />
                        </label>
                        <label class="coord-input-label">
                          <span>Y:</span>
                          <input
                            type="number"
                            v-model.number="editingCoordinates[extraction._id].fromY"
                            class="coord-input"
                          />
                        </label>
                      </div>
                    </div>

                    <!-- Bottom-Right Inputs -->
                    <div class="coord-edit-group">
                      <div class="coord-edit-header">
                        <span class="coord-icon">↘️</span>
                        <span class="coord-label-small">Bottom-Right</span>
                      </div>
                      <div class="coord-inputs">
                        <label class="coord-input-label">
                          <span>X:</span>
                          <input
                            type="number"
                            v-model.number="editingCoordinates[extraction._id].toX"
                            class="coord-input"
                          />
                        </label>
                        <label class="coord-input-label">
                          <span>Y:</span>
                          <input
                            type="number"
                            v-model.number="editingCoordinates[extraction._id].toY"
                            class="coord-input"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Save/Cancel Buttons -->
                  <div class="coord-edit-actions">
                    <button
                      @click="saveCoordinates(extraction)"
                      class="btn-save-coords"
                      :disabled="loading"
                    >
                      ✅ Save Changes
                    </button>
                    <button
                      @click="cancelEditingCoordinates(extraction._id)"
                      class="btn-cancel-coords"
                      :disabled="loading"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>

                <!-- VIEW MODE: Display Coordinates -->
                <div v-else class="coordinates-grid">
                  <div class="coord-row">
                    <div class="coord-item-enhanced">
                      <span class="coord-icon">↖️</span>
                      <div class="coord-details">
                        <span class="coord-label-small">Top-Left</span>
                        <span class="coord-value-large">
                          X: {{ extraction.locationData.fromCoord[0] || 0 }},
                          Y: {{ extraction.locationData.fromCoord[1] || 0 }}
                        </span>
                      </div>
                    </div>
                    <div class="coord-item-enhanced">
                      <span class="coord-icon">↘️</span>
                      <div class="coord-details">
                        <span class="coord-label-small">Bottom-Right</span>
                        <span class="coord-value-large">
                          X: {{ extraction.locationData.toCoord[0] || 0 }},
                          Y: {{ extraction.locationData.toCoord[1] || 0 }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="coord-dimensions">
                    <span class="dimension-label">📏 Size:</span>
                    <span class="dimension-value">
                      {{ Math.abs((extraction.locationData.toCoord[0] || 0) - (extraction.locationData.fromCoord[0] || 0)) }}px wide ×
                      {{ Math.abs((extraction.locationData.toCoord[1] || 0) - (extraction.locationData.fromCoord[1] || 0)) }}px tall
                    </span>
                  </div>

                  <!-- Edit Button -->
                  <button
                    @click="startEditingCoordinates(extraction)"
                    class="btn-edit-coordinates"
                    :disabled="loading"
                  >
                    ✏️ Edit Coordinates
                  </button>
                </div>
              </div>

              <div class="extraction-meta">
                <div class="meta-row">
                  <span class="meta-label">ID:</span>
                  <span class="meta-value">{{ extraction._id }}</span>
                </div>
                <div class="meta-row" v-if="extraction.textId">
                  <span class="meta-label">Text ID:</span>
                  <span class="meta-value">{{ extraction.textId }}</span>
                </div>
              </div>
              <!-- Translations Section -->
              <div v-if="extraction.translations && Object.keys(extraction.translations).length > 0" class="translations-section">
                <div class="translations-header">📝 Translations:</div>
                <div
                  v-for="(text, lang) in extraction.translations"
                  :key="lang"
                  class="translation-item"
                >
                  <div class="translation-content">
                    <div class="translation-text-wrapper">
                      <span class="translation-lang">{{ availableLanguages.find(l => l.code === lang)?.flag }} {{ availableLanguages.find(l => l.code === lang)?.name }}:</span>
                      <span class="translation-text">{{ text }}</span>
                    </div>
                    <button
                      @click.stop="deleteTranslation(extraction, lang)"
                      class="btn-delete-translation"
                      :disabled="loading"
                      title="Delete this translation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <div class="extraction-actions">
                <button @click="editExtraction(extraction)" class="btn-edit-small">
                  ✏️ Edit Text
                </button>
                <button
                  @click="openTranslateDialog(extraction)"
                  class="btn-translate-small"
                  :disabled="!extraction.textId"
                >
                  🌐 Translate
                </button>
                <button @click="deleteExtraction(extraction)" class="btn-delete-small">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="editor-footer">
        <p>💡 Tip: Extract text from images for translation and rendering</p>
      </div>
    </div>

    <!-- Translation Dialog -->
    <div v-if="showTranslateDialog" class="translate-dialog-overlay" @click="showTranslateDialog = false">
      <div class="translate-dialog" @click.stop>
        <div class="dialog-header">
          <h3>🌐 Translate Text</h3>
          <button @click="showTranslateDialog = false" class="btn-close-dialog">✖</button>
        </div>

        <div class="dialog-content">
          <div class="original-text-display">
            <label>Original Text:</label>
            <div class="text-preview">{{ translatingExtraction?.extractedText }}</div>
          </div>

          <div class="language-selector">
            <label>Translate to:</label>
            <div class="language-options">
              <div
                v-for="lang in availableLanguages"
                :key="lang.code"
                class="language-option"
                :class="{ selected: selectedLanguage === lang.code }"
                @click="selectedLanguage = lang.code"
              >
                <span class="lang-flag">{{ lang.flag }}</span>
                <span class="lang-name">{{ lang.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button @click="showTranslateDialog = false" class="btn-cancel">Cancel</button>
          <button @click="translateExtraction" :disabled="loading" class="btn-confirm">
            {{ loading ? '🔄 Translating...' : '✅ Translate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.image-editor-container {
  background: #1a1a1a;
  border-radius: 12px;
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #646cff;
}

.editor-header h2 {
  margin: 0;
  color: white;
}

.btn-close {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #ee5a52;
  transform: scale(1.05);
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 2rem;
  padding: 2rem;
}

.image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-wrapper {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-actions {
  display: flex;
  gap: 1rem;
}

.btn-extract {
  flex: 1;
  background: #4ade80;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-extract:hover:not(:disabled) {
  background: #3bc76a;
  transform: translateY(-2px);
}

.btn-extract:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.extractions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1.5rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #646cff;
}

.btn-add {
  background: #646cff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #535bf2;
}

.add-form {
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid #646cff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.add-form h4 {
  margin: 0 0 1rem 0;
  color: white;
}

.add-form textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #333;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-family: inherit;
  margin-bottom: 1rem;
  resize: vertical;
}

.location-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.location-inputs label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-size: 0.9em;
}

.location-inputs input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #333;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.btn-save {
  width: 100%;
  background: #4ade80;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #3bc76a;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.extractions-list {
  flex: 1;
  overflow-y: auto;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #888;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.empty p {
  margin: 0.5rem 0;
}

.extraction-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Extraction Header */
.extraction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, rgba(100, 108, 255, 0.2), rgba(74, 222, 128, 0.2));
  border-radius: 6px;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(100, 108, 255, 0.3);
}

.extraction-number {
  color: #646cff;
  font-weight: 700;
  font-size: 1em;
  text-shadow: 0 0 10px rgba(100, 108, 255, 0.5);
}

.extraction-size {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.85em;
  font-family: 'Courier New', monospace;
  background: rgba(74, 222, 128, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.extraction-text {
  color: white;
  margin-bottom: 0.75rem;
  font-size: 1.1em;
  line-height: 1.5;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-weight: 500;
}

/* Enhanced Coordinates Display Box */
.coordinates-box {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
  border: 2px solid #4ade80;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
}

.coordinates-header {
  color: #4ade80;
  font-weight: 700;
  font-size: 1em;
  margin-bottom: 0.75rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.coordinates-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.coord-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.coord-item-enhanced {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(74, 222, 128, 0.3);
  transition: all 0.2s;
}

.coord-item-enhanced:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: #4ade80;
  transform: translateY(-2px);
}

.coord-icon {
  font-size: 1.8em;
  filter: drop-shadow(0 0 5px rgba(74, 222, 128, 0.5));
}

.coord-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.coord-label-small {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord-value-large {
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 1em;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.coord-dimensions {
  background: rgba(74, 222, 128, 0.2);
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.dimension-label {
  color: #4ade80;
  font-weight: 700;
  font-size: 0.9em;
}

.dimension-value {
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 0.95em;
  font-weight: 600;
}

.btn-edit-coordinates {
  width: 100%;
  background: #4ade80;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-edit-coordinates:hover:not(:disabled) {
  background: #3bc76a;
}

.btn-edit-coordinates:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Coordinate Edit Mode Styles */
.coordinates-edit-mode {
  padding: 0.5rem 0;
}

.coord-row-edit {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.coord-edit-group {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(74, 222, 128, 0.5);
  border-radius: 8px;
  padding: 0.75rem;
}

.coord-edit-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(74, 222, 128, 0.3);
}

.coord-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.coord-input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
}

.coord-input-label span {
  min-width: 20px;
  color: #4ade80;
  font-size: 0.9em;
}

.coord-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(74, 222, 128, 0.3);
  border-radius: 6px;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
}

.coord-input:focus {
  outline: none;
  border-color: #4ade80;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
}

.coord-input:hover {
  border-color: rgba(74, 222, 128, 0.6);
}

/* Remove spinner arrows from number inputs */
.coord-input::-webkit-outer-spin-button,
.coord-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.coord-input[type=number] {
  -moz-appearance: textfield;
}

.coord-edit-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-save-coords,
.btn-cancel-coords {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save-coords {
  background: #4ade80;
  color: white;
}

.btn-save-coords:hover:not(:disabled) {
  background: #3bc76a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.btn-cancel-coords {
  background: rgba(255, 107, 107, 0.8);
  color: white;
}

.btn-cancel-coords:hover:not(:disabled) {
  background: #ff6b6b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-save-coords:disabled,
.btn-cancel-coords:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.extraction-meta {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 0.75rem;
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.meta-label {
  font-weight: 600;
  color: #aaa;
  min-width: 70px;
}

.meta-value {
  color: #999;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  word-break: break-all;
}

.extraction-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-edit-small,
.btn-translate-small,
.btn-delete-small {
  flex: 1;
  min-width: 100px;
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-edit-small {
  background: #646cff;
  color: white;
}

.btn-edit-small:hover {
  background: #535bf2;
}

.btn-translate-small {
  background: #f59e0b;
  color: white;
}

.btn-translate-small:hover:not(:disabled) {
  background: #d97706;
}

.btn-translate-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete-small {
  background: #ff6b6b;
  color: white;
}

.btn-delete-small:hover {
  background: #ee5a52;
}

.editor-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: #888;
  font-size: 0.9em;
}

.editor-footer p {
  margin: 0;
}

/* Translation Dialog */
.translate-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.translate-dialog {
  background: #2a2a2a;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #444;
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 1.3em;
}

.btn-close-dialog {
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  transition: color 0.2s;
}

.btn-close-dialog:hover {
  color: #f44336;
}

.dialog-content {
  padding: 1.5rem;
}

.original-text-display {
  margin-bottom: 1.5rem;
}

.original-text-display label {
  display: block;
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.text-preview {
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid #646cff;
  border-radius: 6px;
  padding: 1rem;
  color: white;
  font-size: 1em;
  line-height: 1.5;
  min-height: 60px;
}

.language-selector label {
  display: block;
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.language-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.language-option {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.language-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #646cff;
}

.language-option.selected {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
}

.lang-flag {
  font-size: 1.8em;
}

.lang-name {
  color: white;
  font-weight: 600;
  font-size: 0.95em;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #444;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-confirm {
  background: #646cff;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #535bf2;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Translations Section in Extraction Item */
.translations-section {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.translations-header {
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.85em;
  margin-bottom: 0.5rem;
}

.translation-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.translation-item:last-child {
  margin-bottom: 0;
}

.translation-content {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  justify-content: space-between;
}

.translation-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.translation-lang {
  color: #f59e0b;
  font-size: 0.8em;
  font-weight: 600;
}

.translation-text {
  color: white;
  font-size: 0.95em;
  line-height: 1.4;
}

.btn-delete-translation {
  background: transparent;
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-delete-translation:hover:not(:disabled) {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.btn-delete-translation:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
