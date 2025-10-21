# Quick Reference Guide

## 🚀 Common Tasks

### Add a New Component

1. **Create the component file:**
```bash
src/components/MyComponent.vue
```

2. **Define props (data coming IN):**
```vue
<script setup>
const props = defineProps({
  myData: Object,
  count: Number
})
</script>
```

3. **Define events (data going OUT):**
```vue
<script setup>
const emit = defineEmits(['myEvent', 'dataChange'])

const handleClick = () => {
  emit('myEvent', someData)
}
</script>
```

4. **Use it in parent:**
```vue
<script setup>
import MyComponent from './components/MyComponent.vue'

const handleMyEvent = (data) => {
  console.log('Received:', data)
}
</script>

<template>
  <MyComponent
    :my-data="myObject"
    :count="5"
    @my-event="handleMyEvent"
  />
</template>
```

---

## 📤 Sending Data Between Components

### Parent → Child (Props)
```vue
<!-- Parent -->
<ChildComponent :user="currentUser" :count="5" />

<!-- Child -->
<script setup>
const props = defineProps({
  user: Object,
  count: Number
})
</script>
<template>
  <div>{{ props.user.name }} - {{ props.count }}</div>
</template>
```

### Child → Parent (Events)
```vue
<!-- Child -->
<script setup>
const emit = defineEmits(['update'])
const sendData = () => emit('update', { id: 1 })
</script>
<button @click="sendData">Send</button>

<!-- Parent -->
<template>
  <ChildComponent @update="handleUpdate" />
</template>
<script setup>
const handleUpdate = (data) => console.log(data)
</script>
```

### Sibling → Sibling (Via Parent)
```vue
<!-- App.vue (Parent) -->
<script setup>
const sharedData = ref(null)

const handleDataFromChild1 = (data) => {
  sharedData.value = data  // Child1 sends data
}
</script>

<template>
  <!-- Child1 sends data via event -->
  <Child1 @data-change="handleDataFromChild1" />

  <!-- Child2 receives via prop -->
  <Child2 :shared-data="sharedData" />
</template>
```

---

## 🔄 Making Data Reactive

### Basic Reactive Data
```javascript
import { ref } from 'vue'

const count = ref(0)
const user = ref({ name: 'John' })
const items = ref([])

// Update (UI updates automatically)
count.value++
user.value.name = 'Jane'
items.value.push({ id: 1 })
```

### Reactive Objects (Alternative)
```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'John' },
  items: []
})

// Update (no .value needed)
state.count++
state.user.name = 'Jane'
state.items.push({ id: 1 })
```

### Computed Values
```javascript
import { ref, computed } from 'vue'

const count = ref(5)
const doubled = computed(() => count.value * 2)

// doubled automatically updates when count changes
count.value = 10  // doubled is now 20
```

---

## 🌐 API Calls

### GET Request
```javascript
const files = await mediaApi.listMediaFiles('/')
```

### POST Request
```javascript
const result = await mediaApi.upload({
  filePath: '/',
  mediaType: 'jpg',
  filename: 'photo.jpg',
  relativePath: '/uploads/photo.jpg'
})

if (result.error) {
  console.error(result.error)
} else {
  console.log('Success:', result)
}
```

### DELETE Request
```javascript
const result = await mediaApi.delete(fileId)
```

### PUT Request
```javascript
const result = await mediaApi.updateContext(fileId, {
  text: 'Extracted text',
  language: 'en'
})
```

---

## 🎯 Common Patterns

### Loading State
```vue
<script setup>
const loading = ref(false)
const data = ref([])

const loadData = async () => {
  loading.value = true
  try {
    data.value = await fetchData()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else>{{ data }}</div>
</template>
```

### Error Handling
```vue
<script setup>
const error = ref(null)

const doSomething = async () => {
  error.value = null
  try {
    await riskyOperation()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div v-if="error" class="error">{{ error }}</div>
</template>
```

### Conditional Rendering
```vue
<template>
  <!-- Show if condition is true -->
  <div v-if="isLoggedIn">Welcome!</div>

  <!-- Show alternative -->
  <div v-else>Please log in</div>

  <!-- Show/hide (keeps in DOM) -->
  <div v-show="isVisible">Toggle me</div>

  <!-- Loop through array -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- Show if array is empty -->
  <div v-if="items.length === 0">No items</div>
</template>
```

### User Input Handling
```vue
<script setup>
const text = ref('')
const count = ref(0)

const handleSubmit = () => {
  console.log('Text:', text.value)
}
</script>

<template>
  <!-- Two-way binding -->
  <input v-model="text" />

  <!-- Button click -->
  <button @click="count++">Clicked {{ count }} times</button>

  <!-- Form submit -->
  <form @submit.prevent="handleSubmit">
    <input v-model="text" />
    <button type="submit">Submit</button>
  </form>
</template>
```

---

## 📦 Using Composables

### In a Component
```vue
<script setup>
import { useMedia } from '@/composables/useMedia'

const {
  mediaFiles,    // reactive data
  loading,       // reactive data
  loadMedia,     // method
  deleteFile     // method
} = useMedia()

// Use them
onMounted(() => loadMedia())

const handleDelete = async (id) => {
  await deleteFile(id)
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-for="file in mediaFiles" :key="file._id">
    {{ file.filename }}
    <button @click="handleDelete(file._id)">Delete</button>
  </div>
</template>
```

---

## 🎨 Styling Components

### Scoped Styles
```vue
<style scoped>
/* Only applies to this component */
.button {
  background: blue;
}
</style>
```

### Dynamic Classes
```vue
<script setup>
const isActive = ref(false)
const type = ref('primary')
</script>

<template>
  <!-- Conditional class -->
  <div :class="{ active: isActive }">Toggle</div>

  <!-- Multiple classes -->
  <div :class="['button', type, { disabled: !isActive }]">
    Button
  </div>

  <!-- Inline styles -->
  <div :style="{ color: 'red', fontSize: '20px' }">
    Styled
  </div>
</template>
```

---

## 🐛 Debugging Tips

### Console Logging in Template
```vue
<template>
  <div>{{ console.log('Data:', myData) || '' }}</div>
</template>
```

### Watch for Changes
```javascript
import { watch } from 'vue'

watch(myRef, (newValue, oldValue) => {
  console.log('Changed from', oldValue, 'to', newValue)
})
```

### Vue DevTools
1. Install Vue DevTools browser extension
2. Open DevTools
3. Go to "Vue" tab
4. Inspect components, props, data, events

---

## ⚡ Performance Tips

### Use `v-show` vs `v-if`
```vue
<!-- Frequent toggling: use v-show -->
<div v-show="isVisible">Toggles often</div>

<!-- Conditional rendering: use v-if -->
<div v-if="shouldRender">Rarely changes</div>
```

### Key in Lists
```vue
<!-- Always use unique :key in v-for -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

### Avoid Unnecessary Reactivity
```javascript
// If data doesn't need to be reactive:
import { shallowRef } from 'vue'
const largeArray = shallowRef([])  // Only top level is reactive
```

---

## 🔗 Useful Links

- Vue 3 Docs: https://vuejs.org/
- Vite Docs: https://vitejs.dev/
- Vue DevTools: https://devtools.vuejs.org/

---

## 💡 Remember

1. **Props DOWN, Events UP**
2. **Use `ref()` for reactive data**
3. **Use `.value` to access/modify refs in `<script>`**
4. **Don't need `.value` in `<template>`**
5. **Always use `:key` in `v-for` loops**
6. **Components re-render when props or reactive data changes**
7. **No manual DOM manipulation needed**
8. **Backend calls go through API service**
