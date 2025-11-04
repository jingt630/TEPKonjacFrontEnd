<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useMedia } from '../composables/useMedia'

const props = defineProps({
  currentPath: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['fileUploaded'])

const { uploadFile } = useMedia()

const uploading = ref(false)
const selectedFile = ref(null)
const previewUrl = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]

  if (!file) return

  // Check if it's an image
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    alert('❌ Please select a PNG or JPEG image')
    return
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('❌ File too large. Max size: 10MB')
    return
  }

  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    alert('Please select a file first')
    return
  }

  uploading.value = true

  try {
    // Get file extension
    const extension = selectedFile.value.name.split('.').pop().toLowerCase()

    console.log('🚀 Starting upload...', {
      path: props.currentPath || '/',
      filename: selectedFile.value.name,
      hasFileData: !!previewUrl.value
    })

    const result = await uploadFile({
      filePath: props.currentPath || '/',  // Upload to current directory
      mediaType: extension,
      filename: selectedFile.value.name,
      relativePath: selectedFile.value.name,  // In real app, this would be the actual path
      fileData: previewUrl.value  // Send the base64 encoded file data
    })

    if (result.success) {
      console.log('✅ Upload completed successfully!')
      alert('✅ File uploaded successfully!')

      // Wait a tiny bit to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100))

      emit('fileUploaded', result.data)
      clearFile()
    } else {
      console.error('❌ Upload failed:', result.error)
      alert('❌ Upload failed: ' + result.error)
    }
  } catch (error) {
    console.error('❌ Upload error:', error)
    alert('❌ Upload error: ' + error.message)
  } finally {
    uploading.value = false
  }
}

const clearFile = () => {
  selectedFile.value = null
  previewUrl.value = null
  // Reset file input
  const input = document.getElementById('fileInput')
  if (input) input.value = ''
}

const triggerFileInput = () => {
  document.getElementById('fileInput').click()
}
</script>

<template>
  <div class="file-upload">
    <h3>📤 Upload Image</h3>

    <input
      id="fileInput"
      type="file"
      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
      @change="handleFileSelect"
      style="display: none"
    />

    <div v-if="!selectedFile" class="upload-area" @click="triggerFileInput">
      <div class="upload-icon">📁</div>
      <p class="upload-text">Click to select image</p>
      <p class="upload-hint">PNG, JPG, JPEG (Max 10MB)</p>
    </div>

    <div v-else class="preview-area">
      <img :src="previewUrl" alt="Preview" class="preview-image" />
      <div class="file-info">
        <p class="filename">{{ selectedFile.name }}</p>
        <p class="filesize">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
      </div>

      <div class="upload-actions">
        <button @click="handleUpload" :disabled="uploading" class="btn-upload">
          {{ uploading ? '⏳ Uploading...' : '⬆️ Upload' }}
        </button>
        <button @click="clearFile" :disabled="uploading" class="btn-cancel">
          ❌ Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  padding: 1rem;
}

h3 {
  margin: 0 0 1rem 0;
  color: var(--primary-blue);
  font-weight: 700;
}

.upload-area {
  border: 2px dashed var(--primary-blue);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--soft-blue);
}

.upload-area:hover {
  border-color: var(--navy-blue);
  background: var(--primary-blue);
  background-opacity: 0.1;
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 4em;
  margin-bottom: 1rem;
  filter: hue-rotate(180deg);
}

.upload-text {
  margin: 0 0 0.75rem 0;
  font-size: 1.2em;
  font-weight: 600;
  color: var(--navy-blue);
}

.upload-hint {
  margin: 0;
  font-size: 1em;
  color: var(--accent-dark);
  opacity: 0.7;
}

.preview-area {
  background: var(--light-gray);
  border-radius: 16px;
  padding: 2rem;
  border: 2px solid var(--soft-blue);
}

.preview-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  background: var(--white);
  border: 1px solid var(--soft-blue);
}

.file-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--white);
  border-radius: 12px;
  border: 2px solid var(--soft-blue);
}

.filename {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--navy-blue);
  word-break: break-all;
  font-size: 1.1em;
}

.filesize {
  margin: 0;
  font-size: 0.95em;
  color: var(--accent-dark);
  opacity: 0.7;
}

.upload-actions {
  display: flex;
  gap: 1rem;
}

/* Override global button styles with higher specificity */
.upload-actions button.btn-upload,
.upload-actions button.btn-cancel {
  flex: 1;
  padding: 1.2rem 2rem !important;
  font-size: 1.1em !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 50px !important;
  cursor: pointer;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.btn-upload {
  background: var(--accent-light-green) !important;
  color: var(--accent-dark) !important;
}

.btn-upload:hover:not(:disabled) {
  background: var(--accent-yellow) !important;
  color: var(--accent-dark) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.btn-upload:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.btn-cancel {
  background: var(--accent-red) !important;
  color: white !important;
}

.btn-cancel:hover:not(:disabled) {
  background: #a00e16 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.btn-cancel:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
}
</style>
