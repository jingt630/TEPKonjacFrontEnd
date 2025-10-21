import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Text Extraction API Service
 * Handles all text extraction operations
 */
class TextExtractionApiService {
  /**
   * Extract text from a media file (automated AI extraction)
   * @param {string} image - FilePath of the image
   * @returns {Promise<{result: string} | {error: string}>}
   */
  async extractText(image) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXTRACT_TEXT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Edit the text of an existing extraction
   * @param {string} extractedText - ExtractionResult ID
   * @param {string} newText - The new text content
   * @returns {Promise<{} | {error: string}>}
   */
  async editText(extractedText, newText) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_EXTRACTED_TEXT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedText, newText }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Edit the location (coordinates) of an extraction
   * @param {string} extractedText - ExtractionResult ID
   * @param {Array} fromCoord - [x1, y1] coordinates
   * @param {Array} toCoord - [x2, y2] coordinates
   * @returns {Promise<{} | {error: string}>}
   */
  async editLocation(extractedText, fromCoord, toCoord) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_EXTRACTION_LOCATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractedText, fromCoord, toCoord }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Add a manual extraction (user-defined text region)
   * @param {string} media - FilePath of the media
   * @param {Array} fromCoord - [x1, y1] coordinates
   * @param {Array} toCoord - [x2, y2] coordinates
   * @returns {Promise<{result: string} | {error: string}>}
   */
  async addManualExtraction(media, fromCoord, toCoord) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_MANUAL_EXTRACTION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media, fromCoord, toCoord }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete an extraction
   * @param {string} textId - The text ID
   * @param {string} imagePath - The image file path
   * @returns {Promise<{} | {error: string}>}
   */
  async deleteExtraction(textId, imagePath) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_EXTRACTION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textId, imagePath }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all extractions for an image
   * @param {string} imagePath - The image file path
   * @returns {Promise<Array>}
   */
  async getExtractionsForImage(imagePath) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_EXTRACTIONS_FOR_IMAGE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting extractions:', error);
      return [];
    }
  }

  /**
   * Get location for a specific extraction
   * @param {string} extractionResultId - The extraction result ID
   * @returns {Promise<Array>}
   */
  async getExtractionLocation(extractionResultId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_EXTRACTION_LOCATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extractionResultId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting location:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const textExtractionApi = new TextExtractionApiService();
export default textExtractionApi;

