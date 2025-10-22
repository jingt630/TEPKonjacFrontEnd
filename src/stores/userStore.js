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
        const usernameData = await userApi.getUserUsername(user.user)
        const emailData = await userApi.getUserEmail(user.user)

        console.log('📥 Raw username data:', JSON.stringify(usernameData))
        console.log('📥 Raw email data:', JSON.stringify(emailData))
        console.log('📥 Username data type:', typeof usernameData, Array.isArray(usernameData))

        // Extract username - handle multiple response formats
        let username = ''
        if (Array.isArray(usernameData)) {
          // If it's an array
          if (usernameData.length > 0) {
            if (typeof usernameData[0] === 'string') {
              username = usernameData[0] // ["username"]
            } else if (usernameData[0]?.username) {
              username = usernameData[0].username // [{ username: "..." }]
            }
          }
        } else if (typeof usernameData === 'string') {
          username = usernameData // "username"
        } else if (usernameData?.username) {
          username = usernameData.username // { username: "..." }
        }

        // Extract email - handle multiple response formats
        let userEmail = email // Default to login email
        if (Array.isArray(emailData)) {
          if (emailData.length > 0) {
            if (typeof emailData[0] === 'string') {
              userEmail = emailData[0]
            } else if (emailData[0]?.email) {
              userEmail = emailData[0].email
            }
          }
        } else if (typeof emailData === 'string') {
          userEmail = emailData
        } else if (emailData?.email) {
          userEmail = emailData.email
        }

        console.log('✅ Extracted username:', username)
        console.log('✅ Extracted email:', userEmail)

        currentUser.value = {
          user: user.user,
          username: username || email, // Fallback to email if username extraction failed
          email: userEmail
        }

        isAuthenticated.value = true

        console.log('✅ Final logged in user:', JSON.stringify(currentUser.value))

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
    error.value = null

    // Clear ALL localStorage to prevent data leakage between users
    localStorage.clear()

    // Force page reload to clear any cached state
    window.location.reload()
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
