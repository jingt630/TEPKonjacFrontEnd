import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Rendering API Service
 * Handles rendering text onto images and exporting
 */
class RenderingApiService {
  /**
   * Render text content onto an image
   * @param {string} imagePath - Path to the base image
   * @param {Object} contentToRender - Content with text elements to render
   * @param {Array} contentToRender.textElements - Array of text elements
   * @returns {Promise<{output: Object} | {error: string}>}
   */
  async render(imagePath, contentToRender) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RENDER_OUTPUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath, contentToRender }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Export a rendered output to a file
   * @param {string} outputId - The output version ID
   * @param {string} destination - Where to save the file
   * @param {string} type - Export type (e.g., "png", "jpeg", "pdf")
   * @returns {Promise<{file: Object} | {error: string}>}
   */
  async export(outputId, destination, type) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXPORT_OUTPUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outputId, destination, type }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get an output version by ID
   * @param {string} outputId - The output version ID
   * @returns {Promise<Array>}
   */
  async getOutputById(outputId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_OUTPUT_BY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outputId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting output:', error);
      return [];
    }
  }

  /**
   * Get all output versions
   * @returns {Promise<Array>}
   */
  async getAllOutputs() {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_ALL_OUTPUTS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting outputs:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const renderingApi = new RenderingApiService();
export default renderingApi;

