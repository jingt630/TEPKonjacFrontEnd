import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Translation API Service
 * Handles all translation operations using AI
 */
class TranslationApiService {
  /**
   * Create a new translation using AI
   * @param {Object} params - Translation parameters
   * @param {string} params.imagePath - Path to the image
   * @param {string} params.targetLanguage - Target language code (e.g., "en", "fr")
   * @param {string} params.originalText - The text to translate
   * @param {string} params.originalTextId - ID of the original text
   * @returns {Promise<{translation: string} | {error: string}>}
   */
  async createTranslation({ imagePath, targetLanguage, originalText, originalTextId }) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_TRANSLATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath, targetLanguage, originalText, originalTextId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Edit an existing translation manually
   * @param {string} translationId - The translation ID
   * @param {string} newText - The new translated text
   * @returns {Promise<{} | {error: string}>}
   */
  async editTranslation(translationId, newText) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EDIT_TRANSLATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translationId, newText }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Change the target language and re-translate
   * @param {string} translationId - The translation ID
   * @param {string} newTargetLang - New target language code
   * @returns {Promise<{translation: string} | {error: string}>}
   */
  async changeLanguage(translationId, newTargetLang) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANGE_LANGUAGE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translationId, newTargetLang }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get a translation by its ID
   * @param {string} translationId - The translation ID
   * @returns {Promise<Array>}
   */
  async getTranslationById(translationId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_TRANSLATION_BY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translationId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting translation:', error);
      return [];
    }
  }

  /**
   * Get all translations for an original text
   * @param {string} originalTextId - The original text ID
   * @returns {Promise<Array>}
   */
  async getTranslationsByOriginalTextId(originalTextId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_TRANSLATIONS_BY_ORIGINAL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalTextId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting translations:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const translationApi = new TranslationApiService();
export default translationApi;

