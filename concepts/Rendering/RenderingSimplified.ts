import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";

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
 * An OutputVersion object representing rendering instructions.
 */
interface OutputVersion {
  _id: OutputVersionID;
  imagePath: string;
  renderedData: RenderedContent;
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

  constructor(private readonly db: Db) {
    this.outputVersions = this.db.collection(PREFIX + "outputVersions");
  }

  /**
   * render (userId: ID, imagePath: String, contentToRender: RenderedContent): (output: OutputVersion)
   *
   * **requires**: `imagePath` exists. `contentToRender` contains valid rendering instructions.
   *
   * **effects**: Creates a new `OutputVersion` by storing the rendering instructions.
   * The actual rendering happens on the frontend.
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
      console.log('🎨 ========== RENDERING (Simplified) ==========');
      console.log('   - User ID:', userId);
      console.log('   - Media ID (imagePath):', imagePath);
      console.log('   - Text elements to render:', contentToRender.textElements.length);

      // Validate input
      if (!userId || !imagePath) {
        return { error: 'Missing required fields: userId or imagePath' };
      }

      if (!contentToRender.textElements || contentToRender.textElements.length === 0) {
        return { error: 'No text elements to render' };
      }

      // Create OutputVersion document with generated IDs
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
        createdDate: new Date(),
        owner: userId,
      };

      // Save to database
      await this.outputVersions.insertOne(newOutputVersion);
      console.log('✅ Output version saved to database, ID:', newOutputVersion._id);
      console.log('✅ Rendering instructions stored (actual rendering happens on frontend)');
      console.log('========================================');

      return { output: newOutputVersion };
    } catch (error) {
      console.error('❌ Error creating render output:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * export (outputId: OutputVersionID, destination: String, type: String): (file: File)
   *
   * **requires**: `output` exists. `destination` is a valid path. `type` is a supported export format.
   *
   * **effects**: Returns the rendering instructions for the specified output.
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
        name: `${outputId}.${type}`,
        content: JSON.stringify(output.renderedData, null, 2),
        destination: `${destination}/${outputId}.${type}`,
      };

      console.log(`✅ Export data prepared for ${outputId}`);
      return { file: exportedFile };
    } catch (error) {
      console.error('❌ Error exporting:', error);
      return { error: (error as Error).message };
    }
  }

  // --- Queries ---

  /**
   * _getOutputVersionById (userId: ID, outputId: OutputVersionID): (output: OutputVersion)
   */
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

  /**
   * _getAllOutputVersions (userId: ID): (output: OutputVersion)
   */
  async _getAllOutputVersions({
    userId
  }: {
    userId: ID;
  }): Promise<OutputVersion[]> {
    return await this.outputVersions.find({ owner: userId }).toArray();
  }

  /**
   * _getOutputsByMediaId (userId: ID, mediaId: ID): (outputs: OutputVersion[])
   */
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
   * _serveRenderedImage - Returns rendering instructions as JSON
   * (Actual rendering happens on frontend)
   */
  async _serveRenderedImage({
    userId,
    outputId,
  }: {
    userId: ID;
    outputId: OutputVersionID;
  }): Promise<{ renderingInstructions: RenderedContent } | { error: string }> {
    try {
      const output = await this.outputVersions.findOne({
        _id: outputId,
        owner: userId
      });

      if (!output) {
        return { error: 'Output version not found' };
      }

      console.log(`✅ Returning rendering instructions for output: ${outputId}`);
      return { renderingInstructions: output.renderedData };
    } catch (error) {
      console.error('Error getting rendering instructions:', error);
      return { error: (error as Error).message };
    }
  }
}
