/**
 * Type definitions for Media Management API
 * These are JSDoc type definitions for better IDE support
 */

/**
 * @typedef {string} ID
 * A unique identifier type
 */

/**
 * @typedef {ID} User
 * A unique identifier for a user
 */

/**
 * @typedef {Object} MediaFile
 * Represents a managed media file
 * @property {ID} _id - Unique identifier for the media file
 * @property {string} filename - The original name of the uploaded file
 * @property {string} filePath - The path within local storage where the file is located
 * @property {string} mediaType - e.g., "png", "jpg", "webp"
 * @property {string} cloudURL - The path in the cloud storage that represents this MediaFile
 * @property {Date} uploadDate - When the file was uploaded
 * @property {Date} updateDate - The last time this MediaFile's metadata was updated
 * @property {Record<string, string>} [context] - Result of text extraction for this media (optional)
 * @property {Record<string, string>} [translatedText] - Rendered translated versions of the context (optional)
 * @property {User} owner - The user who owns this media file
 */

/**
 * @typedef {Object} Folder
 * Represents a folder structure within the managed storage
 * @property {ID} _id - Unique identifier for the folder
 * @property {string} filePath - The full path of the folder
 * @property {string} name - The name of the folder
 * @property {User} owner - The user who owns this folder
 */

export {};
