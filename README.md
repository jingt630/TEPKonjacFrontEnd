# TEP Konjac Frontend

A Vue.js frontend application for TEP Konjac - Media Management & Translation System.

## 🎯 Quick Links

- **[📖 Complete User Journey Guide](USER_JOURNEY.md)** - Detailed step-by-step walkthrough (optional reference)
- **[🎥 Video Demo on YouTube](https://youtu.be/eRIlBbxqaD0)** - Watch the system in action for the final 4b

## 🚀 User Journey Example

A user creates a new account and signs up for TEP Konjac, then creates a folder called "Chiikawa" to organize their work. They upload a Chiikawa related event image by dragging it into the upload area. After selecting the uploaded image, they click "✏️ Edit Image" and use the "🤖 Extract Text with AI" button to automatically detect all the Chinese text in the image, which successfully extracts some text elements with their pixel coordinates. The user then clicks "🌐 Translate" on each extracted text element, selecting English as the target language, and the AI generates accurate translations that appear below each original text. Satisfied with the translations, they close the editor and click "🎨 Render Text" to preview the result, selecting English as the display language. However, after rendering, they notice that two text boxes are slightly misaligned and overlapping with character faces in the image. They click "📍 Edit Location" on these problematic elements within the Rendering Panel's side-by-side view, adjusting the X and Y coordinates by small increments while watching the preview update in real-time until the text boxes are perfectly positioned. Once satisfied with the positioning, they click "🎨 Render Image" again to generate the final version, which now shows the English translations beautifully overlaid on white text boxes at the exact desired locations. They right-click the rendered preview and save the translated manga panel to their computer, with all their work—extractions, translations, and render output—securely stored in their personal database for future reference or re-rendering with different languages.

## Visual Study Design

[@VisualDesignStudy](VisualDesignStudy.pdf)

## Features

- Media file management (upload, delete, move)
- Folder structure management
- Text extraction and translation support
- Integration with backend API

## Backend API

This frontend connects to the TEP Konjac backend API running at:
- **Default URL:** `http://localhost:8000/api`
- **API Spec:** See `ConceptAPI/Concept1.md` for detailed endpoint documentation

### Configure Backend URL

To change the backend URL, edit `src/config/api.js`:

```javascript
export const API_BASE_URL = 'http://localhost:8000/api';
```

## Setup

Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Note:** Make sure your backend server is running on `http://localhost:8000` before starting the frontend.

## Build

Build for production:

```bash
npm run build
```

## Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
src/
├── config/
│   └── api.js              # API configuration and endpoints
├── services/
│   └── mediaApi.js         # API service for media management
├── types/
│   └── media.js            # Type definitions (JSDoc)
├── App.vue                 # Main application component
├── main.js                 # Application entry point
└── style.css               # Global styles
```

## API Documentation

See `ConceptAPI/Concept1.md` for the complete API specification including:
- Data models (MediaFile, Folder)
- Endpoints (upload, delete, move, etc.)
- Request/response formats

## Component Architecture

This project demonstrates **reactive component architecture** with proper separation of concerns:

- **Props** - Pass data from parent to child components (↓)
- **Events** - Send data from child to parent components (↑)
- **Reactivity** - UI updates automatically without page refreshes
- **Composables** - Reusable state logic (`useMedia.js`)

### 📚 Architecture Documentation

- **`COMPONENT_ARCHITECTURE.md`** - Detailed explanation of component communication patterns
- **`DATA_FLOW_EXAMPLES.md`** - Step-by-step scenarios showing data flow
- **`SETUP.md`** - Setup instructions and usage examples

### Component Structure

```
App.vue (orchestrator)
├── FolderBrowser.vue (folder management)
├── MediaGallery.vue (file display)
│   └── MediaCard.vue (individual file cards)
└── MediaDetails.vue (file details and metadata)
```

Each component:
- Manages its own local state
- Receives data via props from parent
- Emits events to notify parent of actions
- Updates automatically when data changes (reactive)
