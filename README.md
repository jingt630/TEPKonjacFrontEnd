# TEP Konjac Frontend

A Vue.js frontend application for TEP Konjac - Media Management System.

## User Journey

A user signs up and logs into the application, then uploads a manga image (e.g., a movie poster) to their personal media library, organizing it into a custom folder like "Manga Collection." They select the uploaded image and click "✏️ Edit Image" to open the Image Editor, where they use the AI-powered "🤖 Auto Extract Text" feature to automatically detect and extract Japanese text from the image, with each extraction capturing both the text content and its precise pixel coordinates on the image. The user can refine these extractions by clicking "✏️ Edit Coordinates" to adjust the bounding boxes or add additional manual extractions for any missed text. Next, they select an extraction and click "🌐 Translate" to choose Spanish as the target language, and the AI generates an accurate translation which is stored alongside the original text. Finally, the user closes the editor and clicks "🎨 Render Text" to open the Rendering Panel, where they select which text extractions to render, choose "Spanish 🇪🇸" as the display language, and click "🎨 Render Selected Text"—the system then overlays the Spanish translations onto the original image at the exact coordinates where the Japanese text appeared, creating a new rendered version with semi-transparent backgrounds for readability. The user can preview the rendered result immediately and click "💾 Download PNG" to save the translated image to their device, with all their extractions, translations, and rendered outputs securely stored in the database and isolated from other users' content.
[@LinktoVideoDemoOnYoutube](https://youtu.be/eRIlBbxqaD0)

## Visual Study Design

[@DoraemonInspired](stand-by-me-doraemon.jpg)

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
