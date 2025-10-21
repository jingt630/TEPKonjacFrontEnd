// API Configuration
// Backend is running on port 8000 with /api prefix
export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // ========== MediaManagement Concept ==========
  UPLOAD_MEDIA: '/MediaManagement/upload',
  DELETE_MEDIA: '/MediaManagement/delete',
  MOVE_MEDIA: '/MediaManagement/move',
  GET_MEDIA: '/MediaManagement/_getMediaFile',
  LIST_MEDIA: '/MediaManagement/_listMediaFiles',
  UPDATE_CONTEXT: '/MediaManagement/updateContext',
  ADD_TRANSLATED_TEXT: '/MediaManagement/addTranslatedText',
  CREATE_FOLDER: '/MediaManagement/createFolder',
  LIST_FOLDERS: '/MediaManagement/_listFolders',

  // ========== TextExtraction Concept ==========
  EXTRACT_TEXT: '/TextExtraction/extractTextFromMedia',
  EDIT_EXTRACTED_TEXT: '/TextExtraction/editExtractText',
  EDIT_EXTRACTION_LOCATION: '/TextExtraction/editLocation',
  ADD_MANUAL_EXTRACTION: '/TextExtraction/addExtractionTxt',
  DELETE_EXTRACTION: '/TextExtraction/deleteExtraction',
  GET_EXTRACTIONS_FOR_IMAGE: '/TextExtraction/_getExtractionResultsForImage',
  GET_EXTRACTION_LOCATION: '/TextExtraction/_getLocationForExtraction',

  // ========== Translation Concept ==========
  CREATE_TRANSLATION: '/Translation/createTranslation',
  EDIT_TRANSLATION: '/Translation/editTranslation',
  CHANGE_LANGUAGE: '/Translation/changeLanguage',
  GET_TRANSLATION_BY_ID: '/Translation/_getTranslationById',
  GET_TRANSLATIONS_BY_ORIGINAL: '/Translation/_getTranslationsByOriginalTextId',

  // ========== Rendering Concept ==========
  RENDER_OUTPUT: '/Rendering/render',
  EXPORT_OUTPUT: '/Rendering/export',
  GET_OUTPUT_BY_ID: '/Rendering/_getOutputVersionById',
  GET_ALL_OUTPUTS: '/Rendering/_getAllOutputVersions',

  // ========== User Concept ==========
  CREATE_USER: '/User/create',
  DELETE_USER: '/User/delete',
  CHANGE_PROFILE_PIC: '/User/changeProfilePic',
  GET_USER_BY_EMAIL: '/User/_getUserByEmail',
  GET_USER_BY_ID: '/User/_getUserById',
  GET_USER_PROFILE_PIC: '/User/_getUserProfilePic',
  GET_USER_USERNAME: '/User/_getUserUsername',
  GET_USER_EMAIL: '/User/_getUserEmail',
  GET_ALL_USERS: '/User/_getAllUsers',
};
