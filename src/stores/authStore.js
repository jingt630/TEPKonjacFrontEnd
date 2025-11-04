import { defineStore } from 'pinia';
import { authApi } from '../services/authApi';

/**
 * Authentication Store
 * Manages authentication state across the application
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: authApi.getToken(),
    userId: authApi.getUserId(),
    isAuthenticated: authApi.isLoggedIn(),
  }),

  getters: {
    /**
     * Check if user is currently logged in
     */
    loggedIn: (state) => state.isAuthenticated,

    /**
     * Get current user ID
     */
    currentUserId: (state) => state.userId,

    /**
     * Get auth token for API requests
     */
    authToken: (state) => state.token,
  },

  actions: {
    /**
     * Login with email and password
     */
    async login(email, password) {
      try {
        const result = await authApi.login(email, password);

        if (result.success && result.token) {
          this.token = result.token;
          this.userId = result.userId;
          this.isAuthenticated = true;
          return { success: true };
        } else {
          return { success: false, error: result.error || 'Login failed' };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Logout current user
     */
    async logout() {
      try {
        await authApi.logout();
        this.token = null;
        this.userId = null;
        this.isAuthenticated = false;
        return { success: true };
      } catch (error) {
        console.error('Logout error:', error);
        // Clear state anyway
        this.token = null;
        this.userId = null;
        this.isAuthenticated = false;
        return { success: false, error: error.message };
      }
    },

    /**
     * Clear session (called when session expires)
     */
    clearSession() {
      authApi.clearSession();
      this.token = null;
      this.userId = null;
      this.isAuthenticated = false;
    },

    /**
     * Initialize auth state from localStorage
     */
    initialize() {
      this.token = authApi.getToken();
      this.userId = authApi.getUserId();
      this.isAuthenticated = authApi.isLoggedIn();
    },
  },
});
