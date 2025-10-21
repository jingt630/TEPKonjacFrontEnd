# TEP Konjac Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend URL (Optional)

The default backend URL is `http://localhost:8000/api`. To change it:

**Option A:** Edit `src/config/api.js` directly:

```javascript
export const API_BASE_URL = 'http://localhost:8000/api';
```

**Option B:** Use environment variables (create a `.env.local` file):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Then update `src/config/api.js` to use it:

```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

### 3. Start Backend Server

Make sure your backend server is running on `http://localhost:8000`

### 4. Start Frontend Dev Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
TEPKonjacFrontEnd/
├── ConceptAPI/
│   └── Concept1.md           # API specification from backend
├── public/
│   └── vite.svg              # Static assets
├── src/
│   ├── config/
│   │   └── api.js            # API configuration and endpoints
│   ├── services/
│   │   └── mediaApi.js       # API service for media management
│   ├── composables/
│   │   └── useMedia.js       # Vue composable for media state management
│   ├── types/
│   │   └── media.js          # Type definitions (JSDoc)
│   ├── App.vue               # Main application component
│   ├── main.js               # Application entry point
│   └── style.css             # Global styles
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── package.json              # Project dependencies
└── README.md                 # Project documentation
```

## Using the API Service

### Basic Usage in Components

```vue
<script setup>
import { onMounted } from 'vue'
import { useMedia } from './composables/useMedia'

const {
  mediaFiles,
  folders,
  loading,
  error,
  loadMedia,
  createFolder,
  uploadFile
} = useMedia()

onMounted(() => {
  loadMedia()
})
</script>
```

### Direct API Calls

```javascript
import { mediaApi } from './services/mediaApi'

// Upload a file
const result = await mediaApi.upload({
  filePath: '/my-folder',
  mediaType: 'jpg',
  filename: 'photo.jpg',
  relativePath: '/path/to/photo.jpg'
})

// List files
const files = await mediaApi.listMediaFiles('/my-folder')

// Create folder
const folder = await mediaApi.createFolder({
  filePath: '/',
  name: 'new-folder'
})
```

## Available API Methods

See `src/services/mediaApi.js` for complete API documentation:

- `upload(params)` - Upload a new media file
- `delete(mediaId)` - Delete a media file
- `move(mediaId, newFilePath)` - Move a media file
- `getMediaFile(mediaId)` - Get a specific media file
- `listMediaFiles(filePath)` - List media files in a directory
- `updateContext(mediaId, extractionResult)` - Update extracted text
- `addTranslatedText(mediaId, translatedText)` - Add translations
- `createFolder(params)` - Create a new folder
- `listFolders(filePath)` - List folders in a directory

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant hot module replacement. Changes to Vue components will reflect immediately without losing state.

### DevTools

Install Vue DevTools browser extension for better debugging:
- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools/)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

### Linting (Future)

Consider adding ESLint and Prettier for code quality:

```bash
npm install -D eslint @vue/eslint-config-prettier prettier
```

## Production Build

Build optimized production files:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Troubleshooting

### CORS Errors

If you encounter CORS errors, make sure your backend server has CORS enabled for `http://localhost:5173`.

### Connection Refused

If the frontend can't connect to the backend:
1. Verify the backend is running on `http://localhost:8000`
2. Check the URL in `src/config/api.js`
3. Check browser console for specific error messages

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port.

## Next Steps

1. Review the API spec in `ConceptAPI/Concept1.md`
2. Customize the UI in `src/App.vue`
3. Add more components as needed
4. Implement file upload UI
5. Add authentication if required
