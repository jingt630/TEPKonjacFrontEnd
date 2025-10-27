# 🎨 Frontend Canvas Rendering - Complete Setup

## ✅ **The Solution**

Since ImageScript has bugs in Deno, we'll use **HTML Canvas API** in the frontend instead!

**Benefits:**
- ✅ No ImageScript bugs
- ✅ Works perfectly in browsers
- ✅ Faster rendering
- ✅ User can preview before downloading
- ✅ Better text quality with real fonts

---

## 📁 **Files Created**

1. **`concepts/Rendering/RenderingSimpleInstructions.ts`** (Backend)
2. **`src/components/CanvasRenderer.vue`** (Frontend)

---

## 🚀 **Setup Steps**

### **Step 1: Copy Backend File**

```powershell
# Copy the simple instructions version to backend
cp concepts\Rendering\RenderingSimpleInstructions.ts C:\path\to\backend\src\concepts\Rendering\Rendering.ts

# Restart backend
.\START_BACKEND_NO_PROMPTS.ps1
```

This version:
- ✅ No ImageScript dependency
- ✅ Just stores rendering instructions
- ✅ Returns original image + overlay data
- ✅ Works immediately!

---

### **Step 2: Use CanvasRenderer Component**

The `CanvasRenderer.vue` component is already created at `src/components/CanvasRenderer.vue`.

#### **How to Use It:**

In your `RenderingPanel.vue` or any component:

```vue
<script setup>
import CanvasRenderer from './CanvasRenderer.vue'
import { ref } from 'vue'

const showRenderer = ref(false)
const currentOutput = ref(null)

// When user clicks to view/download a rendered output
const viewRenderedOutput = async (output) => {
  // output.renderedImageData = base64 image
  // output.renderedData.textElements = text overlays

  currentOutput.value = {
    imageData: output.renderedImageData,
    textElements: output.renderedData.textElements
  }

  showRenderer.value = true
}
</script>

<template>
  <!-- Your existing rendering UI -->

  <!-- Canvas Renderer Modal/Section -->
  <div v-if="showRenderer" class="renderer-modal">
    <h3>Rendered Output</h3>
    <CanvasRenderer
      :imageData="currentOutput.imageData"
      :textElements="currentOutput.textElements"
      :autoRender="true"
    />
    <button @click="showRenderer = false">Close</button>
  </div>
</template>
```

---

## 🎨 **How It Works**

### **Backend (RenderingSimpleInstructions.ts):**

```typescript
// 1. Stores rendering instructions
const output = {
  imagePath: mediaId,
  renderedData: {
    textElements: [
      {
        text: "ライオン・キング",
        position: { x: 100, y: 50, x2: 300, y2: 100 },
        fontSize: "16px",
        color: "#000000",
        backgroundColor: "#FFFFFF"
      }
    ]
  },
  renderedImageData: "data:image/png;base64,..." // Original image
}

// 2. Frontend will do the actual rendering!
```

### **Frontend (CanvasRenderer.vue):**

```javascript
// 1. Load original image
const img = new Image()
img.src = props.imageData

// 2. Draw on canvas
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// 3. Draw original image
ctx.drawImage(img, 0, 0)

// 4. For each text element:
textElements.forEach(element => {
  // Draw white background box
  ctx.fillStyle = element.backgroundColor
  ctx.fillRect(x, y, width, height)

  // Draw text with real fonts!
  ctx.fillStyle = element.color
  ctx.font = `${element.fontSize} Arial`
  ctx.fillText(element.text, x, y)
})

// 5. Download
canvas.toBlob(blob => {
  // Download as PNG
})
```

---

## 📊 **Complete Flow**

### **1. User Triggers Render:**
```
Frontend → POST /api/Rendering/render
  {
    userId: "user:xxx",
    imagePath: "mediaId",
    contentToRender: {
      textElements: [...]
    }
  }
```

### **2. Backend Stores Instructions:**
```
Backend:
  ✅ Validates text elements
  ✅ Gets original image
  ✅ Stores output version with instructions
  ✅ Returns output ID
```

### **3. Frontend Fetches Output:**
```
Frontend → POST /api/Rendering/_serveRenderedImage
  { userId, outputId }

Backend responds with:
  {
    data: <image bytes>,
    contentType: "image/png"
  }
```

### **4. Frontend Renders with Canvas:**
```
CanvasRenderer component:
  1. Loads original image
  2. Creates canvas
  3. Draws image
  4. Draws text overlays
  5. User can download!
```

---

## 🎯 **Quick Test**

### **1. Start Backend:**
```powershell
# In backend folder
.\START_BACKEND_NO_PROMPTS.ps1
```

### **2. Test Render:**
- Go to frontend
- Select image with translations
- Click "🎨 Render Text on Image"
- Select text elements
- Click "Render Selected Text"
- **Should succeed!** ✅

### **3. View Output:**
- Click on rendered output
- Should show CanvasRenderer component
- Text overlays drawn with real fonts!
- Click "💾 Download PNG"
- **Image downloads and works!** ✅

---

## 📝 **Integration Example**

Full example for `RenderingPanel.vue`:

```vue
<script setup>
import { ref } from 'vue'
import CanvasRenderer from './CanvasRenderer.vue'

// ... existing code ...

const selectedOutput = ref(null)
const showCanvasRenderer = ref(false)

// View rendered output
const viewOutput = (output) => {
  selectedOutput.value = output
  showCanvasRenderer.value = true
}

// Download from renderer
const handleRendered = (canvas) => {
  console.log('✅ Canvas rendered, ready for download')
}
</script>

<template>
  <div class="rendering-panel">
    <!-- ... existing UI ... -->

    <!-- Output list -->
    <div class="outputs-list">
      <div v-for="output in outputVersions" :key="output._id">
        <button @click="viewOutput(output)">
          👁️ View & Download
        </button>
      </div>
    </div>

    <!-- Canvas Renderer -->
    <div v-if="showCanvasRenderer" class="renderer-overlay">
      <div class="renderer-container">
        <h2>🎨 Rendered Output</h2>
        <CanvasRenderer
          v-if="selectedOutput"
          :imageData="selectedOutput.renderedImageData"
          :textElements="selectedOutput.renderedData.textElements"
          :autoRender="true"
          @rendered="handleRendered"
        />
        <button @click="showCanvasRenderer = false" class="btn-close">
          ✖️ Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.renderer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.renderer-container {
  background: #1a1a1a;
  border: 2px solid #646cff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.btn-close {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}
</style>
```

---

## ✨ **Advantages of This Approach**

| Feature | ImageScript (Backend) | Canvas API (Frontend) |
|---------|----------------------|----------------------|
| **Works?** | ❌ Broken in Deno | ✅ Yes |
| **Text Quality** | ⚠️ Blocks only | ✅ Real fonts |
| **Speed** | 🐌 Slow (server processing) | ⚡ Fast (client-side) |
| **Preview** | ❌ No | ✅ Yes |
| **Dependencies** | ❌ ImageScript bugs | ✅ Browser built-in |
| **Flexibility** | ⚠️ Limited | ✅ Full control |
| **User Experience** | ⚠️ Okay | ✅ Excellent |

---

## 🐛 **Troubleshooting**

### **"Canvas not rendering"**
- Check browser console for errors
- Verify `imageData` is valid base64
- Ensure `textElements` array is not empty

### **"Download not working"**
- Check if canvas has rendered (watch for 'rendered' event)
- Try right-click → Save As on canvas

### **"Text not showing"**
- Check text color vs background color (contrast)
- Verify position coordinates are within image bounds
- Check fontSize is valid

---

## ✅ **Summary**

**What Changed:**
1. ❌ **Before:** Try to use ImageScript in Deno (broken)
2. ✅ **After:** Use HTML Canvas API in browser (works!)

**Setup:**
1. Copy `RenderingSimpleInstructions.ts` to backend
2. Use `CanvasRenderer.vue` component in frontend
3. Rendering happens in browser with real fonts
4. Downloads work perfectly!

**Result:**
- ✅ No more ImageScript errors
- ✅ Beautiful text rendering
- ✅ Fast and reliable
- ✅ Better user experience

---

**Ready to use! 🎉**

Just copy the backend file, restart, and you're good to go!
