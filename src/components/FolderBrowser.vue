<script setup>
import { defineProps, defineEmits, computed } from 'vue'

// Receive data from parent via props
const props = defineProps({
  folders: {
    type: Array,
    required: true
  },
  currentPath: {
    type: String,
    default: '/'
  }
})

// Define events to send data back to parent
const emit = defineEmits(['folderClick', 'createFolder', 'navigateTo'])

const handleFolderClick = (folder) => {
  // Send data UP to parent component
  emit('folderClick', folder)
}

const handleCreateFolder = () => {
  const name = prompt('Enter folder name:')
  if (name) {
    emit('createFolder', name)
  }
}

const handleNavigateBack = () => {
  emit('navigateTo', '/')
}

// Parse path into breadcrumb segments
const pathSegments = computed(() => {
  if (props.currentPath === '/' || !props.currentPath) {
    return [{ name: 'Root', path: '/' }]
  }

  const parts = props.currentPath.split('/').filter(p => p)
  const segments = [{ name: 'Root', path: '/' }]

  let currentPath = ''
  for (const part of parts) {
    currentPath += '/' + part
    segments.push({ name: part, path: currentPath })
  }

  return segments
})

const handleBreadcrumbClick = (path) => {
  emit('navigateTo', path)
}
</script>

<template>
  <div class="folder-browser">
    <div class="header">
      <h2>📂 Folders</h2>
      <button @click="handleCreateFolder" class="btn-new-folder">📁 New Folder</button>
    </div>

    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb">
      <span
        v-for="(segment, index) in pathSegments"
        :key="segment.path"
        class="breadcrumb-segment"
      >
        <span
          v-if="index < pathSegments.length - 1"
          @click="handleBreadcrumbClick(segment.path)"
          class="breadcrumb-link"
        >
          {{ segment.name }}
        </span>
        <span v-else class="breadcrumb-current">
          {{ segment.name }}
        </span>
        <span v-if="index < pathSegments.length - 1" class="breadcrumb-separator"> / </span>
      </span>
    </div>

    <!-- Back Button (if not at root) -->
    <button
      v-if="currentPath !== '/'"
      @click="handleNavigateBack"
      class="btn-back"
    >
      ⬅️ Back to Root
    </button>

    <div v-if="folders.length === 0" class="empty">
      No folders found
    </div>

    <ul v-else class="folder-list">
      <li
        v-for="folder in folders"
        :key="folder._id"
        @click="handleFolderClick(folder)"
        class="folder-item"
      >
        📁 {{ folder.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.folder-browser {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-new-folder {
  background: #646cff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-new-folder:hover {
  background: #535bf2;
}

.breadcrumb {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9em;
}

.breadcrumb-segment {
  display: inline;
}

.breadcrumb-link {
  color: #646cff;
  cursor: pointer;
  text-decoration: underline;
}

.breadcrumb-link:hover {
  color: #535bf2;
}

.breadcrumb-current {
  color: #fff;
  font-weight: bold;
}

.breadcrumb-separator {
  color: #666;
  margin: 0 0.5rem;
}

.btn-back {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(100, 108, 255, 0.2);
  border: 1px solid #646cff;
  color: #646cff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-back:hover {
  background: rgba(100, 108, 255, 0.3);
  border-color: #535bf2;
  color: #535bf2;
}

.folder-list {
  list-style: none;
  padding: 0;
}

.folder-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.empty {
  text-align: center;
  color: #888;
  padding: 2rem;
}
</style>
