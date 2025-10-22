<script setup>
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { useUserStore } from '../stores/userStore'

// Receive individual media file data from parent
const props = defineProps({
  mediaFile: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// Events to communicate with parent
const emit = defineEmits(['select', 'delete', 'move'])

// Get user store for userId
const userStore = useUserStore()

// Reactive image URL (will be a blob URL)
const imageUrl = ref(null)

// Check if this is an image file
const isImage = () => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    props.mediaFile.mediaType?.toLowerCase()
  )
}

// Fetch the actual image from backend
const loadImage = async () => {
  if (!isImage()) {
    console.log(`⏭️ Skipping load for non-image: ${props.mediaFile.filename}`)
    return
  }

  console.log(`📷 Loading image: ${props.mediaFile.filename} (mediaId: ${props.mediaFile._id})`)

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

    console.log(`📡 Response status for ${props.mediaFile.filename}: ${response.status}`)

    if (response.ok) {
      // Check response headers
      const contentType = response.headers.get('Content-Type')
      console.log(`📡 Response headers:`)
      console.log(`   - Content-Type: ${contentType}`)
      console.log(`   - Content-Length: ${response.headers.get('Content-Length')}`)

      // Convert response to blob and create object URL
      const blob = await response.blob()
      console.log(`✅ Image loaded successfully: ${props.mediaFile.filename}`)
      console.log(`   - Blob size: ${blob.size} bytes`)
      console.log(`   - Blob type: ${blob.type}`)
      console.log(`   - Expected type: image/${props.mediaFile.mediaType}`)
      console.log(`   - Response Content-Type: ${contentType}`)

      // Verify blob is not empty
      if (blob.size === 0) {
        console.error(`❌ Blob is empty! Image data not properly served.`)
        return
      }

      // Check if it's actually JSON error
      if (contentType && contentType.includes('application/json')) {
        console.error(`❌ ERROR: Backend returned JSON instead of image!`)
        const text = await blob.text()
        console.error(`   JSON content:`, text)
        try {
          const json = JSON.parse(text)
          console.error(`   Parsed error:`, json)
          alert(`Image loading error: ${json.error || 'Unknown error'}`)
        } catch (e) {
          console.error(`   Could not parse JSON:`, e)
        }
        return
      }

      // Check if blob type matches expected
      if (!blob.type || !blob.type.startsWith('image/')) {
        console.warn(`⚠️ Warning: Blob type "${blob.type}" doesn't look like an image`)
        console.warn(`⚠️ Response Content-Type was: ${contentType}`)
        console.warn(`⚠️ Creating blob URL anyway, but image may not render`)
      }

      imageUrl.value = URL.createObjectURL(blob)
      console.log(`🔗 Blob URL created: ${imageUrl.value}`)
      console.log(`✅ Image should now be visible in UI`)
    } else {
      const errorText = await response.text()
      console.error(`❌ Failed to load image ${props.mediaFile.filename}:`, response.status, errorText)
    }
  } catch (error) {
    console.error(`❌ Error loading image ${props.mediaFile.filename}:`, error)
  }
}

// Load image when component mounts
onMounted(() => {
  loadImage()
})

// Reload if mediaFile changes
watch(() => props.mediaFile._id, () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)  // Clean up old blob URL
  }
  loadImage()
})

const handleSelect = () => {
  emit('select', props.mediaFile)
}

const handleDelete = () => {
  if (confirm(`Delete ${props.mediaFile.filename}?`)) {
    emit('delete', props.mediaFile._id)
  }
}

const handleMove = () => {
  const newPath = prompt('Enter new path:')
  if (newPath) {
    emit('move', { id: props.mediaFile._id, newPath })
  }
}

const handleImageError = (event) => {
  console.error('❌ ===== IMAGE LOAD ERROR =====')
  console.error('   Filename:', props.mediaFile.filename)
  console.error('   MediaId:', props.mediaFile._id)
  console.error('   Blob URL:', imageUrl.value)
  console.error('   Image element src:', event.target?.src)
  console.error('   Image element naturalWidth:', event.target?.naturalWidth)
  console.error('   Image element naturalHeight:', event.target?.naturalHeight)
  console.error('   Image element complete:', event.target?.complete)
  console.error('❌ ============================')

  // Check if the blob URL is still valid
  if (imageUrl.value) {
    fetch(imageUrl.value)
      .then(r => {
        console.error('🔍 Blob URL fetch test:')
        console.error('   - Status:', r.status)
        console.error('   - Type:', r.headers.get('content-type'))
        return r.blob()
      })
      .then(b => {
        console.error('   - Blob size from URL:', b.size)
        console.error('   - Blob type from URL:', b.type)
      })
      .catch(e => {
        console.error('   - Failed to fetch blob URL:', e)
      })
  }

  // Hide the broken image
  event.target.style.display = 'none'
}
</script>

<template>
  <div
    class="media-card"
    :class="{ selected: selected }"
    @click="handleSelect"
  >
    <div class="media-thumbnail">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="mediaFile.filename"
        @error="handleImageError"
      />
      <div v-else class="placeholder">
        <div class="icon">
          {{ mediaFile.mediaType === 'png' || mediaFile.mediaType === 'jpg' || mediaFile.mediaType === 'jpeg' ? '🖼️' : '📄' }}
        </div>
        <div class="type-label">{{ mediaFile.mediaType?.toUpperCase() }}</div>
      </div>
    </div>

    <div class="media-info">
      <h3>{{ mediaFile.filename }}</h3>
      <p class="media-type">{{ mediaFile.mediaType }}</p>
      <p class="upload-date">
        {{ new Date(mediaFile.uploadDate).toLocaleDateString() }}
      </p>
    </div>

    <div class="media-actions">
      <button @click.stop="handleMove" class="btn-move">Move</button>
      <button @click.stop="handleDelete" class="btn-delete">Delete</button>
    </div>
  </div>
</template>

<style scoped>
.media-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.media-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.media-card.selected {
  border: 2px solid #646cff;
  background: rgba(100, 108, 255, 0.1);
}

.media-thumbnail {
  width: 100%;
  height: 150px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.placeholder .icon {
  font-size: 3em;
}

.placeholder .type-label {
  font-size: 0.9em;
  color: #888;
  font-weight: 500;
}

.media-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-type {
  color: #888;
  font-size: 0.9em;
  margin: 0.25rem 0;
}

.upload-date {
  color: #666;
  font-size: 0.8em;
  margin: 0.25rem 0;
}

.media-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.media-actions button {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.85em;
}

.btn-delete {
  background-color: #ff6b6b;
}

.btn-delete:hover {
  background-color: #ee5a52;
}
</style>
