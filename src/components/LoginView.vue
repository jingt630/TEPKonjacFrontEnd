<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Login to TEP Konjac</h2>
      <p class="subtitle">Image Translation Tool</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="your.email@example.com"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="register-link">
        <p>Don't have an account? <a href="#" @click.prevent="showRegister">Register here</a></p>
      </div>

      <!-- Simple registration form (inline) -->
      <div v-if="registering" class="register-form">
        <h3>Create Account</h3>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="reg-username">Username</label>
            <input
              id="reg-username"
              v-model="regUsername"
              type="text"
              required
              placeholder="Choose a username"
            />
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              v-model="regEmail"
              type="email"
              required
              placeholder="your.email@example.com"
            />
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input
              id="reg-password"
              v-model="regPassword"
              type="password"
              required
              placeholder="Choose a password"
            />
          </div>
          <div v-if="regError" class="error-message">{{ regError }}</div>
          <div v-if="regSuccess" class="success-message">{{ regSuccess }}</div>
          <button type="submit" class="register-button">Create Account</button>
          <button type="button" @click="registering = false" class="cancel-button">Cancel</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';
import { API_BASE_URL } from '../config/api';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const registering = ref(false);

// Registration fields
const regUsername = ref('');
const regEmail = ref('');
const regPassword = ref('');
const regError = ref('');
const regSuccess = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await authStore.login(email.value, password.value);

    if (result.success) {
      console.log('✅ Login successful, redirecting...');
      router.push('/'); // Redirect to home page
    } else {
      error.value = result.error || 'Login failed. Please check your credentials.';
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.';
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
};

const showRegister = () => {
  registering.value = true;
  regError.value = '';
  regSuccess.value = '';
};

const handleRegister = async () => {
  regError.value = '';
  regSuccess.value = '';

  try {
    const response = await fetch(`${API_BASE_URL}/User/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: regUsername.value,
        email: regEmail.value,
        password: regPassword.value,
        profilePic: '', // Empty for now
      }),
    });

    const data = await response.json();

    if (data.user) {
      regSuccess.value = 'Account created! You can now log in.';
      // Clear form
      regUsername.value = '';
      regEmail.value = '';
      regPassword.value = '';
      // Pre-fill login form
      email.value = regEmail.value;
      // Hide registration form after 2 seconds
      setTimeout(() => {
        registering.value = false;
      }, 2000);
    } else if (data.error) {
      regError.value = data.error;
    }
  } catch (err) {
    regError.value = 'Registration failed. Please try again.';
    console.error('Registration error:', err);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  margin: 0 0 8px 0;
  color: #333;
  text-align: center;
}

.subtitle {
  margin: 0 0 30px 0;
  color: #666;
  text-align: center;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #fcc;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #cfc;
}

.login-button, .register-button {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover, .register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}

.register-form {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #e0e0e0;
}

.register-form h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.register-form form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cancel-button {
  padding: 12px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-button:hover {
  background: #e0e0e0;
}
</style>
