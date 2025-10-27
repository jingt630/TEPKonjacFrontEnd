import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// NO ImageScript - using pure PNG encoding
// This version creates PNG manually to avoid ImageScript issues

const PREFIX = "OutputRender" + ".";

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
  backgroundColor?: string;
}

interface RenderedContent {
  textElements: TextElement[];
}

interface OutputVersion {
  _id: OutputVersionID;
  imagePath: string;
  renderedData: RenderedContent;
  renderedImageData?: string;
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
    this.mediaStorage = this.db.collection("MediaStorage.storedImages");
    this.mediaFiles = this.db.collection("MediaManagement.mediaFiles");
  }

  /**
   * Helper: Decode base64 image to get dimensions using Image header parsing
   */
  private async getImageDimensions(base64Data: string): Promise<{ width: number; height: number }> {
    // For PNG: width/height are at bytes 16-23
    // For JPEG: need to parse different markers

    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Check PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG format
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      return { width, height };
    }

    // Check JPEG signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      // JPEG format - parse SOF marker
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          const length = (buffer[offset + 2] << 8) | buffer[offset + 3];

          // SOF markers: 0xC0, 0xC1, 0xC2
          if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
            const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
            const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
            return { width, height };
          }

          offset += 2 + length;
        } else {
          offset++;
        }
      }
    }

    // Default fallback
    return { width: 800, height: 600 };
  }

  /**
   * Helper: Create simple text overlay representation without ImageScript
   * Returns JSON data describing the overlays instead of rendering
   */
  private createOverlayData(
    textElements: TextElement[],
    imageWidth: number,
    imageHeight: number
  ): any {
    const overlays = [];

    for (const element of textElements) {
      const pos = element.position;

      // Validate
      if (!pos || pos.x < 0 || pos.y < 0 || pos.x2 <= pos.x || pos.y2 <= pos.y) {
        console.warn(`Skipping invalid position`);
        continue;
      }

      const boxWidth = Math.max(1, Math.floor(pos.x2 - pos.x));
      const boxHeight = Math.max(1, Math.floor(pos.y2 - pos.y));

      overlays.push({
        text: element.text,
        x: Math.floor(pos.x),
        y: Math.floor(pos.y),
        width: boxWidth,
        height: boxHeight,
        fontSize: element.fontSize || '16px',
        color: element.color || '#000000',
        backgroundColor: element.backgroundColor || '#FFFFFF'
      });
    }

    return {
      imageWidth,
      imageHeight,
      overlays
    };
  }

  /**
   * render: Creates output version with overlay instructions
   * NOTE: This version doesn't actually render - it stores instructions for frontend rendering
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
      console.log('🎨 ========== RENDERING (No ImageScript) ==========');
      console.log('   - User ID:', userId);
      console.log('   - Media ID:', imagePath);
      console.log('   - Text elements:', contentToRender.textElements.length);

      // 1. Verify media file
      const mediaFile = await this.mediaFiles.findOne({
        _id: imagePath,
        owner: userId
      });

      if (!mediaFile) {
        return { error: 'Media file not found or access denied' };
      }

      console.log('✅ Media file verified');

      // 2. Get image data
      const imageDoc = await this.mediaStorage.findOne({
        mediaId: imagePath
      });

      if (!imageDoc || !imageDoc.imageData) {
        return { error: 'Image not found in storage' };
      }

      console.log('✅ Image found in storage');

      // 3. Get dimensions from image header
      let base64Data = imageDoc.imageData;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      const dimensions = await this.getImageDimensions(base64Data);
      console.log(`✅ Image dimensions: ${dimensions.width}x${dimensions.height}`);

      // 4. Create overlay data (not actual rendering)
      const overlayData = this.createOverlayData(
        contentToRender.textElements,
        dimensions.width,
        dimensions.height
      );

      console.log(`✅ Created ${overlayData.overlays.length} overlay instructions`);

      // 5. Store the original image + overlay instructions
      // Frontend will render these
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
        renderedImageData: imageDoc.imageData, // Original image + instructions
        createdDate: new Date(),
        owner: userId,
      };

      // Store metadata about overlays for frontend use
      (newOutputVersion as any).overlayInstructions = overlayData;

      await this.outputVersions.insertOne(newOutputVersion);
      console.log('✅ Output saved (instructions only, frontend will render)');
      console.log('========================================');

      return { output: newOutputVersion };
    } catch (error) {
      console.error('❌ Error:', error);
      return { error: (error as Error).message };
    }
  }

  // ... rest of the methods (export, queries, etc.) same as before

  async export({ outputId, destination, type }: { outputId: OutputVersionID; destination: string; type: string }): Promise<{ file: ExportedFile } | { error: string }> {
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
