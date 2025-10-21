import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useUserStore } from '../stores/userStore';

/**
 * Media Management API Service
 * Handles all API calls to the backend
 */
class MediaApiService {
  /**
   * Get current user ID from store
   */
  getUserId() {
    const userStore = useUserStore();
    return userStore.userId || 'anonymous';
  }
  /**
   * Upload a new media file
   * @param {Object} params - Upload parameters
   * @param {string} params.filePath - Conceptual path in managed storage
   * @param {string} params.mediaType - MIME type or file extension
   * @param {string} params.filename - Original filename
   * @param {string} params.relativePath - Valid pathway on user's computer
   * @returns {Promise<MediaFile | {error: string}>}
   */
  async upload({ filePath, mediaType, filename, relativePath }) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_MEDIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          filePath,
          mediaType,
          filename,
          relativePath,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a media file
   * @param {string} mediaId - The unique identifier of the media file
   * @returns {Promise<{} | {error: string}>}
   */
  async delete(mediaId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_MEDIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          mediaId
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Move a media file to a new location
   * @param {string} mediaId - The unique identifier of the media file
   * @param {string} newFilePath - The new conceptual path
   * @returns {Promise<{} | {error: string}>}
   */
  async move(mediaId, newFilePath) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MOVE_MEDIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          mediaId,
          newFilePath
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get a specific media file by ID
   * @param {string} mediaId - The unique identifier of the media file
   * @returns {Promise<MediaFile[]>}
   */
  async getMediaFile(mediaId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_MEDIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          mediaId
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching media file:', error);
      return [];
    }
  }

  /**
   * List all media files in a directory
   * @param {string} filePath - The directory path to list files from
   * @returns {Promise<MediaFile[]>}
   */
  async listMediaFiles(filePath = '') {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LIST_MEDIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          filePath
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listing media files:', error);
      return [];
    }
  }

  /**
   * Update the extracted text context for a media file
   * @param {string} mediaId - The unique identifier of the media file
   * @param {Record<string, string>} extractionResult - Dictionary of extracted text
   * @returns {Promise<{} | {error: string}>}
   */
  async updateContext(mediaId, extractionResult) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_CONTEXT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          mediaId,
          extractionResult
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Add or update translated text for a media file
   * @param {string} mediaId - The unique identifier of the media file
   * @param {Record<string, string>} translatedText - Dictionary of translated text
   * @returns {Promise<{} | {error: string}>}
   */
  async addTranslatedText(mediaId, translatedText) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_TRANSLATED_TEXT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getUserId(),
          mediaId,
          translatedText
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Create a new folder
   * @param {Object} params - Folder parameters
   * @param {string} params.filePath - The parent path for the new folder
   * @param {string} params.name - The name of the new folder
   * @returns {Promise<Folder | {error: string}>}
   */
  async createFolder({ filePath, name }) {
    try {
      const userId = this.getUserId();
      console.log('📤 Sending createFolder with userId:', userId);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_FOLDER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          filePath,
          name
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * List all folders in a directory
   * @param {string} filePath - The directory path to list folders from
   * @returns {Promise<Folder[]>}
   */
  async listFolders(filePath = '') {
    try {
      const userId = this.getUserId();
      console.log('📤 Sending listFolders with userId:', userId);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LIST_FOLDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          filePath
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listing folders:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const mediaApi = new MediaApiService();
export default mediaApi;
