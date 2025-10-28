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
        <img src="/Logo.jpg" alt="TEP Konjac Logo" class="auth-logo" />
        <h1>TEP Konjac</h1>
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
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.auth-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 15% 25%, rgba(37, 150, 190, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 85% 75%, rgba(5, 100, 177, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(219, 242, 169, 0.05) 0%, transparent 30%);
  pointer-events: none;
}

.auth-view::after {
  content: '◯';
  position: absolute;
  right: 8%;
  top: 15%;
  font-size: 20em;
  color: var(--primary-blue);
  opacity: 0.03;
  font-weight: bold;
  pointer-events: none;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
}

.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.auth-logo {
  height: 100px;
  width: auto;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(37, 150, 190, 0.3);
  border: 3px solid var(--primary-blue);
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.auth-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(37, 150, 190, 0.4);
}

.auth-header h1 {
  font-size: 3.2em;
  margin: 0 0 0.5rem 0;
  font-family: 'Fredoka', 'Quicksand', cursive;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--navy-blue) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  filter: drop-shadow(0 2px 4px rgba(37, 150, 190, 0.2));
}

.auth-header p {
  margin: 0;
  color: var(--navy-blue);
  font-size: 1.15em;
  font-weight: 500;
  opacity: 0.85;
}

.auth-card {
  background: var(--white);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(37, 150, 190, 0.15);
  border: 3px solid var(--soft-blue);
}

.auth-card h2 {
  margin: 0 0 2rem 0;
  color: var(--navy-blue);
  font-size: 1.9em;
  text-align: center;
  font-family: 'Fredoka', 'Quicksand', cursive;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--navy-blue);
  font-weight: 600;
  font-size: 0.95em;
}

.form-group input {
  width: 100%;
  padding: 0.85rem 1.1rem;
  border: 2px solid var(--soft-blue);
  background: var(--light-gray);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--accent-dark);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-blue);
  background: var(--white);
  box-shadow: 0 0 0 3px rgba(37, 150, 190, 0.1);
}

.form-group input::placeholder {
  color: var(--accent-dark);
  opacity: 0.5;
}

.error-message {
  background: rgba(205, 19, 27, 0.1);
  color: var(--accent-red);
  padding: 0.85rem;
  border-radius: 12px;
  border: 2px solid var(--accent-red);
  margin-bottom: 1rem;
  font-size: 0.9em;
  font-weight: 500;
}

.btn-primary {
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--navy-blue) 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.15em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(37, 150, 190, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(37, 150, 190, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-toggle {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--soft-blue);
}

.auth-toggle p {
  margin: 0;
  color: var(--navy-blue);
  font-weight: 500;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-blue);
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  font-size: 1em;
  transition: all 0.2s ease;
}

.btn-link:hover {
  color: var(--navy-blue);
  text-decoration: underline;
}

.demo-note {
  margin-top: 2rem;
  padding: 1.2rem;
  background: var(--soft-blue);
  border: 2px solid var(--primary-blue);
  border-radius: 12px;
  text-align: center;
}

.demo-note p {
  margin: 0.25rem 0;
  color: var(--navy-blue);
  font-weight: 500;
}

.demo-note strong {
  color: var(--primary-blue);
  font-weight: 700;
}

.demo-note small {
  color: var(--accent-dark);
  opacity: 0.8;
}
</style>
