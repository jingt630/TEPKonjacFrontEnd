<script setup>
/**
 * Simple Demo Component
 * Shows how the "New Folder" button pattern works
 *
 * To use: Import this in App.vue temporarily to test
 */

import { ref } from 'vue'

// Reactive state - like our folders array
const items = ref([
  'Example Folder 1',
  'Example Folder 2'
])

const loading = ref(false)

// Button click handler - same pattern as FolderBrowser.vue
const handleCreateItem = () => {
  // 1. Get user input (like prompt)
  const itemName = prompt('Enter folder name:')

  if (!itemName) {
    return // User cancelled
  }

  // 2. Simulate API call
  loading.value = true

  // 3. Pretend to call backend (in real app, this calls mediaApi)
  setTimeout(() => {
    // 4. Add to array (reactive update!)
    items.value.push(itemName)

    // 5. Update loading state
    loading.value = false

    // 6. Success message
    console.log(`✅ Created: ${itemName}`)
  }, 500) // Simulate network delay
}

// Delete handler - bonus example
const handleDelete = (itemName) => {
  if (confirm(`Delete "${itemName}"?`)) {
    items.value = items.value.filter(item => item !== itemName)
    console.log(`🗑️ Deleted: ${itemName}`)
  }
}
</script>

<template>
  <div class="simple-demo">
    <h2>Simple Folder Demo</h2>
    <p class="hint">This demonstrates the same pattern as the real app</p>

    <!-- The button - same pattern as FolderBrowser.vue -->
    <button
      @click="handleCreateItem"
      :disabled="loading"
      class="btn-create"
    >
      {{ loading ? 'Creating...' : '+ New Folder' }}
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      Creating folder...
    </div>

    <!-- List of items - same pattern as FolderBrowser.vue -->
    <ul v-if="items.length > 0" class="item-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="item"
      >
        <span class="icon">📁</span>
        <span class="name">{{ item }}</span>
        <button
          @click="handleDelete(item)"
          class="btn-delete"
        >
          🗑️ Delete
        </button>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="empty">
      <p>No folders yet. Click "+ New Folder" to create one!</p>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <h3>How it works:</h3>
      <ol>
        <li>Click "+ New Folder" button above</li>
        <li>Enter a name in the prompt</li>
        <li>Click OK</li>
        <li>Watch the folder appear instantly (reactive!)</li>
        <li>Try clicking the 🗑️ button to delete</li>
      </ol>

      <h3>What happens behind the scenes:</h3>
      <pre><code>1. Button click → handleCreateItem()
2. User input → prompt()
3. Add to array → items.value.push()
4. Vue reactivity → UI updates automatically!
5. No page refresh needed! ✨</code></pre>
    </div>
  </div>
</template>

<style scoped>
.simple-demo {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

h2 {
  margin-top: 0;
  color: #646cff;
}

.hint {
  color: #888;
  font-style: italic;
  margin-bottom: 1.5rem;
}

.btn-create {
  background: #646cff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  width: 100%;
  margin-bottom: 1rem;
  transition: background 0.3s;
}

.btn-create:hover:not(:disabled) {
  background: #535bf2;
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #646cff;
  font-weight: 500;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
}

.item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  font-size: 1.5rem;
}

.name {
  flex: 1;
  font-size: 1rem;
}

.btn-delete {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #ee5a52;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #888;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 1rem 0;
}

.instructions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions h3 {
  color: #646cff;
  font-size: 1rem;
  margin-top: 1.5rem;
}

.instructions ol {
  color: #aaa;
  line-height: 1.8;
}

.instructions pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.9rem;
  color: #9cdcfe;
}

.instructions code {
  font-family: 'Courier New', monospace;
}
</style>
