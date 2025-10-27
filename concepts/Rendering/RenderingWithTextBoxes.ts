import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

// Declare collection prefix
const PREFIX = "OutputRender" + ".";

// Generic types
type OutputVersionID = ID;
type TextElementID = ID;

interface Position {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

interface TextElement {
  _id?: TextElementID;
  text: string;
  position: Position;
  fontSize?: string;
  color?: string;
  backgroundColor?: string; // Optional: custom background color
}

interface RenderedContent {
  textElements: TextElement[];
}

interface OutputVersion {
  _id: OutputVersionID;
  imagePath: string;
  renderedData: RenderedContent;
  renderedImageData?: string; // Base64 encoded rendered image
  createdDate: Date;
  owner: ID;
}

interface ExportedFile {
  name: string;
  content: string;
  destination: string;
}

export default class RenderingConcept {
  outputVersions: Collection<OutputVersion>;
  mediaStorage: Collection<any>;
  mediaFiles: Collection<any>;

  constructor(private readonly db: Db) {
    this.outputVersions = this.db.collection(PREFIX + "outputVersions");
    this.mediaStorage = this.db.collection("MediaStorage.storedImages"); // Fixed: was "MediaStorage.images"
    this.mediaFiles = this.db.collection("MediaManagement.mediaFiles");
  }

  /**
   * Helper: Parse hex color to RGBA array [r, g, b, a]
   */
  private hexToRgba(hex: string, alpha: number = 1): [number, number, number, number] {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return [r, g, b, Math.floor(alpha * 255)];
  }

  /**
   * Helper: Create a color value for ImageScript (RGBA format)
   */
  private createColor(r: number, g: number, b: number, a: number = 255): number {
    return (r << 24) | (g << 16) | (b << 8) | a;
  }

  /**
   * Helper: Draw a simple character/glyph representation
   * Since we can't render actual fonts, we'll draw character-sized blocks
   */
  private drawSimpleChar(
    canvas: Image,
    char: string,
    x: number,
    y: number,
    charWidth: number,
    charHeight: number,
    color: number
  ): void {
    // For each character, draw a small filled rectangle to represent it
    // This creates a "text-like" appearance
    const padding = 1;

    for (let dy = padding; dy < charHeight - padding; dy++) {
      for (let dx = padding; dx < charWidth - padding; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          canvas.setPixelAt(px, py, color);
        }
      }
    }
  }

  /**
   * Helper: Create a text box canvas with the translated text
   * Returns a canvas with white background and black text representation
   */
  private createTextBoxCanvas(
    textElement: TextElement,
    width: number,
    height: number
  ): Image {
    console.log(`   📝 Creating text box: "${textElement.text.substring(0, 40)}..."`);
    console.log(`      Requested canvas size: ${width}x${height}px`);

    // Ensure minimum dimensions (ImageScript requires at least 1x1)
    const minWidth = Math.max(1, Math.floor(width));
    const minHeight = Math.max(1, Math.floor(height));

    if (minWidth !== width || minHeight !== height) {
      console.log(`      ⚠️ Adjusted to minimum: ${minWidth}x${minHeight}px`);
    }

    // Create canvas with specified dimensions
    const textCanvas = new Image(minWidth, minHeight);

    // Parse background color (default: white)
    const bgColorHex = textElement.backgroundColor || '#FFFFFF';
    const [bgR, bgG, bgB] = this.hexToRgba(bgColorHex);
    const bgColor = this.createColor(bgR, bgG, bgB, 255);

    // Fill background
    textCanvas.fill(bgColor);

    // Parse text color (default: black or from textElement.color)
    const textColorHex = textElement.color || '#000000';
    const [textR, textG, textB] = this.hexToRgba(textColorHex);
    const textColor = this.createColor(textR, textG, textB, 255);

    // Calculate font size
    const fontSize = parseInt(textElement.fontSize || '16');
    const charWidth = Math.max(Math.floor(fontSize * 0.6), 4); // Approximate character width
    const charHeight = Math.max(fontSize, 8);
    const lineHeight = Math.floor(charHeight * 1.3);

    // Text padding from edges
    const padding = Math.max(Math.floor(minWidth * 0.05), 2);
    const textWidth = minWidth - (padding * 2);

    // Word wrap the text
    const words = textElement.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = testLine.length * charWidth;

      if (testWidth > textWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    console.log(`      Text wrapped into ${lines.length} line(s)`);

    // Draw each line
    let yPos = padding;

    for (const line of lines) {
      if (yPos + charHeight > minHeight) break; // Don't overflow

      // Center the line horizontally
      const lineWidth = line.length * charWidth;
      let xPos = Math.floor((minWidth - lineWidth) / 2);
      xPos = Math.max(padding, xPos); // Ensure minimum padding

      // Draw each character
      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char !== ' ') { // Skip spaces
          this.drawSimpleChar(
            textCanvas,
            char,
            xPos + (i * charWidth),
            yPos,
            charWidth,
            charHeight,
            textColor
          );
        }
      }

      yPos += lineHeight;
    }

    // Draw a border around the text box for clarity
    const borderColor = this.createColor(100, 100, 100, 255); // Gray border
    const borderThickness = Math.min(2, Math.floor(Math.min(minWidth, minHeight) / 4)); // Adaptive thickness

    // Top and bottom borders
    for (let x = 0; x < minWidth; x++) {
      for (let t = 0; t < borderThickness; t++) {
        if (t < minHeight) {
          textCanvas.setPixelAt(x, t, borderColor);
        }
        if (minHeight - 1 - t >= 0 && minHeight - 1 - t < minHeight) {
          textCanvas.setPixelAt(x, minHeight - 1 - t, borderColor);
        }
      }
    }

    // Left and right borders
    for (let y = 0; y < minHeight; y++) {
      for (let t = 0; t < borderThickness; t++) {
        if (t < minWidth) {
          textCanvas.setPixelAt(t, y, borderColor);
        }
        if (minWidth - 1 - t >= 0 && minWidth - 1 - t < minWidth) {
          textCanvas.setPixelAt(minWidth - 1 - t, y, borderColor);
        }
      }
    }

    console.log(`   ✅ Text box canvas created`);
    return textCanvas;
  }

  /**
   * Helper: Composite (overlay) a text box canvas onto the main image
   */
  private compositeTextBox(
    mainImage: Image,
    textBoxCanvas: Image,
    position: Position
  ): void {
    const startX = Math.floor(Math.max(0, position.x));
    const startY = Math.floor(Math.max(0, position.y));
    const boxWidth = Math.min(textBoxCanvas.width, mainImage.width - startX);
    const boxHeight = Math.min(textBoxCanvas.height, mainImage.height - startY);

    console.log(`   🎨 Compositing at (${startX}, ${startY}), size: ${boxWidth}x${boxHeight}`);

    // Copy pixels from text box to main image
    for (let y = 0; y < boxHeight; y++) {
      for (let x = 0; x < boxWidth; x++) {
        const srcPixel = textBoxCanvas.getPixelAt(x, y);
        const destX = startX + x;
        const destY = startY + y;

        if (destX < mainImage.width && destY < mainImage.height) {
          // Get RGBA components
          const srcR = (srcPixel >> 24) & 0xFF;
          const srcG = (srcPixel >> 16) & 0xFF;
          const srcB = (srcPixel >> 8) & 0xFF;
          const srcA = srcPixel & 0xFF;

          if (srcA > 0) { // Only copy if not fully transparent
            // For now, do simple replacement (no alpha blending)
            // You can add alpha blending here if needed
            mainImage.setPixelAt(destX, destY, srcPixel);
          }
        }
      }
    }

    console.log(`   ✅ Text box composited`);
  }

  /**
   * render: Creates rendered output by overlaying text boxes
   */
  async render({
    userId,
    imagePath,
    contentToRender,
  }: {
    userId: ID;
    imagePath: string;
    contentToRender: RenderedContent;
  }): Promise<{ output: OutputVersion } | { error: string }> {
    try {
      console.log('🎨 ========== TEXT BOX RENDERING ==========');
      console.log('   - User ID:', userId);
      console.log('   - Media ID:', imagePath);
      console.log('   - Text elements:', contentToRender.textElements.length);

      // 1. Verify media file ownership
      const mediaFile = await this.mediaFiles.findOne({
        _id: imagePath,
        owner: userId
      });

      if (!mediaFile) {
        return { error: 'Media file not found or access denied' };
      }

      console.log('✅ Media file verified');

      // 2. Fetch image data from storage
      const imageDoc = await this.mediaStorage.findOne({
        mediaId: imagePath
      });

      if (!imageDoc || !imageDoc.imageData) {
        return { error: 'Image not found in storage' };
      }

      console.log('✅ Image found in storage');

      // 3. Decode base64 image
      let base64Data = imageDoc.imageData;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('✅ Image decoded:', imageBuffer.length, 'bytes');

      // 4. Load main image
      const mainImage = await Image.decode(imageBuffer);
      console.log(`✅ Main image loaded: ${mainImage.width}x${mainImage.height}`);

      // 5. Process each text element
      console.log('\n🎨 Creating and compositing text boxes...\n');

      for (let i = 0; i < contentToRender.textElements.length; i++) {
        const element = contentToRender.textElements[i];
        console.log(`Element ${i + 1}/${contentToRender.textElements.length}:`);

        // Validate position
        const pos = element.position;
        if (!pos || pos.x < 0 || pos.y < 0 || pos.x2 <= pos.x || pos.y2 <= pos.y) {
          console.warn(`   ⚠️ Invalid position, skipping`);
          console.warn(`      Position:`, pos);
          continue;
        }

        // Calculate text box dimensions
        let boxWidth = Math.floor(pos.x2 - pos.x);
        let boxHeight = Math.floor(pos.y2 - pos.y);

        // Ensure minimum dimensions
        if (boxWidth < 1) {
          console.warn(`   ⚠️ Box width too small (${boxWidth}), adjusting to 1px`);
          boxWidth = 1;
        }
        if (boxHeight < 1) {
          console.warn(`   ⚠️ Box height too small (${boxHeight}), adjusting to 1px`);
          boxHeight = 1;
        }

        // Log the box dimensions for debugging
        console.log(`   Box dimensions: ${boxWidth}x${boxHeight}px`);

        // Create text box canvas
        const textBoxCanvas = this.createTextBoxCanvas(element, boxWidth, boxHeight);

        // Composite onto main image
        this.compositeTextBox(mainImage, textBoxCanvas, pos);

        console.log('');
      }

      console.log('✅ All text boxes composited onto main image\n');

      // 6. Encode to PNG
      console.log('💾 Encoding final image to PNG...');
      const renderedBuffer = await mainImage.encode();
      const renderedBase64 = 'data:image/png;base64,' + btoa(String.fromCharCode(...renderedBuffer));

      console.log('✅ Encoded:', renderedBuffer.length, 'bytes');

      // 7. Save to database
      const newRenderedContent: RenderedContent = {
        textElements: contentToRender.textElements.map((te) => ({
          ...te,
          _id: crypto.randomUUID() as TextElementID,
        })),
      };

      const newOutputVersion: OutputVersion = {
        _id: crypto.randomUUID() as OutputVersionID,
        imagePath,
        renderedData: newRenderedContent,
        renderedImageData: renderedBase64,
        createdDate: new Date(),
        owner: userId,
      };

      await this.outputVersions.insertOne(newOutputVersion);
      console.log('✅ Output saved to database, ID:', newOutputVersion._id);
      console.log('========================================\n');

      return { output: newOutputVersion };
    } catch (error) {
      console.error('❌ Error rendering:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * export: Exports the rendered output
   */
  async export({
    outputId,
    destination,
    type,
  }: {
    outputId: OutputVersionID;
    destination: string;
    type: string;
  }): Promise<{ file: ExportedFile } | { error: string }> {
    try {
      const output = await this.outputVersions.findOne({ _id: outputId });
      if (!output) return { error: 'Output not found' };

      return {
        file: {
          name: `rendered_${outputId}.${type}`,
          content: output.renderedImageData || '',
          destination: `${destination}/rendered_${outputId}.${type}`,
        }
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // --- Queries ---

  async _getOutputVersionById({ userId, outputId }: { userId: ID; outputId: OutputVersionID }): Promise<OutputVersion[]> {
    const output = await this.outputVersions.findOne({ _id: outputId, owner: userId });
    return output ? [output] : [];
  }

  async _getAllOutputVersions({ userId }: { userId: ID }): Promise<OutputVersion[]> {
    return await this.outputVersions.find({ owner: userId }).toArray();
  }

  async _getOutputsByMediaId({ userId, mediaId }: { userId: ID; mediaId: ID }): Promise<OutputVersion[]> {
    return await this.outputVersions.find({ imagePath: mediaId, owner: userId }).toArray();
  }

  async _serveRenderedImage({ userId, outputId }: { userId: ID; outputId: OutputVersionID }): Promise<{ data: Uint8Array; contentType: string } | { error: string }> {
    try {
      const output = await this.outputVersions.findOne({ _id: outputId, owner: userId });

      if (!output || !output.renderedImageData) {
        return { error: 'Rendered image not found' };
      }

      let base64Data = output.renderedImageData;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      return {
        data: imageBuffer,
        contentType: 'image/png',
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
