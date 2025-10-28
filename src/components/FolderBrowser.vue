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
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--soft-blue);
}

.header h2 {
  margin: 0;
  color: var(--primary-blue);
  font-size: 1.6em;
  font-weight: 700;
}

.btn-new-folder {
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 0.6rem 1.3rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 150, 190, 0.2);
}

.btn-new-folder:hover {
  background: var(--navy-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 100, 177, 0.3);
}

.breadcrumb {
  background: var(--soft-blue);
  padding: 0.75rem 1rem;
  border-radius: 50px;
  margin-bottom: 1rem;
  font-size: 0.95em;
}

.breadcrumb-segment {
  display: inline;
}

.breadcrumb-link {
  color: var(--primary-blue);
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}

.breadcrumb-link:hover {
  color: var(--navy-blue);
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--navy-blue);
  font-weight: 700;
}

.breadcrumb-separator {
  color: var(--accent-dark);
  opacity: 0.5;
  margin: 0 0.5rem;
}

.btn-back {
  width: 100%;
  padding: 0.85rem;
  margin-bottom: 1rem;
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  color: var(--primary-blue);
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s;
}

.btn-back:hover {
  background: var(--primary-blue);
  color: white;
}

.folder-list {
  list-style: none;
  padding: 0;
}

.folder-item {
  padding: 0.9rem;
  margin-bottom: 0.5rem;
  background: var(--white);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1em;
  border: 2px solid var(--soft-blue);
}

.folder-item:hover {
  background: var(--soft-blue);
  border-color: var(--primary-blue);
  transform: translateX(6px);
}

.empty {
  text-align: center;
  color: var(--navy-blue);
  padding: 2rem;
  font-size: 1em;
  background: var(--light-gray);
  border-radius: 12px;
  border: 2px dashed var(--primary-blue);
}
</style>
