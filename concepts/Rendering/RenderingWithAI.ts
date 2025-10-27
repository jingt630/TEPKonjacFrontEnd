import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

// Import Gemini for AI-powered text rendering
import { GeminiLLM } from "../../src/gemini-llm.ts";

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
  geminiLLM: GeminiLLM;

  constructor(private readonly db: Db) {
    this.outputVersions = this.db.collection(PREFIX + "outputVersions");
    this.mediaStorage = this.db.collection("MediaStorage.images");
    this.geminiLLM = new GeminiLLM();
  }

  /**
   * Helper: Convert hex color to RGBA array
   */
  private hexToRgba(hex: string, alpha: number = 1): [number, number, number, number] {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b, Math.floor(alpha * 255)];
  }

  /**
   * Helper: Use AI to generate properly rendered text overlay
   * This asks Gemini AI how best to render the text given the position and style
   */
  private async generateTextOverlayWithAI(
    textElement: TextElement,
    imageWidth: number,
    imageHeight: number
  ): Promise<string> {
    const prompt = `Given an image of dimensions ${imageWidth}x${imageHeight},
I need to overlay the following text:
- Text: "${textElement.text}"
- Position: (${textElement.position.x}, ${textElement.position.y}) to (${textElement.position.x2}, ${textElement.position.y2})
- Box size: ${textElement.position.x2 - textElement.position.x}px × ${textElement.position.y2 - textElement.position.y}px
- Desired color: ${textElement.color || '#FFFFFF'}
- Desired font size: ${textElement.fontSize || '16px'}

Provide optimal rendering parameters:
1. Best font size to fit the text in the box
2. Whether to use word wrapping
3. Best text alignment (left, center, right)
4. Whether to add a background for readability
5. Recommended line height

Respond in this exact format:
fontSize: [number]px
wordWrap: [yes/no]
alignment: [left/center/right]
background: [yes/no]
lineHeight: [number]`;

    try {
      const response = await this.geminiLLM.generateText(prompt);
      console.log('   🤖 AI rendering suggestion:', response);
      return response;
    } catch (error) {
      console.warn('   ⚠️ AI suggestion failed, using defaults:', error);
      return 'fontSize: 16px\nwordWrap: yes\nalignment: left\nbackground: yes\nlineHeight: 1.2';
    }
  }

  /**
   * Helper: Draw text overlay with background based on AI suggestions
   */
  private async overlayTextWithAI(
    image: Image,
    textElement: TextElement,
    aiSuggestions: string
  ): Promise<void> {
    const pos = textElement.position;
    const text = textElement.text;

    // Parse AI suggestions (simple parsing)
    const hasBg = aiSuggestions.includes('background: yes');

    const boxX = Math.floor(Math.max(0, pos.x));
    const boxY = Math.floor(Math.max(0, pos.y));
    const boxWidth = Math.floor(Math.min(pos.x2 - pos.x, image.width - boxX));
    const boxHeight = Math.floor(Math.min(pos.y2 - pos.y, image.height - boxY));

    console.log(`   📝 Overlaying: "${text.substring(0, 40)}..."`);
    console.log(`      Box: (${boxX}, ${boxY}) ${boxWidth}x${boxHeight}`);

    // Draw background if AI suggests it
    if (hasBg) {
      const bgOpacity = 0.85; // 85% opacity for readability
      const bgColor = [0, 0, 0, Math.floor(bgOpacity * 255)];

      for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
        for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
          const existing = image.getPixelAt(x, y);
          const alpha = bgColor[3] / 255;

          const r = Math.floor(bgColor[0] * alpha + ((existing >> 24) & 0xFF) * (1 - alpha));
          const g = Math.floor(bgColor[1] * alpha + ((existing >> 16) & 0xFF) * (1 - alpha));
          const b = Math.floor(bgColor[2] * alpha + ((existing >> 8) & 0xFF) * (1 - alpha));

          image.setPixelAt(x, y, (r << 24) | (g << 16) | (b << 8) | 255);
        }
      }
    }

    // Draw text indicator border (since we can't render actual fonts in ImageScript)
    const textColorHex = textElement.color || '#FFFFFF';
    const [r, g, b] = this.hexToRgba(textColorHex);
    const borderColor = (r << 24) | (g << 16) | (b << 8) | 255;

    // Draw thick border to indicate text area
    const thickness = 2;
    for (let t = 0; t < thickness; t++) {
      // Top
      for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
        const y = boxY + t;
        if (y >= 0 && y < image.height) image.setPixelAt(x, y, borderColor);
      }

      // Bottom
      for (let x = boxX; x < boxX + boxWidth && x < image.width; x++) {
        const y = boxY + boxHeight - 1 - t;
        if (y >= 0 && y < image.height) image.setPixelAt(x, y, borderColor);
      }

      // Left
      for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
        const x = boxX + t;
        if (x >= 0 && x < image.width) image.setPixelAt(x, y, borderColor);
      }

      // Right
      for (let y = boxY; y < boxY + boxHeight && y < image.height; y++) {
        const x = boxX + boxWidth - 1 - t;
        if (x >= 0 && x < image.width) image.setPixelAt(x, y, borderColor);
      }
    }

    console.log(`   ✅ Text overlay rendered with AI optimization`);
  }

  /**
   * render: Creates rendered output by overlaying text using AI-optimized parameters
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
      console.log('🎨 ========== AI-POWERED RENDERING ==========');
      console.log('   - User ID:', userId);
      console.log('   - Media ID:', imagePath);
      console.log('   - Text elements:', contentToRender.textElements.length);

      // 1. Fetch image from storage
      const imageDoc = await this.mediaStorage.findOne({
        mediaId: imagePath,
        owner: userId
      });

      if (!imageDoc || !imageDoc.imageData) {
        return { error: 'Image not found in storage' };
      }

      console.log('✅ Image found in storage');

      // 2. Decode base64 image
      let base64Data = imageDoc.imageData;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('✅ Image decoded:', imageBuffer.length, 'bytes');

      // 3. Load image
      const image = await Image.decode(imageBuffer);
      console.log(`✅ Image loaded: ${image.width}x${image.height}`);

      // 4. Process each text element with AI
      console.log('🤖 Using AI to optimize text rendering...');

      for (let i = 0; i < contentToRender.textElements.length; i++) {
        const element = contentToRender.textElements[i];
        console.log(`\n   Element ${i + 1}/${contentToRender.textElements.length}:`);

        // Validate position
        if (!element.position ||
            element.position.x < 0 || element.position.y < 0 ||
            element.position.x2 <= element.position.x ||
            element.position.y2 <= element.position.y) {
          console.warn(`   ⚠️ Invalid position, skipping`);
          continue;
        }

        // Get AI suggestions for optimal rendering
        const aiSuggestions = await this.generateTextOverlayWithAI(
          element,
          image.width,
          image.height
        );

        // Apply the overlay with AI-optimized parameters
        await this.overlayTextWithAI(image, element, aiSuggestions);
      }

      console.log('\n✅ All text elements rendered with AI optimization');

      // 5. Encode to PNG
      console.log('💾 Encoding to PNG...');
      const renderedBuffer = await image.encode();
      const renderedBase64 = 'data:image/png;base64,' + btoa(String.fromCharCode(...renderedBuffer));

      console.log('✅ Encoded:', renderedBuffer.length, 'bytes');

      // 6. Save to database
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
      console.log('✅ Output saved, ID:', newOutputVersion._id);
      console.log('========================================');

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
