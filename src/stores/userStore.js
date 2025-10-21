import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../services/userApi'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const userId = computed(() => currentUser.value?.user || null)
  const username = computed(() => currentUser.value?.username || null)
  const email = computed(() => currentUser.value?.email || null)

  // Actions
  const login = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      // Get user by email
      const result = await userApi.getUserByEmail(email)

      if (result.error) {
        error.value = 'Invalid email or password'
        return { success: false, error: error.value }
      }

      // In a real app, you'd verify password here
      // For now, we'll just check if user exists
      const user = Array.isArray(result) ? result[0] : result

      if (user && user.user) {
        // Get full user details
        const userDetails = await userApi.getUserById(user.user)
        const usernameData = await userApi.getUserUsername(user.user)
        const emailData = await userApi.getUserEmail(user.user)

        currentUser.value = {
          user: user.user,
          username: usernameData.username || '',
          email: emailData.email || email
        }

        isAuthenticated.value = true

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))

        return { success: true, user: currentUser.value }
      } else {
        error.value = 'User not found'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const signup = async (username, email, password, profilePic = '') => {
    loading.value = true
    error.value = null

    try {
      const result = await userApi.createUser({
        username,
        email,
        password,
        profilePic: profilePic || 'https://via.placeholder.com/150'
      })

      if (result.error) {
        error.value = result.error
        return { success: false, error: result.error }
      }

      // Auto-login after signup
      currentUser.value = {
        user: result.user,
        username,
        email
      }

      isAuthenticated.value = true

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))

      return { success: true, user: currentUser.value }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    currentUser.value = null
    isAuthenticated.value = false
    localStorage.removeItem('currentUser')
  }

  const restoreSession = () => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser)
        isAuthenticated.value = true
        return true
      } catch (e) {
        localStorage.removeItem('currentUser')
        return false
      }
    }
    return false
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    loading,
    error,

    // Computed
    userId,
    username,
    email,

    // Actions
    login,
    signup,
    logout,
    restoreSession
  }
})
