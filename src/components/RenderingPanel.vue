<script setup>
import { ref, computed, onMounted, defineProps } from 'vue'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { useUserStore } from '../stores/userStore'
import { renderingApi } from '../services/renderingApi'
import CanvasRenderer from './CanvasRenderer.vue'

const props = defineProps({
  mediaFile: {
    type: Object,
    required: true
  }
})

const userStore = useUserStore()

// State
const loading = ref(false)
const extractions = ref([])
const selectedLanguage = ref('en')
const renderPreview = ref(null)
const outputVersions = ref([])
const selectedElements = ref([]) // Track which text elements to render
const outputImageUrls = ref({}) // Store blob URLs for rendered images (legacy)
const baseImageUrl = ref('') // Base image URL for canvas rendering
const canvasRenderers = ref({}) // Store refs to CanvasRenderer components
const editingLocationId = ref(null) // Track which location is being edited
const editingCoords = ref({ fromX: 0, fromY: 0, toX: 0, toY: 0 }) // Temp storage for editing
const imageDimensions = ref({ width: 0, height: 0 }) // Store image dimensions for rulers
const displayDimensions = ref({ width: 0, height: 0 }) // Store displayed dimensions
const rulerInterval = ref(100) // Dynamic interval for rulers
const showGrid = ref(false) // Toggle grid overlay

// Calculate optimal ruler interval based on image size
const calculateRulerInterval = (width, height) => {
  const maxDimension = Math.max(width, height)

  if (maxDimension <= 800) {
    return 100 // Small images: 100px intervals
  } else if (maxDimension <= 2000) {
    return 200 // Medium images: 200px intervals
  } else if (maxDimension <= 4000) {
    return 500 // Large images: 500px intervals
  } else {
    return 1000 // Very large images: 1000px intervals
  }
}

// Available languages
const availableLanguages = [
  { code: 'original', name: 'Original Text', flag: '📝' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
]

// Load extractions with translations
const loadExtractions = async () => {
  loading.value = true
  try {
    console.log('🔍 Loading extractions for media:', props.mediaFile._id)
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
      console.log('✅ Loaded', extractions.value.length, 'extractions')

      if (extractions.value.length === 0) {
        console.warn('⚠️ No extractions found for this image. Please extract text first using the image editor.')
      }

      // Load translations and locations for each
      for (const extraction of extractions.value) {
        console.log('Processing extraction:', extraction._id, 'Position ID:', extraction.position)
        if (extraction.position) {
          await loadLocationForExtraction(extraction)
        }
        await loadTranslationsForExtraction(extraction)
      }

      // Auto-select all elements initially
      selectedElements.value = extractions.value.map(e => e._id)
      console.log('✅ Auto-selected', selectedElements.value.length, 'elements')
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

// Load location for extraction
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

// Load translations for extraction
const loadTranslationsForExtraction = async (extraction) => {
  try {
    if (!extraction.textId) return

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
      if (Array.isArray(translations)) {
        extraction.translations = {}
        translations.forEach(t => {
          extraction.translations[t.targetLanguage] = t.translatedText
        })
      }
    }
  } catch (error) {
    console.error('Error loading translations:', error)
  }
}

// Get text to render based on selected language
const getTextForRendering = (extraction) => {
  if (selectedLanguage.value === 'original') {
    return extraction.extractedText
  }
  return extraction.translations?.[selectedLanguage.value] || extraction.extractedText
}

// Toggle element selection
const toggleElement = (extractionId) => {
  const index = selectedElements.value.indexOf(extractionId)
  if (index > -1) {
    selectedElements.value.splice(index, 1)
  } else {
    selectedElements.value.push(extractionId)
  }
}

// Check if element is selected
const isSelected = (extractionId) => {
  return selectedElements.value.includes(extractionId)
}

// Build text elements for rendering
const buildTextElements = () => {
  const elements = []

  console.log('🔨 Building text elements...')
  console.log('   - Total extractions:', extractions.value.length)
  console.log('   - Selected elements:', selectedElements.value.length)

  for (const extraction of extractions.value) {
    if (!isSelected(extraction._id)) {
      console.log('   - Skipping unselected:', extraction._id)
      continue
    }

    console.log('   - Processing extraction:', extraction._id)
    console.log('     Text:', extraction.extractedText)
    console.log('     Location data:', extraction.locationData)

    if (!extraction.locationData) {
      console.warn('     ⚠️ No locationData')
      continue
    }

    const loc = extraction.locationData

    // Validate that coordinates exist and are valid
    if (!loc.fromCoord || !Array.isArray(loc.fromCoord) || loc.fromCoord.length < 2) {
      console.warn('     ⚠️ Invalid fromCoord:', loc.fromCoord)
      console.warn('     Full location data:', JSON.stringify(loc, null, 2))
      continue
    }
    if (!loc.toCoord || !Array.isArray(loc.toCoord) || loc.toCoord.length < 2) {
      console.warn('     ⚠️ Invalid toCoord:', loc.toCoord)
      console.warn('     Full location data:', JSON.stringify(loc, null, 2))
      continue
    }

    const text = getTextForRendering(extraction)

    const element = {
      text: text,
      position: {
        x: loc.fromCoord[0],
        y: loc.fromCoord[1],
        x2: loc.toCoord[0],
        y2: loc.toCoord[1]
      },
      fontSize: 'auto',  // Let canvas calculate size based on box dimensions
      color: '#000000',  // Black text
      backgroundColor: '#FFFFFF'  // White background
    }

    console.log('     ✅ Valid element created:', element)
    elements.push(element)
  }

  console.log('🔨 Built', elements.length, 'text elements')
  return elements
}

// Render output
const renderOutput = async () => {
  if (selectedElements.value.length === 0) {
    alert('⚠️ Please select at least one text element to render')
    return
  }

  loading.value = true
  try {
    console.log('🎨 Rendering output...')

    const textElements = buildTextElements()
    console.log('Text elements:', textElements)

    if (textElements.length === 0) {
      alert('⚠️ No valid text elements to render. Please ensure all selected elements have valid coordinates.')
      loading.value = false
      return
    }

    const result = await renderingApi.render(
      userStore.userId,
      props.mediaFile._id,
      { textElements }
    )

    if (result.error) {
      alert('❌ Render failed: ' + result.error)
    } else {
      console.log('✅ Render successful:', result)
      alert('✅ Render complete! Output created.')

      // Load base image if not already loaded
      if (!baseImageUrl.value) {
        await loadBaseImage()
      }

      await loadOutputVersions()
    }
  } catch (error) {
    console.error('Error rendering:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Load base image URL for canvas rendering
const loadBaseImage = async () => {
  try {
    console.log('🖼️ Loading base image for canvas rendering...')
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
      baseImageUrl.value = URL.createObjectURL(blob)
      console.log('✅ Base image loaded for canvas')
      loadImageDimensions() // Load dimensions for rulers
    } else {
      console.error('❌ Failed to load base image:', response.status)
    }
  } catch (error) {
    console.error('❌ Error loading base image:', error)
  }
}

// Load output versions
const loadOutputVersions = async () => {
  try {
    const outputs = await renderingApi.getOutputsByMedia(userStore.userId, props.mediaFile._id)
    outputVersions.value = Array.isArray(outputs) ? outputs : []
    console.log('📦 Loaded outputs for this image:', outputVersions.value.length)

    // Load base image for canvas rendering (only once)
    if (!baseImageUrl.value && outputVersions.value.length > 0) {
      await loadBaseImage()
    }
  } catch (error) {
    console.error('Error loading outputs:', error)
  }
}

// Export output using canvas renderer
const exportOutput = (outputId) => {
  console.log('💾 Exporting output:', outputId)
  const canvasRenderer = canvasRenderers.value[outputId]

  if (!canvasRenderer) {
    alert('❌ Canvas renderer not found. Please wait for the preview to load.')
    return
  }

  try {
    canvasRenderer.download()
    console.log('✅ Export initiated via canvas renderer')
  } catch (error) {
    console.error('❌ Error exporting:', error)
    alert('❌ Error: ' + error.message)
  }
}

// Store canvas renderer ref
const setCanvasRendererRef = (outputId, ref) => {
  if (ref) {
    canvasRenderers.value[outputId] = ref
    console.log('✅ Canvas renderer ref stored for output:', outputId)
  }
}

// Start editing location
const startEditingLocation = (extraction) => {
  if (!extraction.locationData) {
    alert('⚠️ No location data available for this extraction')
    return
  }

  // Validate coordinates exist
  if (!extraction.locationData.fromCoord || !extraction.locationData.toCoord) {
    alert('⚠️ Incomplete coordinate data. Please add coordinates first in the Image Editor.')
    return
  }

  editingLocationId.value = extraction._id
  editingCoords.value = {
    fromX: extraction.locationData.fromCoord[0] || 0,
    fromY: extraction.locationData.fromCoord[1] || 0,
    toX: extraction.locationData.toCoord[0] || 0,
    toY: extraction.locationData.toCoord[1] || 0
  }
}

// Cancel editing location
const cancelEditingLocation = () => {
  editingLocationId.value = null
  editingCoords.value = { fromX: 0, fromY: 0, toX: 0, toY: 0 }
}

// Save edited location
const saveEditedLocation = async (extraction) => {
  if (!extraction._id) {
    alert('❌ No extraction ID found')
    return
  }

  loading.value = true
  try {
    console.log('💾 Saving location for extraction:', extraction._id)
    console.log('   - From:', [editingCoords.value.fromX, editingCoords.value.fromY])
    console.log('   - To:', [editingCoords.value.toX, editingCoords.value.toY])

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_EXTRACTION_LOCATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userStore.userId,
        extractionId: extraction._id,  // Backend expects extractionId, not extractionResultId
        fromCoord: [parseInt(editingCoords.value.fromX), parseInt(editingCoords.value.fromY)],  // Backend expects fromCoord
        toCoord: [parseInt(editingCoords.value.toX), parseInt(editingCoords.value.toY)]  // Backend expects toCoord
      }),
    })

    if (response.ok) {
      console.log('✅ Location saved successfully')

      // Update local data
      extraction.locationData.fromCoord = [parseInt(editingCoords.value.fromX), parseInt(editingCoords.value.fromY)]
      extraction.locationData.toCoord = [parseInt(editingCoords.value.toX), parseInt(editingCoords.value.toY)]

      alert('✅ Location updated successfully!')
      cancelEditingLocation()
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to update location:', response.status, errorText)
      alert('❌ Failed to update location: ' + errorText)
    }
  } catch (error) {
    console.error('❌ Error updating location:', error)
    alert('❌ Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Computed: Available text count
const availableTextCount = computed(() => {
  return extractions.value.filter(e => {
    if (selectedLanguage.value === 'original') return true
    return e.translations && e.translations[selectedLanguage.value]
  }).length
})

// Load image dimensions for rulers
const loadImageDimensions = () => {
  if (baseImageUrl.value) {
    const img = new Image()
    img.onload = () => {
      imageDimensions.value = {
        width: img.width,
        height: img.height
      }

      // Calculate display dimensions (constrained by max 800px width or 600px height)
      const maxWidth = 800
      const maxHeight = 600
      let displayWidth = img.width
      let displayHeight = img.height

      // Scale down if image is too large
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const widthRatio = maxWidth / displayWidth
        const heightRatio = maxHeight / displayHeight
        const scale = Math.min(widthRatio, heightRatio)

        displayWidth = Math.floor(displayWidth * scale)
        displayHeight = Math.floor(displayHeight * scale)
      }

      displayDimensions.value = {
        width: displayWidth,
        height: displayHeight
      }

      // Calculate optimal ruler interval
      rulerInterval.value = calculateRulerInterval(img.width, img.height)

      console.log('📏 Image dimensions:', imageDimensions.value)
      console.log('📏 Display dimensions:', displayDimensions.value)
      console.log('📏 Ruler interval:', rulerInterval.value, 'px')
    }
    img.src = baseImageUrl.value
  }
}

// Initialize
onMounted(() => {
  loadExtractions()
  loadOutputVersions()
})
</script>

<template>
  <div class="rendering-panel">
    <div class="panel-header">
      <h2>🎨 Render Text on Image</h2>
      <p class="subtitle">Select text elements and language to render onto {{ mediaFile.filename }}</p>
    </div>

    <!-- Side-by-Side Layout -->
    <div class="side-by-side-container">
      <!-- LEFT SIDE: Text Elements -->
      <div class="left-panel">
        <!-- Language Selector -->
        <div class="language-selector">
          <h3>1️⃣ Select Language</h3>
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
          <div class="language-info">
            <span v-if="availableTextCount > 0">
              ✅ {{ availableTextCount }} text element(s) available
            </span>
            <span v-else class="warning">
              ⚠️ No text available for this language
            </span>
          </div>
        </div>

        <!-- Text Elements Selection -->
        <div class="elements-section">
          <h3>2️⃣ Select Text Elements ({{ selectedElements.length }}/{{ extractions.length }})</h3>

          <div v-if="loading" class="loading">Loading text elements...</div>

          <div v-else-if="extractions.length === 0" class="empty">
            <p>⚠️ No text extractions found for this image.</p>
            <p>📝 To render text, you need to extract text first:</p>
            <ol class="empty-instructions">
              <li>Close this panel</li>
              <li>Click "✏️ Edit Image" button</li>
              <li>Use "🤖 Auto Extract Text" or "➕ Add Manual" to extract text</li>
              <li>Come back here to render the extracted text</li>
            </ol>
          </div>

          <div v-else class="elements-list">
            <div
              v-for="(extraction, index) in extractions"
              :key="extraction._id"
              class="element-item"
              :class="{ selected: isSelected(extraction._id), 'no-location': !extraction.locationData }"
              @click="toggleElement(extraction._id)"
            >
              <div class="element-checkbox">
                <input
                  type="checkbox"
                  :checked="isSelected(extraction._id)"
                  :disabled="!extraction.locationData"
                  @click.stop="toggleElement(extraction._id)"
                />
              </div>
              <div class="element-content">
                <div class="element-number">#{{ index + 1 }}</div>
                <div class="element-text">
                  <div class="original">{{ extraction.extractedText }}</div>
                  <div v-if="selectedLanguage !== 'original' && extraction.translations?.[selectedLanguage]" class="translated">
                    → {{ extraction.translations[selectedLanguage] }}
                  </div>
                </div>

                <!-- Display mode -->
                <div v-if="editingLocationId !== extraction._id">
                  <div v-if="extraction.locationData && extraction.locationData.fromCoord && extraction.locationData.toCoord" class="element-position">
                    📍 ({{ extraction.locationData.fromCoord[0] || 0 }},{{ extraction.locationData.fromCoord[1] || 0 }})
                    → ({{ extraction.locationData.toCoord[0] || 0 }},{{ extraction.locationData.toCoord[1] || 0 }})
                    <button
                      @click.stop="startEditingLocation(extraction)"
                      class="btn-edit-location"
                      :disabled="loading"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div v-else class="no-position-warning">
                    ⚠️ No position data
                  </div>
                </div>

                <!-- Editing mode -->
                <div v-else class="location-editor" @click.stop>
                  <div class="location-editor-header">
                    ✏️ Edit Location Coordinates
                  </div>
                  <div class="coord-inputs">
                    <div class="coord-group">
                      <label>From (Top-Left)</label>
                      <div class="coord-pair">
                        <input
                          v-model.number="editingCoords.fromX"
                          type="number"
                          placeholder="X"
                          class="coord-input"
                        />
                        <input
                          v-model.number="editingCoords.fromY"
                          type="number"
                          placeholder="Y"
                          class="coord-input"
                        />
                      </div>
                    </div>
                    <div class="coord-group">
                      <label>To (Bottom-Right)</label>
                      <div class="coord-pair">
                        <input
                          v-model.number="editingCoords.toX"
                          type="number"
                          placeholder="X"
                          class="coord-input"
                        />
                        <input
                          v-model.number="editingCoords.toY"
                          type="number"
                          placeholder="Y"
                          class="coord-input"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="location-editor-actions">
                    <button
                      @click.stop="saveEditedLocation(extraction)"
                      class="btn-save-location"
                      :disabled="loading"
                    >
                      💾 Save
                    </button>
                    <button
                      @click.stop="cancelEditingLocation"
                      class="btn-cancel-location"
                      :disabled="loading"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="selection-actions">
            <button @click="selectedElements = extractions.map(e => e._id)" class="btn-select-all">
              ✅ Select All
            </button>
            <button @click="selectedElements = []" class="btn-deselect-all">
              ❌ Deselect All
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDE: Preview & Render -->
      <div class="right-panel">
        <!-- Render Action -->
        <div class="render-section">
          <h3>3️⃣ Render Output</h3>
          <button
            @click="renderOutput"
            :disabled="loading || selectedElements.length === 0"
            class="btn-render"
          >
            {{ loading ? '🔄 Rendering...' : '🎨 Render Selected Text' }}
          </button>
          <p class="render-info">
            This will create a new output version with {{ selectedElements.length }} text element(s) overlaid on the image.
          </p>
        </div>

        <!-- Output Versions -->
        <div class="outputs-section">
          <div class="outputs-header">
            <h3>📦 Rendered Outputs ({{ outputVersions.length }})</h3>
            <button
              v-if="outputVersions.length > 0"
              @click="showGrid = !showGrid"
              class="btn-toggle-grid"
              :class="{ active: showGrid }"
            >
              {{ showGrid ? '🔲 Hide Grid' : '⊞ Show Grid' }}
            </button>
          </div>

          <div v-if="outputVersions.length === 0" class="empty">
            <p>No rendered outputs yet.</p>
            <p>Create one by clicking "Render Selected Text" above.</p>
          </div>

          <div v-else class="outputs-list">
            <div
              v-for="output in outputVersions"
              :key="output._id"
              class="output-item"
            >
              <div class="output-header">
                <span class="output-id">🎨 Output ID: {{ output._id.substring(0, 16) }}...</span>
                <span class="output-elements">
                  {{ output.renderedData.textElements.length }} element(s)
                </span>
              </div>

              <!-- Image Dimensions Display -->
              <div v-if="imageDimensions.width > 0" class="image-dimensions">
                📐 Image Size: {{ imageDimensions.width }} × {{ imageDimensions.height }} px
                <span class="ruler-info">• Ruler marks every {{ rulerInterval }}px</span>
              </div>

              <!-- Rendered Image Preview with Rulers -->
              <div class="output-preview-container">
                <!-- Top Horizontal Ruler -->
                <div v-if="displayDimensions.width > 0" class="ruler ruler-horizontal-top" :style="{ width: displayDimensions.width + 'px' }">
                  <div class="ruler-markers">
                    <div
                      v-for="n in Math.ceil(imageDimensions.width / rulerInterval)"
                      :key="'h-' + n"
                      class="ruler-marker"
                      :style="{ left: (n * rulerInterval * displayDimensions.width / imageDimensions.width) + 'px' }"
                    >
                      <span class="ruler-label">{{ n * rulerInterval }}</span>
                    </div>
                  </div>
                </div>

                <div class="preview-with-rulers">
                  <!-- Left Vertical Ruler -->
                  <div v-if="displayDimensions.height > 0" class="ruler ruler-vertical-left" :style="{ height: displayDimensions.height + 'px' }">
                    <div class="ruler-markers">
                      <div
                        v-for="n in Math.ceil(imageDimensions.height / rulerInterval)"
                        :key="'v-' + n"
                        class="ruler-marker"
                        :style="{ top: (n * rulerInterval * displayDimensions.height / imageDimensions.height) + 'px' }"
                      >
                        <span class="ruler-label">{{ n * rulerInterval }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Canvas Preview with Optional Grid -->
                  <div
                    class="output-preview"
                    :class="{ 'with-grid': showGrid }"
                    :style="{ width: displayDimensions.width + 'px', height: displayDimensions.height + 'px' }"
                  >
                    <CanvasRenderer
                      v-if="baseImageUrl"
                      :ref="(el) => setCanvasRendererRef(output._id, el)"
                      :baseImageUrl="baseImageUrl"
                      :textElements="output.renderedData.textElements"
                      :width="displayDimensions.width"
                      :height="displayDimensions.height"
                    />
                    <div v-else class="preview-loading">Loading base image...</div>

                    <!-- Grid Overlay -->
                    <div v-if="showGrid && displayDimensions.width > 0" class="grid-overlay">
                      <svg :width="displayDimensions.width" :height="displayDimensions.height">
                        <!-- Fine vertical grid lines (half interval) -->
                        <line
                          v-for="x in Math.ceil(imageDimensions.width / (rulerInterval / 2))"
                          :key="'gv-' + x"
                          :x1="x * (rulerInterval / 2) * displayDimensions.width / imageDimensions.width"
                          :y1="0"
                          :x2="x * (rulerInterval / 2) * displayDimensions.width / imageDimensions.width"
                          :y2="displayDimensions.height"
                          stroke="rgba(37, 150, 190, 0.15)"
                          stroke-width="1"
                        />
                        <!-- Fine horizontal grid lines (half interval) -->
                        <line
                          v-for="y in Math.ceil(imageDimensions.height / (rulerInterval / 2))"
                          :key="'gh-' + y"
                          :x1="0"
                          :y1="y * (rulerInterval / 2) * displayDimensions.height / imageDimensions.height"
                          :x2="displayDimensions.width"
                          :y2="y * (rulerInterval / 2) * displayDimensions.height / imageDimensions.height"
                          stroke="rgba(37, 150, 190, 0.15)"
                          stroke-width="1"
                        />
                        <!-- Major vertical grid lines (matches ruler marks) -->
                        <line
                          v-for="x in Math.ceil(imageDimensions.width / rulerInterval)"
                          :key="'gv-major-' + x"
                          :x1="x * rulerInterval * displayDimensions.width / imageDimensions.width"
                          :y1="0"
                          :x2="x * rulerInterval * displayDimensions.width / imageDimensions.width"
                          :y2="displayDimensions.height"
                          stroke="rgba(5, 100, 177, 0.35)"
                          stroke-width="2"
                        />
                        <!-- Major horizontal grid lines (matches ruler marks) -->
                        <line
                          v-for="y in Math.ceil(imageDimensions.height / rulerInterval)"
                          :key="'gh-major-' + y"
                          :x1="0"
                          :y1="y * rulerInterval * displayDimensions.height / imageDimensions.height"
                          :x2="displayDimensions.width"
                          :y2="y * rulerInterval * displayDimensions.height / imageDimensions.height"
                          stroke="rgba(5, 100, 177, 0.35)"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div class="output-meta">
                <div class="output-date">
                  📅 {{ new Date(output.createdDate).toLocaleString() }}
                </div>
              </div>

              <div class="output-actions">
                <button @click="exportOutput(output._id)" :disabled="loading" class="btn-export">
                  💾 Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rendering-panel {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
  background: var(--light-gray);
}

.panel-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid var(--primary-blue);
}

.panel-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-blue);
  font-size: 2em;
  font-family: 'Fredoka', 'Quicksand', cursive;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: var(--navy-blue);
  font-size: 1em;
  font-weight: 500;
}

/* Side-by-Side Layout */
.side-by-side-container {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.left-panel {
  flex: 1;
  min-width: 400px;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.right-panel {
  flex: 1;
  min-width: 400px;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 1rem;
}

/* Language Selector */
.language-selector {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--white);
  border-radius: 16px;
  border: 2px solid var(--soft-blue);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.language-selector h3 {
  margin: 0 0 1.5rem 0;
  color: var(--navy-blue);
  font-weight: 700;
  font-size: 1.3em;
}

.language-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--light-gray);
  border: 2px solid var(--soft-blue);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.language-option:hover {
  background: var(--soft-blue);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.15);
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
  font-weight: 700;
  color: var(--accent-dark);
}

.language-option.selected .lang-name {
  color: white;
}

.language-info {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.95em;
  color: var(--navy-blue);
  font-weight: 600;
}

.warning {
  color: var(--accent-red);
  font-weight: 700;
}

/* Elements Section */
.elements-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--white);
  border-radius: 16px;
  border: 2px solid var(--soft-blue);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.elements-section h3 {
  margin: 0 0 1rem 0;
  color: var(--navy-blue);
  font-weight: 700;
  font-size: 1.3em;
}

.elements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
}

/* Vertical scrollbar styling */
.elements-list::-webkit-scrollbar {
  width: 10px;
}

.elements-list::-webkit-scrollbar-track {
  background: var(--light-gray);
  border-radius: 5px;
}

.elements-list::-webkit-scrollbar-thumb {
  background: var(--primary-blue);
  border-radius: 5px;
}

.elements-list::-webkit-scrollbar-thumb:hover {
  background: var(--navy-blue);
}

.element-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--light-gray);
  border: 2px solid var(--soft-blue);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.element-item:hover {
  background: var(--soft-blue);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(37, 150, 190, 0.15);
}

.element-item.selected {
  background: linear-gradient(135deg, var(--soft-blue), var(--white));
  border-color: var(--navy-blue);
  box-shadow: 0 6px 20px rgba(37, 150, 190, 0.25);
}

.element-item.no-location {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: var(--accent-red);
  border-style: dashed;
}

.element-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 0.25rem;
}

.element-checkbox input {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: var(--primary-blue);
}

.element-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.element-number {
  font-weight: 700;
  color: var(--primary-blue);
  font-size: 1em;
}

.element-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.original {
  color: var(--accent-dark);
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
}

.translated {
  color: var(--navy-blue);
  font-style: italic;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
  font-weight: 500;
}

.element-position {
  font-size: 0.9em;
  color: var(--primary-blue);
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.no-position-warning {
  color: var(--accent-red);
  font-size: 0.9em;
  font-weight: 700;
}

.btn-edit-location {
  margin-left: 0.5rem;
  padding: 0.4rem 1rem;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 700;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(37, 150, 190, 0.3);
  text-transform: uppercase;
}

.btn-edit-location:hover:not(:disabled) {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.4);
}

.btn-edit-location:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-editor {
  margin-top: 0.75rem;
  padding: 1.25rem;
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 16px;
}

.location-editor-header {
  font-weight: 700;
  color: var(--navy-blue);
  margin-bottom: 1rem;
  font-size: 1.05em;
}

.coord-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.coord-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.coord-group label {
  font-size: 0.9em;
  color: var(--navy-blue);
  font-weight: 700;
}

.coord-pair {
  display: flex;
  gap: 0.75rem;
}

.coord-input {
  flex: 1;
  padding: 0.7rem;
  background: var(--white);
  border: 2px solid var(--soft-blue);
  border-radius: 12px;
  color: var(--accent-dark);
  font-size: 0.95em;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  transition: all 0.3s;
}

.coord-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(37, 150, 190, 0.1);
}

.location-editor-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save-location,
.btn-cancel-location {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 0.9em;
}

.btn-save-location {
  background: #4ade80;
  color: white;
}

.btn-save-location:hover:not(:disabled) {
  background: #3bc76a;
  transform: translateY(-1px);
}

.btn-cancel-location {
  background: rgba(255, 107, 107, 0.8);
  color: white;
}

.btn-cancel-location:hover:not(:disabled) {
  background: #ff6b6b;
  transform: translateY(-1px);
}

.btn-save-location:disabled,
.btn-cancel-location:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-select-all,
.btn-deselect-all {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-select-all {
  background: #4ade80;
  color: white;
}

.btn-select-all:hover {
  background: #3bc76a;
}

.btn-deselect-all {
  background: rgba(255, 107, 107, 0.8);
  color: white;
}

.btn-deselect-all:hover {
  background: #ff6b6b;
}

/* Render Section */
.render-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  text-align: center;
}

.render-section h3 {
  margin: 0 0 1rem 0;
  color: #f59e0b;
}

.btn-render {
  width: 100%;
  max-width: 400px;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.btn-render:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.btn-render:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.render-info {
  margin: 1rem 0 0 0;
  color: #888;
  font-size: 0.9em;
}

/* Outputs Section */
.outputs-section {
  padding: 1rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
}

.outputs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.outputs-section h3 {
  margin: 0;
  color: #8b5cf6;
}

.btn-toggle-grid {
  background: var(--white);
  border: 2px solid var(--primary-blue);
  color: var(--primary-blue);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-toggle-grid:hover {
  background: var(--soft-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.2);
}

.btn-toggle-grid.active {
  background: var(--primary-blue);
  color: white;
}

.outputs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.output-item {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.output-id {
  font-weight: 600;
  color: #8b5cf6;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.output-elements {
  color: #888;
  font-size: 0.85em;
}

/* Image Dimensions Display */
.image-dimensions {
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin: 0.75rem 0;
  color: var(--navy-blue);
  font-weight: 600;
  font-size: 0.9em;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ruler-info {
  font-size: 0.85em;
  color: var(--primary-blue);
  font-weight: 500;
}

/* Rulers Container */
.output-preview-container {
  position: relative;
  margin: 0.75rem 0;
}

.preview-with-rulers {
  display: flex;
  position: relative;
}

/* Ruler Styles */
.ruler {
  background: var(--light-gray);
  position: relative;
  flex-shrink: 0;
}

.ruler-horizontal-top {
  height: 25px;
  margin-left: 30px;
  border-bottom: 2px solid var(--primary-blue);
  overflow: hidden;
}

.ruler-vertical-left {
  width: 30px;
  border-right: 2px solid var(--primary-blue);
  position: relative;
  overflow: hidden;
}

.ruler-markers {
  position: relative;
  width: 100%;
  height: 100%;
}

.ruler-marker {
  position: absolute;
  color: var(--navy-blue);
  font-size: 0.65em;
  font-weight: 600;
}

.ruler-horizontal-top .ruler-marker {
  transform: translateX(-50%);
}

.ruler-horizontal-top .ruler-marker::before {
  content: '';
  position: absolute;
  width: 1px;
  height: 8px;
  background: var(--primary-blue);
  top: -8px;
  left: 50%;
}

.ruler-vertical-left .ruler-marker {
  transform: translateY(-50%);
  width: 100%;
  text-align: center;
}

.ruler-vertical-left .ruler-marker::before {
  content: '';
  position: absolute;
  height: 1px;
  width: 8px;
  background: var(--primary-blue);
  left: -8px;
  top: 50%;
}

.ruler-label {
  display: inline-block;
  padding: 2px 4px;
  background: var(--white);
  border-radius: 3px;
}

/* Output Preview with Rulers */
.output-preview {
  margin: 0;
  background: #000;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.output-preview.with-grid {
  position: relative;
}

/* Grid Overlay */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.grid-overlay svg {
  display: block;
}

.rendered-preview-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.preview-loading {
  color: #888;
  padding: 2rem;
  text-align: center;
}

.output-meta {
  margin-bottom: 0.75rem;
}

.output-date {
  color: #888;
  font-size: 0.85em;
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-export {
  padding: 0.5rem 1rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
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

.empty-instructions {
  text-align: left;
  display: inline-block;
  margin: 1rem auto;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #bbb;
}

.empty-instructions li {
  margin: 0.5rem 0;
  line-height: 1.6;
}
</style>
