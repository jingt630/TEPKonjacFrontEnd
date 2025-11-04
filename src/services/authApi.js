import { API_BASE_URL } from '../config/api';

/**
 * Authentication API Service
 * Handles login, logout, and session management
 */
class AuthApiService {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, token?: string, userId?: string, error?: string}>}
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store token and user ID in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);
        console.log('✅ Login successful, token stored');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout current user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logout() {
    try {
      const token = this.getToken();

      if (!token) {
        // Already logged out
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      // Clear stored credentials regardless of response
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      console.log('🔴 Logout complete, token cleared');

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if request failed
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current session token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Get current user ID
   * @returns {string|null}
   */
  getUserId() {
    return localStorage.getItem('userId');
  }

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this.getToken();
  }

  /**
   * Clear session (called when session expires)
   */
  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    console.log('⚠️ Session cleared');
  }
}

// Export singleton instance
export const authApi = new AuthApiService();
export default authApi;
