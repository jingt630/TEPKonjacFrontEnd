# TEP Konjac Frontend

A Vue.js frontend application for TEP Konjac - Media Management System.

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
