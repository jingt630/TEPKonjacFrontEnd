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

const emit = defineEmits(['close', 'coordinatesChanged'])

const userStore = useUserStore()

// State
const imageUrl = ref(null)
const loading = ref(false)
const extractions = ref([])
const selectedExtraction = ref(null)
const showAddExtraction = ref(false)

// Multi-select state
const selectedExtractions = ref([]) // For bulk operations on extractions
const selectedTranslations = ref({}) // { extractionId: [lang1, lang2, ...] }
const showBulkActions = ref(false)

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

    // Get response text first
    const responseText = await response.text()
    console.log('📥 Raw response:', responseText)

    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Translation result:', result)

        alert(`✅ Translation created!\n\nOriginal: ${translatingExtraction.value.extractedText}\n\nTranslated (${selectedLanguage.value}): ${result.translatedText}`)

        showTranslateDialog.value = false

        // Force complete reload to ensure translations display
        console.log('🔄 Reloading all extractions to show new translation...')
        await loadExtractions()
        console.log('✅ Extractions reloaded, translation should now be visible')
      } catch (parseError) {
        console.error('❌ Failed to parse success response:', parseError)
        console.error('Response text was:', responseText)
        alert('❌ Translation may have succeeded but response parsing failed. Try refreshing.')
        await loadExtractions()
      }
    } else {
      try {
        const error = JSON.parse(responseText)
        alert('❌ Translation failed: ' + (error.error || 'Unknown error'))
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError)
        console.error('Response text was:', responseText)
        alert('❌ Translation failed. Raw response: ' + responseText.substring(0, 200))
      }
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
    console.log('📍 Calling endpoint:', `${API_BASE_URL}${API_ENDPOINTS.GET_TRANSLATIONS_BY_ORIGINAL}`)

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
      console.warn('⚠️ Could not load translations (non-fatal):', response.status, errorText)
      console.warn('   Endpoint:', `${API_BASE_URL}${API_ENDPOINTS.GET_TRANSLATIONS_BY_ORIGINAL}`)
      console.warn('   This may mean the backend is not running or the endpoint path is wrong')
      // Don't throw - just continue without translations
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

      // Emit event to trigger auto-render if rendering panel is open
      emit('coordinatesChanged', props.mediaFile._id)

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

// Multi-select functions for extractions
const toggleExtractionSelection = (extractionId) => {
  const index = selectedExtractions.value.indexOf(extractionId)
  if (index > -1) {
    selectedExtractions.value.splice(index, 1)
  } else {
    selectedExtractions.value.push(extractionId)
  }
}

const selectAllExtractions = () => {
  selectedExtractions.value = extractions.value.map(e => e._id)
}

const deselectAllExtractions = () => {
  selectedExtractions.value = []
}

const isExtractionSelected = (extractionId) => {
  return selectedExtractions.value.includes(extractionId)
}

// Multi-select functions for translations
const toggleTranslationSelection = (extractionId, languageCode) => {
  if (!selectedTranslations.value[extractionId]) {
    selectedTranslations.value[extractionId] = []
  }

  const langs = selectedTranslations.value[extractionId]
  const index = langs.indexOf(languageCode)

  if (index > -1) {
    langs.splice(index, 1)
  } else {
    langs.push(languageCode)
  }
}

const isTranslationSelected = (extractionId, languageCode) => {
  return selectedTranslations.value[extractionId]?.includes(languageCode) || false
}

// Bulk delete extractions
const bulkDeleteExtractions = async () => {
  if (selectedExtractions.value.length === 0) {
    alert('⚠️ No extractions selected')
    return
  }

  if (!confirm(`Delete ${selectedExtractions.value.length} selected extraction(s)?`)) return

  loading.value = true
  let successCount = 0

  try {
    for (const extractionId of selectedExtractions.value) {
      const extraction = extractions.value.find(e => e._id === extractionId)
      if (!extraction) continue

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_EXTRACTION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userStore.userId,
          extractionId: extractionId
        }),
      })

      if (response.ok) {
        successCount++
      }
    }

    alert(`✅ Deleted ${successCount}/${selectedExtractions.value.length} extraction(s)`)
    selectedExtractions.value = []
    await loadExtractions()
  } catch (error) {
    console.error('Error bulk deleting extractions:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Bulk delete translations
const bulkDeleteTranslations = async () => {
  const totalSelected = Object.values(selectedTranslations.value)
    .reduce((sum, langs) => sum + langs.length, 0)

  if (totalSelected === 0) {
    alert('⚠️ No translations selected')
    return
  }

  if (!confirm(`Delete ${totalSelected} selected translation(s)?`)) return

  loading.value = true
  let successCount = 0

  try {
    for (const [extractionId, languageCodes] of Object.entries(selectedTranslations.value)) {
      const extraction = extractions.value.find(e => e._id === extractionId)
      if (!extraction) continue

      for (const lang of languageCodes) {
        const translationId = extraction.translationIds?.[lang]
        if (!translationId) continue

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
          successCount++
        }
      }
    }

    alert(`✅ Deleted ${successCount}/${totalSelected} translation(s)`)
    selectedTranslations.value = {}
    await loadExtractions()
  } catch (error) {
    console.error('Error bulk deleting translations:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
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

// Edit translation
const editTranslation = async (extraction, languageCode, currentText) => {
  const languageName = availableLanguages.find(l => l.code === languageCode)?.name || languageCode
  const newText = prompt(`Edit ${languageName} translation:`, currentText)
  if (!newText || newText === currentText) return

  // Get the translation ID for this language
  if (!extraction.translationIds || !extraction.translationIds[languageCode]) {
    alert('❌ Translation ID not found')
    return
  }

  loading.value = true
  try {
    console.log(`✏️ Updating ${languageName} translation from "${currentText}" to "${newText}"`)

    const translationId = extraction.translationIds[languageCode]

    // Use EDIT endpoint to save user's manual correction (no AI)
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_TRANSLATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        translation: translationId,
        newText: newText
      }),
    })

    // Get response text first
    const responseText = await response.text()
    console.log('📥 Raw response:', responseText)

    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Translation updated:', result)
        alert(`✅ ${languageName} translation updated!`)
        await loadExtractions()
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError)
        console.error('Response text was:', responseText)
        alert(`✅ ${languageName} translation may have updated. Refreshing...`)
        await loadExtractions()
      }
    } else {
      try {
        const error = JSON.parse(responseText)
        alert(`❌ Failed to update ${languageName} translation: ` + (error.error || 'Unknown error'))
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError)
        console.error('Response text was:', responseText)
        alert(`❌ Failed to update translation. Raw response: ` + responseText.substring(0, 200))
      }
    }
  } catch (error) {
    console.error('Error editing translation:', error)
    alert('❌ Error: ' + error.message)
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
            <div class="header-actions">
              <button @click="showBulkActions = !showBulkActions" class="btn-bulk-toggle">
                {{ showBulkActions ? '✖ Cancel' : '☑️ Select' }}
              </button>
              <button @click="showAddExtraction = !showAddExtraction" class="btn-add">
                {{ showAddExtraction ? '✖ Cancel' : '➕ Add Manual' }}
              </button>
            </div>
          </div>

          <!-- Bulk Actions Bar -->
          <div v-if="showBulkActions" class="bulk-actions-bar">
            <div class="bulk-actions-group">
              <button @click="selectAllExtractions" class="btn-select-action">
                ☑️ Select All
              </button>
              <button @click="deselectAllExtractions" class="btn-select-action">
                ☐ Deselect All
              </button>
            </div>
            <div class="bulk-actions-group">
              <button
                @click="bulkDeleteExtractions"
                :disabled="selectedExtractions.length === 0"
                class="btn-bulk-delete"
              >
                🗑️ Delete Selected ({{ selectedExtractions.length }})
              </button>
              <button
                @click="bulkDeleteTranslations"
                :disabled="Object.values(selectedTranslations).reduce((sum, langs) => sum + langs.length, 0) === 0"
                class="btn-bulk-delete-trans"
              >
                🗑️ Delete Translations ({{ Object.values(selectedTranslations).reduce((sum, langs) => sum + langs.length, 0) }})
              </button>
            </div>
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
              <!-- Multi-select Checkbox (shown in bulk mode) -->
              <div v-if="showBulkActions" class="extraction-checkbox-container">
                <input
                  type="checkbox"
                  :checked="isExtractionSelected(extraction._id)"
                  @change="toggleExtractionSelection(extraction._id)"
                  class="extraction-checkbox"
                />
              </div>

              <!-- Extraction Header with Number -->
              <div class="extraction-header">
                <span class="extraction-number">📝 Text Box #{{ index + 1 }}</span>
                <span v-if="extraction.locationData && extraction.locationData.fromCoord" class="extraction-size">
                  {{ Math.abs((extraction.locationData.toCoord[0] || 0) - (extraction.locationData.fromCoord[0] || 0)) }} ×
                  {{ Math.abs((extraction.locationData.toCoord[1] || 0) - (extraction.locationData.fromCoord[1] || 0)) }} px
                </span>
              </div>

              <!-- Extracted Text with Inline Edit -->
              <div class="extraction-text-container">
                <div class="extraction-text">{{ extraction.extractedText }}</div>
                <button
                  @click="editExtraction(extraction)"
                  class="btn-edit-inline"
                  :disabled="loading"
                  title="Edit extracted text"
                >
                  ✏️
                </button>
              </div>

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

              <!-- Translations Section -->
              <div v-if="extraction.translations && Object.keys(extraction.translations).length > 0" class="translations-section">
                <div class="translations-header">📝 Translations:</div>
                <div
                  v-for="(text, lang) in extraction.translations"
                  :key="lang"
                  class="translation-item"
                >
                  <div class="translation-content">
                    <input
                      v-if="showBulkActions"
                      type="checkbox"
                      :checked="isTranslationSelected(extraction._id, lang)"
                      @change="toggleTranslationSelection(extraction._id, lang)"
                      @click.stop
                      class="translation-checkbox"
                    />
                    <div class="translation-text-wrapper">
                      <span class="translation-lang">{{ availableLanguages.find(l => l.code === lang)?.flag }} {{ availableLanguages.find(l => l.code === lang)?.name }}:</span>
                      <span class="translation-text">{{ text }}</span>
                    </div>
                    <div v-if="!showBulkActions" class="translation-actions">
                      <button
                        @click.stop="editTranslation(extraction, lang, text)"
                        class="btn-edit-inline"
                        :disabled="loading"
                        title="Edit translation"
                      >
                        ✏️
                      </button>
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
              </div>

              <div v-if="!showBulkActions" class="extraction-actions">
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
  background: rgba(5, 100, 177, 0.2);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.image-editor-container {
  background: var(--white);
  border-radius: 20px;
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--primary-blue);
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 3px solid var(--soft-blue);
  background: linear-gradient(135deg, var(--white) 0%, var(--soft-blue) 100%);
  border-radius: 17px 17px 0 0;
}

.editor-header h2 {
  margin: 0;
  color: var(--primary-blue);
  font-family: 'Fredoka', 'Quicksand', cursive;
  font-size: 1.8em;
}

.btn-close {
  background: var(--accent-red);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(205, 19, 27, 0.3);
}

.btn-close:hover {
  background: #a00e16;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.4);
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
  background: var(--light-gray);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--soft-blue);
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
  background: var(--accent-light-green);
  color: var(--accent-dark);
  border: none;
  padding: 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 700;
  transition: all 0.3s;
  box-shadow: 0 3px 10px rgba(219, 242, 169, 0.4);
  text-transform: uppercase;
}

.btn-extract:hover:not(:disabled) {
  background: var(--accent-yellow);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(249, 227, 22, 0.5);
}

.btn-extract:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.extractions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--soft-blue);
  border-radius: 16px;
  padding: 1.5rem;
  overflow: hidden;
  border: 2px solid var(--primary-blue);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: var(--navy-blue);
  font-weight: 700;
  font-size: 1.3em;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-bulk-toggle {
  background: var(--accent-yellow);
  color: var(--accent-dark);
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(249, 227, 22, 0.3);
}

.btn-bulk-toggle:hover {
  background: var(--accent-light-green);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(219, 242, 169, 0.4);
}

.btn-add {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.3);
}

.btn-add:hover {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.4);
}

/* Bulk Actions Bar */
.bulk-actions-bar {
  background: linear-gradient(135deg, var(--accent-light-green), var(--accent-yellow));
  border: 2px solid var(--accent-dark);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(249, 227, 22, 0.3);
}

.bulk-actions-group {
  display: flex;
  gap: 0.5rem;
}

.btn-select-action {
  flex: 1;
  background: var(--white);
  color: var(--navy-blue);
  border: 2px solid var(--primary-blue);
  padding: 0.6rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s;
}

.btn-select-action:hover {
  background: var(--soft-blue);
  border-color: var(--navy-blue);
  transform: translateY(-2px);
}

.btn-bulk-delete {
  flex: 1;
  background: var(--accent-red);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(205, 19, 27, 0.3);
}

.btn-bulk-delete:hover:not(:disabled) {
  background: #a00e16;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.4);
}

.btn-bulk-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-bulk-delete-trans {
  flex: 1;
  background: var(--accent-pink);
  color: var(--accent-dark);
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(250, 198, 206, 0.3);
}

.btn-bulk-delete-trans:hover:not(:disabled) {
  background: #f09ba5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(250, 198, 206, 0.5);
}

.btn-bulk-delete-trans:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-form {
  background: var(--white);
  border: 2px solid var(--primary-blue);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(37, 150, 190, 0.15);
}

.add-form h4 {
  margin: 0 0 1rem 0;
  color: var(--navy-blue);
  font-weight: 700;
}

.add-form textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: 2px solid var(--soft-blue);
  background: var(--light-gray);
  color: var(--accent-dark);
  font-family: inherit;
  margin-bottom: 1rem;
  resize: vertical;
  font-size: 1em;
}

.add-form textarea:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 150, 190, 0.1);
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
  color: var(--navy-blue);
  font-size: 0.9em;
  font-weight: 600;
}

.location-inputs input {
  flex: 1;
  padding: 0.6rem;
  border-radius: 8px;
  border: 2px solid var(--soft-blue);
  background: var(--white);
  color: var(--accent-dark);
  font-weight: 500;
}

.location-inputs input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 150, 190, 0.1);
}

.btn-save {
  width: 100%;
  background: var(--accent-light-green);
  color: var(--accent-dark);
  border: none;
  padding: 0.9rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(219, 242, 169, 0.4);
  text-transform: uppercase;
}

.btn-save:hover:not(:disabled) {
  background: var(--accent-yellow);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 227, 22, 0.5);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.extractions-list {
  flex: 1;
  overflow-y: auto;
}

/* Custom scrollbar styling for extractions list */
.extractions-list::-webkit-scrollbar {
  width: 10px;
}

.extractions-list::-webkit-scrollbar-track {
  background: var(--light-gray);
  border-radius: 5px;
}

.extractions-list::-webkit-scrollbar-thumb {
  background: var(--primary-blue);
  border-radius: 5px;
  border: 2px solid var(--light-gray);
}

.extractions-list::-webkit-scrollbar-thumb:hover {
  background: var(--navy-blue);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--navy-blue);
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--navy-blue);
  background: var(--white);
  border-radius: 12px;
  border: 2px dashed var(--primary-blue);
}

.empty p {
  margin: 0.5rem 0;
}

.extraction-item {
  background: var(--white);
  border-radius: 12px;
  padding: 0.8rem;
  margin-bottom: 0.75rem;
  border: 2px solid var(--soft-blue);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  position: relative;
}

.extraction-item:hover {
  border-color: var(--primary-blue);
  box-shadow: 0 4px 15px rgba(37, 150, 190, 0.15);
  transform: translateY(-2px);
}

/* Extraction Checkbox */
.extraction-checkbox-container {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  background: linear-gradient(135deg, var(--accent-yellow), var(--accent-light-green));
  border-radius: 50%;
  padding: 0.3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), pulse 2s ease-in-out 0.4s 2;
  border: 2px solid var(--accent-dark);
}

@keyframes popIn {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 4px 20px rgba(249, 227, 22, 0.6);
  }
}

.extraction-checkbox {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: var(--primary-blue);
}

.translation-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--accent-pink);
  margin-right: 0.5rem;
  flex-shrink: 0;
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), pulse 2s ease-in-out 0.4s 1;
}

/* Extraction Header */
.extraction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: linear-gradient(135deg, var(--primary-blue), var(--navy-blue));
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.extraction-number {
  color: white;
  font-weight: 700;
  font-size: 0.9em;
}

.extraction-size {
  color: var(--accent-yellow);
  font-weight: 600;
  font-size: 0.75em;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.extraction-text-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.extraction-text {
  flex: 1;
  color: var(--accent-dark);
  font-size: 0.9em;
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  background: var(--light-gray);
  border-radius: 8px;
  font-weight: 500;
}

.btn-edit-inline {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.3);
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit-inline:hover:not(:disabled) {
  background: var(--navy-blue);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.4);
}

.btn-edit-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Enhanced Coordinates Display Box */
.coordinates-box {
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 8px;
  padding: 0.6rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 10px rgba(37, 150, 190, 0.15);
}

.coordinates-header {
  color: var(--navy-blue);
  font-weight: 700;
  font-size: 0.8em;
  margin-bottom: 0.5rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coordinates-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.coord-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.coord-item-enhanced {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--white);
  padding: 0.5rem;
  border-radius: 8px;
  border: 2px solid var(--primary-blue);
  transition: all 0.3s;
}

.coord-item-enhanced:hover {
  background: var(--soft-blue);
  border-color: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.15);
}

.coord-icon {
  font-size: 1.3em;
  filter: hue-rotate(180deg);
}

.coord-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.coord-label-small {
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 0.65em;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.coord-value-large {
  color: var(--navy-blue);
  font-family: 'Courier New', monospace;
  font-size: 0.8em;
  font-weight: 700;
}

.coord-dimensions {
  background: var(--accent-light-green);
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 2px solid var(--accent-yellow);
}

.dimension-label {
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 0.75em;
}

.dimension-value {
  color: var(--accent-dark);
  font-family: 'Courier New', monospace;
  font-size: 0.75em;
  font-weight: 600;
}

.btn-edit-coordinates {
  width: 100%;
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 700;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.3);
  text-transform: uppercase;
}

.btn-edit-coordinates:hover:not(:disabled) {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.4);
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
  background: var(--white);
  border: 2px solid var(--primary-blue);
  border-radius: 12px;
  padding: 0.75rem;
}

.coord-edit-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--soft-blue);
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
  color: var(--navy-blue);
  font-weight: 600;
}

.coord-input-label span {
  min-width: 20px;
  color: var(--primary-blue);
  font-size: 0.9em;
}

.coord-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  background: var(--light-gray);
  border: 2px solid var(--soft-blue);
  border-radius: 8px;
  color: var(--accent-dark);
  font-family: 'Courier New', monospace;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.2s;
}

.coord-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 150, 190, 0.1);
}

.coord-input:hover {
  border-color: var(--primary-blue);
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
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-edit-small,
.btn-translate-small,
.btn-delete-small {
  flex: 1;
  min-width: 80px;
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-size: 0.75em;
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
  border-radius: 0 0 17px 17px;
  background: var(--light-gray);
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
  background: rgba(5, 100, 177, 0.2);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.translate-dialog {
  background: var(--white);
  border: 3px solid var(--primary-blue);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 12px 40px rgba(37, 150, 190, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, var(--white) 0%, var(--soft-blue) 100%);
  border-bottom: 2px solid var(--soft-blue);
  border-radius: 17px 17px 0 0;
}

.dialog-header h3 {
  margin: 0;
  color: var(--primary-blue);
  font-size: 1.4em;
  font-family: 'Fredoka', 'Quicksand', cursive;
  font-weight: 600;
}

.btn-close-dialog {
  background: var(--accent-red);
  border: none;
  color: white;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(205, 19, 27, 0.3);
}

.btn-close-dialog:hover {
  background: #a00f1c;
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.5);
}

.dialog-content {
  padding: 2rem;
  background: var(--white);
}

.original-text-display {
  margin-bottom: 1.5rem;
}

.original-text-display label {
  display: block;
  color: var(--navy-blue);
  font-size: 0.95em;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.text-preview {
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: var(--accent-dark);
  font-size: 1em;
  line-height: 1.6;
  min-height: 60px;
}

.language-selector label {
  display: block;
  color: var(--navy-blue);
  font-size: 0.95em;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.language-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
}

.language-option {
  background: var(--light-gray);
  border: 2px solid var(--soft-blue);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.language-option:hover {
  background: var(--soft-blue);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.2);
}

.language-option.selected {
  background: linear-gradient(135deg, var(--primary-blue), var(--navy-blue));
  border-color: var(--navy-blue);
  box-shadow: 0 6px 20px rgba(37, 150, 190, 0.3);
}

.lang-flag {
  font-size: 1.8em;
}

.lang-name {
  color: var(--accent-dark);
  font-weight: 600;
  font-size: 0.95em;
}

.language-option.selected .lang-name {
  color: white;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: var(--soft-blue);
  border-top: 2px solid var(--primary-blue);
  border-radius: 0 0 17px 17px;
}

.btn-cancel,
.btn-confirm {
  padding: 0.8rem 1.75rem;
  border-radius: 50px;
  border: none;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: var(--light-gray);
  color: var(--navy-blue);
  border: 2px solid var(--soft-blue);
}

.btn-cancel:hover {
  background: var(--soft-blue);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.15);
}

.btn-confirm {
  background: var(--primary-blue);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(5, 100, 177, 0.4);
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
  padding: 0.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.translations-header {
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.75em;
  margin-bottom: 0.4rem;
}

.translation-item {
  background: var(--soft-blue);
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 2px solid var(--primary-blue);
}

.translation-item:last-child {
  margin-bottom: 0;
}

.translation-content {
  display: flex;
  align-items: center;
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
  color: var(--navy-blue);
  font-size: 0.75em;
  font-weight: 700;
}

.translation-text {
  color: var(--accent-dark);
  font-size: 0.85em;
  line-height: 1.3;
  font-weight: 500;
}

.translation-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-delete-translation {
  background: var(--accent-red);
  border: none;
  color: white;
  padding: 0.4rem 0.6rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(205, 19, 27, 0.3);
}

.btn-delete-translation:hover:not(:disabled) {
  background: #a00e16;
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(205, 19, 27, 0.4);
}

.btn-delete-translation:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
