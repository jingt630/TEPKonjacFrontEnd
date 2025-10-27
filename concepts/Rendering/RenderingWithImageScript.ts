import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

// Declare collection prefix, use concept name
const PREFIX = "OutputRender" + ".";

// Generic types of this concept
type OutputVersionID = ID;
type TextElementID = ID;

/**
 * A Position object with x, y, x2, y2 coordinates.
 */
interface Position {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

/**
 * A TextElement object with text, position, and optional rendering properties.
 */
interface TextElement {
  _id?: TextElementID;
  text: string;
  position: Position;
  fontSize?: string;
  color?: string;
}

/**
 * RenderedContent object containing a list of text elements.
 */
interface RenderedContent {
  textElements: TextElement[];
}

/**
 * An OutputVersion object representing a generated media file.
 */
interface OutputVersion {
  _id: OutputVersionID;
  imagePath: string;
  renderedData: RenderedContent;
  renderedImageData?: string; // Base64 encoded rendered image
  createdDate: Date;
  owner: ID;
}

/**
 * ExportedFile object to represent local filepath
 */
interface ExportedFile {
  name: string;
  content: string;
  destination: string;
}

export default class RenderingConcept {
  outputVersions: Collection<OutputVersion>;
  mediaStorage: Collection<any>; // For accessing stored images

  constructor(private readonly db: Db) {
    this.outputVersions = this.db.collection(PREFIX + "outputVersions");
    this.mediaStorage = this.db.collection("MediaStorage.images");
  }

  /**
   * Helper function to parse hex color to RGBA
   */
  private hexToRgba(hex: string, alpha: number = 1): [number, number, number, number] {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b, Math.floor(alpha * 255)];
  }

  /**
   * Helper function to draw text with background
   */
  private async overlayTextOnImage(
    image: Image,
    textElement: TextElement
  ): Promise<void> {
    const pos = textElement.position;
    const text = textElement.text;

    // Calculate dimensions
    const boxX = Math.floor(pos.x);
    const boxY = Math.floor(pos.y);
    const boxWidth = Math.floor(pos.x2 - pos.x);
    const boxHeight = Math.floor(pos.y2 - pos.y);

    console.log(`   📝 Overlaying text: "${text.substring(0, 30)}..."`);
    console.log(`      Position: (${boxX}, ${boxY}) Size: ${boxWidth}x${boxHeight}`);

    // Draw semi-transparent black background
    const bgColor = [0, 0, 0, 180]; // Black with 70% opacity

    for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
      for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
        // Get existing pixel
        const existingColor = image.getPixelAt(x, y);

        // Alpha blend with background
        const alpha = bgColor[3] / 255;
        const r = Math.floor(bgColor[0] * alpha + (existingColor >> 24 & 0xFF) * (1 - alpha));
        const g = Math.floor(bgColor[1] * alpha + (existingColor >> 16 & 0xFF) * (1 - alpha));
        const b = Math.floor(bgColor[2] * alpha + (existingColor >> 8 & 0xFF) * (1 - alpha));
        const a = 255;

        image.setPixelAt(x, y, (r << 24) | (g << 16) | (b << 8) | a);
      }
    }

    // Parse text color
    const textColorHex = textElement.color || '#FFFFFF';
    const textColor = this.hexToRgba(textColorHex);

    // For now, we'll draw a simple representation
    // Note: ImageScript doesn't have built-in text rendering with fonts
    // So we'll draw the text area with a border to show where text would go

    // Draw border around text area
    const borderColor = (textColor[0] << 24) | (textColor[1] << 16) | (textColor[2] << 8) | 255;

    // Top border
    for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
      if (boxY >= 0 && boxY < image.height) {
        image.setPixelAt(x, boxY, borderColor);
      }
    }

    // Bottom border
    for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
      const y = boxY + boxHeight - 1;
      if (y >= 0 && y < image.height) {
        image.setPixelAt(x, y, borderColor);
      }
    }

    // Left border
    for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
      if (boxX >= 0 && boxX < image.width) {
        image.setPixelAt(boxX, y, borderColor);
      }
    }

    // Right border
    for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
      const x = boxX + boxWidth - 1;
      if (x >= 0 && x < image.width) {
        image.setPixelAt(x, y, borderColor);
      }
    }

    console.log(`   ✅ Text overlay area rendered`);
  }

  /**
   * render (userId: ID, imagePath: String, contentToRender: RenderedContent): (output: OutputVersion)
   *
   * **requires**: `imagePath` exists. `contentToRender` contains valid rendering instructions.
   *
   * **effects**: Creates a new `OutputVersion` by overlaying the `contentToRender` onto the image.
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
      console.log('🎨 ========== RENDERING IMAGE WITH OVERLAY ==========');
      console.log('   - User ID:', userId);
      console.log('   - Media ID (imagePath):', imagePath);
      console.log('   - Text elements to render:', contentToRender.textElements.length);

      // 1. Fetch image from MediaStorage
      const imageDoc = await this.mediaStorage.findOne({
        mediaId: imagePath,
        owner: userId
      });

      if (!imageDoc || !imageDoc.imageData) {
        console.error('❌ Image not found in storage');
        return { error: 'Image not found in storage' };
      }

      console.log('✅ Image found in storage');

      // 2. Decode base64 image data
      let base64Data = imageDoc.imageData;

      // Strip data URI prefix if present
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      // Decode base64 to buffer
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('✅ Image decoded, size:', imageBuffer.length, 'bytes');

      // 3. Load image using ImageScript
      console.log('📷 Loading image with ImageScript...');
      const image = await Image.decode(imageBuffer);
      console.log(`✅ Image loaded: ${image.width}x${image.height}`);

      // 4. Overlay text elements
      console.log('🎨 Overlaying text elements...');
      for (let i = 0; i < contentToRender.textElements.length; i++) {
        const element = contentToRender.textElements[i];
        console.log(`   Processing element ${i + 1}/${contentToRender.textElements.length}`);

        // Validate position
        if (!element.position ||
            element.position.x < 0 || element.position.y < 0 ||
            element.position.x2 <= element.position.x ||
            element.position.y2 <= element.position.y) {
          console.warn(`   ⚠️ Invalid position for element ${i + 1}, skipping`);
          continue;
        }

        await this.overlayTextOnImage(image, element);
      }

      console.log('✅ All text elements overlaid');

      // 5. Encode image to PNG
      console.log('💾 Encoding rendered image to PNG...');
      const renderedBuffer = await image.encode();
      const renderedBase64 = 'data:image/png;base64,' + btoa(String.fromCharCode(...renderedBuffer));

      console.log('✅ Rendered image encoded, size:', renderedBuffer.length, 'bytes');

      // 6. Create OutputVersion document
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

      // 7. Save to database
      await this.outputVersions.insertOne(newOutputVersion);
      console.log('✅ Output version saved to database, ID:', newOutputVersion._id);
      console.log('========================================');

      return { output: newOutputVersion };
    } catch (error) {
      console.error('❌ Error rendering image:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * export (outputId: OutputVersionID, destination: String, type: String): (file: File)
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
      console.log(`📦 Exporting output version ${outputId}`);

      const output = await this.outputVersions.findOne({ _id: outputId });

      if (!output) {
        return { error: 'Output version not found' };
      }

      const exportedFile: ExportedFile = {
        name: `rendered_${outputId}.${type}`,
        content: output.renderedImageData || '',
        destination: `${destination}/rendered_${outputId}.${type}`,
      };

      console.log(`✅ Export data prepared for ${outputId}`);
      return { file: exportedFile };
    } catch (error) {
      console.error('❌ Error exporting:', error);
      return { error: (error as Error).message };
    }
  }

  // --- Queries ---

  async _getOutputVersionById({
    userId,
    outputId,
  }: {
    userId: ID;
    outputId: OutputVersionID;
  }): Promise<OutputVersion[]> {
    const output = await this.outputVersions.findOne({
      _id: outputId,
      owner: userId
    });
    return output ? [output] : [];
  }

  async _getAllOutputVersions({
    userId
  }: {
    userId: ID;
  }): Promise<OutputVersion[]> {
    return await this.outputVersions.find({ owner: userId }).toArray();
  }

  async _getOutputsByMediaId({
    userId,
    mediaId,
  }: {
    userId: ID;
    mediaId: ID;
  }): Promise<OutputVersion[]> {
    return await this.outputVersions.find({
      imagePath: mediaId,
      owner: userId
    }).toArray();
  }

  /**
   * _serveRenderedImage - Returns the rendered image as binary data
   */
  async _serveRenderedImage({
    userId,
    outputId,
  }: {
    userId: ID;
    outputId: OutputVersionID;
  }): Promise<{ data: Uint8Array; contentType: string } | { error: string }> {
    try {
      const output = await this.outputVersions.findOne({
        _id: outputId,
        owner: userId
      });

      if (!output || !output.renderedImageData) {
        return { error: 'Rendered image not found' };
      }

      // Decode base64 to binary
      let base64Data = output.renderedImageData;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      console.log(`✅ Serving rendered image: ${outputId} (${imageBuffer.length} bytes)`);

      return {
        data: imageBuffer,
        contentType: 'image/png',
      };
    } catch (error) {
      console.error('Error serving rendered image:', error);
      return { error: (error as Error).message };
    }
  }
}
