import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * User API Service
 * Handles all user management operations
 */
class UserApiService {
  /**
   * Create a new user
   * @param {Object} params - User parameters
   * @param {string} params.username - Username (alphanumeric, underscores, hyphens)
   * @param {string} params.password - Password (alphanumeric, underscores, hyphens)
   * @param {string} params.profilePic - Profile picture (image string/URL)
   * @param {string} params.email - Email address
   * @returns {Promise<{user: string} | {error: string}>}
   */
  async createUser({ username, password, profilePic, email }) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_USER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, profilePic, email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Delete a user
   * @param {string} userId - The user ID
   * @returns {Promise<{} | {error: string}>}
   */
  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_USER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Change a user's profile picture
   * @param {string} userId - The user ID
   * @param {string} newProfilePic - New profile picture
   * @returns {Promise<{} | {error: string}>}
   */
  async changeProfilePic(userId, newProfilePic) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANGE_PROFILE_PIC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newProfilePic }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get user by email
   * @param {string} email - The email address
   * @returns {Promise<{user: string} | {error: string}>}
   */
  async getUserByEmail(email) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_BY_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - The user ID
   * @returns {Promise<{user: string} | {error: string}>}
   */
  async getUserById(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_BY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get user's profile picture
   * @param {string} userId - The user ID
   * @returns {Promise<{profilePic: string} | {error: string}>}
   */
  async getUserProfilePic(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_PROFILE_PIC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get user's username
   * @param {string} userId - The user ID
   * @returns {Promise<{username: string} | {error: string}>}
   */
  async getUserUsername(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_USERNAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get user's email
   * @param {string} userId - The user ID
   * @returns {Promise<{email: string} | {error: string}>}
   */
  async getUserEmail(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all users
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_ALL_USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const userApi = new UserApiService();
export default userApi;

