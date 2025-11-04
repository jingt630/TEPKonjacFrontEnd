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

    // Calculate scale factor if canvas is different size than original image
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    console.log(`📏 Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);

    // Draw text elements
    console.log(`🎨 Drawing ${props.textElements.length} text elements...`);

    props.textElements.forEach((element, index) => {
      const { text, position, fontSize = 'auto', color = '#000000', backgroundColor = '#FFFFFF' } = element;
      const { x, y, x2, y2 } = position;

      // Scale coordinates to match canvas size
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;

      const boxWidth = scaledX2 - scaledX;
      const boxHeight = scaledY2 - scaledY;

      console.log(`   [${index}] "${text}" at orig(${x},${y}) scaled(${scaledX.toFixed(1)},${scaledY.toFixed(1)}) size ${boxWidth.toFixed(1)}x${boxHeight.toFixed(1)}`);

      // Draw white background box
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(scaledX, scaledY, boxWidth, boxHeight);

      // Draw border (optional)
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaledX, scaledY, boxWidth, boxHeight);

      // Draw text
      ctx.fillStyle = color;

      // Calculate dynamic font size based on box dimensions
      let fontSizeNum;
      if (fontSize === 'auto' || !fontSize) {
        // Font size should be approximately the box height (with small padding)
        const padding = 8;
        const availableWidth = boxWidth - (padding * 2);
        const availableHeight = boxHeight - (padding * 2);

        // Start with font size = 85% of box height (to fill most of the box)
        let testSize = Math.floor(availableHeight * 0.85);
        testSize = Math.max(12, Math.min(testSize, 200)); // Clamp between 12-200px

        // Test if text fits at this size
        ctx.font = `bold ${testSize}px Arial`;
        let textWidth = ctx.measureText(text).width;

        // If text is too wide, reduce font size to fit
        while (textWidth > availableWidth && testSize > 12) {
          testSize -= 2;
          ctx.font = `bold ${testSize}px Arial`;
          textWidth = ctx.measureText(text).width;
        }

        fontSizeNum = testSize;
        console.log(`   Auto font size: boxSize=${boxWidth}x${boxHeight}, textLen=${text.length}, fontSize=${fontSizeNum}px (${Math.round(fontSizeNum/boxHeight*100)}% of height)`);
      } else {
        // Parse provided font size
        fontSizeNum = typeof fontSize === 'string'
          ? parseInt(fontSize.replace('px', ''))
          : fontSize;
      }

      ctx.font = `bold ${fontSizeNum}px Arial`;
      ctx.textBaseline = 'middle'; // Center text vertically

      console.log(`   Font: ${fontSizeNum}px, Color: ${color}, BG: ${backgroundColor}`);

      // Center text in box (horizontally and vertically)
      if (!text || text.trim().length === 0) {
        console.warn(`   ⚠️ Empty text for element ${index}`);
        return;
      }

      const padding = 8;
      const maxWidth = boxWidth - (padding * 2);

      // Measure text width
      const textWidth = ctx.measureText(text).width;

      // Calculate centered position (using scaled coordinates)
      const centerX = scaledX + (boxWidth / 2);
      const centerY = scaledY + (boxHeight / 2);

      console.log(`   Drawing text: "${text}"`);
      console.log(`   Text width: ${textWidth}px, Box center: (${centerX}, ${centerY})`);

      // Check if text fits in one line
      if (textWidth <= maxWidth) {
        // Draw single line centered
        ctx.textAlign = 'center';
        ctx.fillText(text, centerX, centerY);
        console.log(`   ✅ Single line drawn at center (${centerX}, ${centerY})`);
      } else {
        // Text too long - wrap and center multiple lines
        const words = text.split(' ');
        const lines = [];
        let line = '';

        // Build lines
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        if (line.trim().length > 0) {
          lines.push(line.trim());
        }

        // Calculate vertical centering for multiple lines
        const lineHeight = fontSizeNum * 1.1;
        const totalHeight = lines.length * lineHeight;
        let startY = centerY - (totalHeight / 2) + (lineHeight / 2);

        // Draw each line centered
        ctx.textAlign = 'center';
        lines.forEach((lineText, idx) => {
          const lineY = startY + (idx * lineHeight);
          if (lineY >= scaledY && lineY <= scaledY + boxHeight) {
            ctx.fillText(lineText, centerX, lineY);
            console.log(`   Line ${idx + 1}: "${lineText}" at y=${lineY}`);
          }
        });
      }
    });

    // Generate data URL at maximum quality
    // Using PNG for lossless quality (no quality parameter needed)
    renderedImageUrl.value = canvas.toDataURL('image/png');
    console.log('✅ Canvas rendering complete!');
    console.log(`📊 Final canvas size: ${canvas.width}×${canvas.height}px (full resolution)`);

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

    const canvas = canvasRef.value;
    console.log('💾 Downloading rendered image...');
    console.log(`   Canvas resolution: ${canvas.width}×${canvas.height}px (full quality)`);
    console.log(`   File format: PNG (lossless)`);

    const link = document.createElement('a');
    link.download = `rendered_${Date.now()}.png`;
    link.href = renderedImageUrl.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ Download initiated at full resolution!');
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
  max-height: 100%;
  height: auto;
  display: block;
  border: 2px solid #4ade80;
  object-fit: contain;
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
