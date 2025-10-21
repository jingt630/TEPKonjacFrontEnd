<script setup>
import { defineProps, defineEmits } from 'vue'

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
const emit = defineEmits(['folderClick', 'createFolder'])

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
</script>

<template>
  <div class="folder-browser">
    <div class="header">
      <h2>Folders</h2>
      <button @click="handleCreateFolder">+ New Folder</button>
    </div>

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
}

.folder-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.empty {
  text-align: center;
  color: #888;
  padding: 2rem;
}
</style>
