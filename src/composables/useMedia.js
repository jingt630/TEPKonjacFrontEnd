import { ref } from 'vue';
import { mediaApi } from '../services/mediaApi';

/**
 * Vue composable for media management
 * Provides reactive state and methods for working with media files and folders
 */
export function useMedia() {
  const mediaFiles = ref([]);
  const folders = ref([]);
  const currentPath = ref('');
  const loading = ref(false);
  const error = ref(null);

  /**
   * Load media files and folders from the current path
   */
  const loadMedia = async () => {
    loading.value = true;
    error.value = null;

    try {
      const [files, dirs] = await Promise.all([
        mediaApi.listMediaFiles(currentPath.value),
        mediaApi.listFolders(currentPath.value)
      ]);

      mediaFiles.value = files;
      folders.value = dirs;
    } catch (err) {
      error.value = 'Failed to load media: ' + err.message;
      console.error('Error loading media:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Upload a new media file
   */
  const uploadFile = async ({ filePath, mediaType, filename, relativePath }) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.upload({
        filePath: filePath || currentPath.value,
        mediaType,
        filename,
        relativePath
      });

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      await loadMedia();
      return { success: true, data: result };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete a media file
   */
  const deleteFile = async (mediaId) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.delete(mediaId);

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      await loadMedia();
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Move a media file to a new location
   */
  const moveFile = async (mediaId, newFilePath) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.move(mediaId, newFilePath);

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      await loadMedia();
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create a new folder
   */
  const createFolder = async (name, filePath = null) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.createFolder({
        filePath: filePath || currentPath.value,
        name
      });

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      await loadMedia();
      return { success: true, data: result };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get a specific media file by ID
   */
  const getMediaFile = async (mediaId) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.getMediaFile(mediaId);
      return { success: true, data: result };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update context (extracted text) for a media file
   */
  const updateContext = async (mediaId, extractionResult) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.updateContext(mediaId, extractionResult);

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Add translated text for a media file
   */
  const addTranslatedText = async (mediaId, translatedText) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaApi.addTranslatedText(mediaId, translatedText);

      if (result.error) {
        error.value = result.error;
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Navigate to a different path
   */
  const navigateTo = async (path) => {
    currentPath.value = path;
    await loadMedia();
  };

  return {
    // State
    mediaFiles,
    folders,
    currentPath,
    loading,
    error,

    // Methods
    loadMedia,
    uploadFile,
    deleteFile,
    moveFile,
    createFolder,
    getMediaFile,
    updateContext,
    addTranslatedText,
    navigateTo
  };
}
