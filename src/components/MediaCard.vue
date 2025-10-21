<script setup>
import { defineProps, defineEmits } from 'vue'

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
</script>

<template>
  <div
    class="media-card"
    :class="{ selected: selected }"
    @click="handleSelect"
  >
    <div class="media-thumbnail">
      <img
        v-if="mediaFile.cloudURL"
        :src="mediaFile.cloudURL"
        :alt="mediaFile.filename"
      />
      <div v-else class="placeholder">
        📄 {{ mediaFile.mediaType }}
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
  font-size: 2em;
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
