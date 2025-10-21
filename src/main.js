import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './AppAuth.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
