<script setup>
import { ref, watch, onMounted, defineProps, defineExpose } from 'vue';

const props = defineProps({
  baseImageUrl: {
    type: String,
    required: true
  },
  textElements: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  }
});

const canvasRef = ref(null);
const renderedImageUrl = ref('');
const isLoading = ref(false);
const error = ref('');

const drawImageAndText = async () => {
  const canvas = canvasRef.value;
  if (!canvas) {
    console.error('❌ Canvas ref not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Canvas context not found');
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    console.log('🎨 Starting canvas rendering...');
    console.log('   Base image:', props.baseImageUrl);
    console.log('   Text elements:', props.textElements.length);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load base image
    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed for CORS

    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('✅ Base image loaded:', img.width, 'x', img.height);

        // Set canvas dimensions
        canvas.width = props.width > 0 ? props.width : img.width;
        canvas.height = props.height > 0 ? props.height : img.height;

        console.log('📐 Canvas size:', canvas.width, 'x', canvas.height);

        // Draw base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log('✅ Base image drawn');

        resolve();
      };

      img.onerror = (e) => {
        console.error('❌ Error loading base image:', e);
        reject(new Error('Failed to load base image'));
      };

      img.src = props.baseImageUrl;
    });

    // Draw text elements
    console.log(`🎨 Drawing ${props.textElements.length} text elements...`);

    props.textElements.forEach((element, index) => {
      const { text, position, fontSize = 'auto', color = '#000000', backgroundColor = '#FFFFFF' } = element;
      const { x, y, x2, y2 } = position;

      const boxWidth = x2 - x;
      const boxHeight = y2 - y;

      console.log(`   [${index}] "${text}" at (${x},${y}) size ${boxWidth}x${boxHeight}`);

      // Draw white background box
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Draw border (optional)
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      // Draw text
      ctx.fillStyle = color;

      // Calculate dynamic font size based on box dimensions
      let fontSizeNum;
      if (fontSize === 'auto' || !fontSize) {
        // Smart font size calculation
        const padding = 10;
        const availableWidth = boxWidth - (padding * 2);
        const availableHeight = boxHeight - (padding * 2);

        // Start with a size based on box height (aim for 1-2 lines)
        let testSize = Math.floor(availableHeight * 0.5);
        testSize = Math.max(12, Math.min(testSize, 72)); // Clamp between 12-72px

        // Test if text fits at this size
        ctx.font = `bold ${testSize}px Arial`;
        let textWidth = ctx.measureText(text).width;

        // If text is too wide, reduce font size to fit
        while (textWidth > availableWidth && testSize > 12) {
          testSize -= 2;
          ctx.font = `bold ${testSize}px Arial`;
          textWidth = ctx.measureText(text).width;
        }

        // If text is very short and box is large, allow it to be bigger
        if (text.length < 10 && testSize < availableHeight * 0.7) {
          testSize = Math.floor(availableHeight * 0.7);
          ctx.font = `bold ${testSize}px Arial`;
          textWidth = ctx.measureText(text).width;

          // But still respect width constraint
          while (textWidth > availableWidth && testSize > 12) {
            testSize -= 2;
            ctx.font = `bold ${testSize}px Arial`;
            textWidth = ctx.measureText(text).width;
          }
        }

        fontSizeNum = testSize;
        console.log(`   Auto font size: boxSize=${boxWidth}x${boxHeight}, textLen=${text.length}, fontSize=${fontSizeNum}px`);
      } else {
        // Parse provided font size
        fontSizeNum = typeof fontSize === 'string'
          ? parseInt(fontSize.replace('px', ''))
          : fontSize;
      }

      ctx.font = `bold ${fontSizeNum}px Arial`;
      ctx.textBaseline = 'top';

      console.log(`   Font: ${fontSizeNum}px, Color: ${color}, BG: ${backgroundColor}`);

      // Simple word wrapping
      if (!text || text.trim().length === 0) {
        console.warn(`   ⚠️ Empty text for element ${index}`);
        return;
      }

      const words = text.split(' ');
      let line = '';
      const padding = 10; // Match padding from font size calculation
      let currentY = y + padding; // Padding from top
      const lineHeight = fontSizeNum * 1.2;
      const maxWidth = boxWidth - (padding * 2);

      console.log(`   Drawing text: "${text}" with ${words.length} words`);
      console.log(`   Max width: ${maxWidth}px, Line height: ${lineHeight}px`);

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          // Draw current line and start new line
          const trimmedLine = line.trim();
          console.log(`   Drawing line: "${trimmedLine}" at y=${currentY}`);
          ctx.fillText(trimmedLine, x + padding, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;

          // Check if we're out of bounds
          if (currentY + lineHeight > y + boxHeight) {
            console.warn(`   ⚠️ Text overflow: stopping at line`);
            break;
          }
        } else {
          line = testLine;
        }
      }

      // Draw final line
      if (line.trim().length > 0 && currentY + lineHeight <= y + boxHeight) {
        const trimmedLine = line.trim();
        console.log(`   Drawing final line: "${trimmedLine}" at y=${currentY}`);
        ctx.fillText(trimmedLine, x + padding, currentY);
      }
    });

    // Generate data URL
    renderedImageUrl.value = canvas.toDataURL('image/png');
    console.log('✅ Canvas rendering complete!');

  } catch (err) {
    console.error('❌ Canvas rendering error:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

// Watch for changes and re-render
watch(
  () => [props.baseImageUrl, props.textElements, props.width, props.height],
  () => {
    if (props.baseImageUrl) {
      drawImageAndText();
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.baseImageUrl) {
    drawImageAndText();
  }
});

// Expose download function
defineExpose({
  download: () => {
    if (!renderedImageUrl.value) {
      alert('⚠️ No rendered image to download. Please wait for rendering to complete.');
      return;
    }

    console.log('💾 Downloading rendered image...');
    const link = document.createElement('a');
    link.download = `rendered_${Date.now()}.png`;
    link.href = renderedImageUrl.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ Download initiated');
  },
  getRenderedImageUrl: () => renderedImageUrl.value
});
</script>

<template>
  <div class="canvas-renderer">
    <div v-if="isLoading" class="loading">
      🎨 Rendering image...
    </div>
    <div v-if="error" class="error">
      ❌ Error: {{ error }}
    </div>
    <canvas ref="canvasRef" :class="{ hidden: isLoading }"></canvas>
  </div>
</template>

<style scoped>
.canvas-renderer {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;
  position: relative;
}

canvas {
  max-width: 100%;
  height: auto;
  display: block;
  border: 2px solid #4ade80;
}

canvas.hidden {
  display: none;
}

.loading {
  position: absolute;
  color: #60a5fa;
  font-size: 18px;
  font-weight: bold;
}

.error {
  position: absolute;
  color: #ef4444;
  font-size: 16px;
  padding: 20px;
  text-align: center;
}
</style>
