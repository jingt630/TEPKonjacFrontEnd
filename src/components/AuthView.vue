<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()

const isLogin = ref(true)
const formData = ref({
  username: '',
  email: '',
  password: ''
})

const handleSubmit = async () => {
  if (isLogin.value) {
    // Login
    const result = await userStore.login(formData.value.email, formData.value.password)
    if (!result.success) {
      alert('❌ Login failed: ' + result.error)
    }
  } else {
    // Signup
    if (!formData.value.username || !formData.value.email || !formData.value.password) {
      alert('❌ Please fill in all fields')
      return
    }

    const result = await userStore.signup(
      formData.value.username,
      formData.value.email,
      formData.value.password
    )

    if (!result.success) {
      alert('❌ Signup failed: ' + result.error)
    }
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formData.value = {
    username: '',
    email: '',
    password: ''
  }
  userStore.error = null
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-header">
        <h1>🖼️ TEP Konjac</h1>
        <p>Media Management & Translation Platform</p>
      </div>

      <div class="auth-card">
        <h2>{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>

        <form @submit.prevent="handleSubmit">
          <div v-if="!isLogin" class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="Enter username"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="Enter email"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="Enter password"
              required
            />
          </div>

          <div v-if="userStore.error" class="error-message">
            {{ userStore.error }}
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="userStore.loading"
          >
            {{ userStore.loading ? '⏳ Please wait...' : (isLogin ? '🔓 Log In' : '✨ Sign Up') }}
          </button>
        </form>

        <div class="auth-toggle">
          <p>
            {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
            <button @click="toggleMode" class="btn-link">
              {{ isLogin ? 'Sign Up' : 'Log In' }}
            </button>
          </p>
        </div>

        <div class="demo-note">
          <p><strong>Demo Mode:</strong> Create an account to get started!</p>
          <p><small>Each user has their own isolated storage</small></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.auth-header h1 {
  font-size: 3em;
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.auth-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1em;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-card h2 {
  margin: 0 0 2rem 0;
  color: #333;
  font-size: 1.8em;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9em;
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-toggle {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.auth-toggle p {
  margin: 0;
  color: #666;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  font-size: 1em;
}

.btn-link:hover {
  text-decoration: underline;
}

.demo-note {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.demo-note p {
  margin: 0.25rem 0;
  color: #666;
}

.demo-note strong {
  color: #667eea;
}

.demo-note small {
  color: #999;
}
</style>
