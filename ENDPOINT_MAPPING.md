# 🔗 Backend ↔ Frontend Endpoint Mapping

## ✅ Perfect Match! Everything is Already Configured

Here's a side-by-side comparison of your backend endpoints and frontend configuration:

---

## 📂 Folder Operations

### Backend Endpoint:
```
POST /api/MediaManagement/createFolder
```

### Frontend Config (`src/config/api.js`):
```javascript
CREATE_FOLDER: '/MediaManagement/createFolder'  ✅ MATCH!
```

### Frontend Usage (`src/services/mediaApi.js`):
```javascript
fetch('http://localhost:8000/api/MediaManagement/createFolder', {
  method: 'POST',  ✅ MATCH!
  body: JSON.stringify({ filePath, name })
})
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/_listFolders
```

### Frontend Config:
```javascript
LIST_FOLDERS: '/MediaManagement/_listFolders'  ✅ MATCH!
```

### Frontend Usage:
```javascript
fetch('http://localhost:8000/api/MediaManagement/_listFolders', {
  method: 'POST',  ✅ MATCH!
  body: JSON.stringify({ filePath })
})
```

---

## 📄 Media File Operations

### Backend Endpoint:
```
POST /api/MediaManagement/_listMediaFiles
```

### Frontend Config:
```javascript
LIST_MEDIA: '/MediaManagement/_listMediaFiles'  ✅ MATCH!
```

### Frontend Usage:
```javascript
fetch('http://localhost:8000/api/MediaManagement/_listMediaFiles', {
  method: 'POST',  ✅ MATCH!
  body: JSON.stringify({ filePath })
})
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/upload
```

### Frontend Config:
```javascript
UPLOAD_MEDIA: '/MediaManagement/upload'  ✅ MATCH!
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/delete
```

### Frontend Config:
```javascript
DELETE_MEDIA: '/MediaManagement/delete'  ✅ MATCH!
```

### Frontend Usage:
```javascript
fetch('http://localhost:8000/api/MediaManagement/delete', {
  method: 'POST',  ✅ MATCH!
  body: JSON.stringify({ mediaId })
})
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/move
```

### Frontend Config:
```javascript
MOVE_MEDIA: '/MediaManagement/move'  ✅ MATCH!
```

### Frontend Usage:
```javascript
fetch('http://localhost:8000/api/MediaManagement/move', {
  method: 'POST',  ✅ MATCH!
  body: JSON.stringify({ mediaId, newFilePath })
})
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/_getMediaFile
```

### Frontend Config:
```javascript
GET_MEDIA: '/MediaManagement/_getMediaFile'  ✅ MATCH!
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/updateContext
```

### Frontend Config:
```javascript
UPDATE_CONTEXT: '/MediaManagement/updateContext'  ✅ MATCH!
```

---

### Backend Endpoint:
```
POST /api/MediaManagement/addTranslatedText
```

### Frontend Config:
```javascript
ADD_TRANSLATED_TEXT: '/MediaManagement/addTranslatedText'  ✅ MATCH!
```

---

## 📊 Complete Comparison Table

| Backend Endpoint | Frontend Config | Status |
|-----------------|-----------------|--------|
| `POST /api/MediaManagement/createFolder` | `/MediaManagement/createFolder` | ✅ MATCH |
| `POST /api/MediaManagement/_listFolders` | `/MediaManagement/_listFolders` | ✅ MATCH |
| `POST /api/MediaManagement/_listMediaFiles` | `/MediaManagement/_listMediaFiles` | ✅ MATCH |
| `POST /api/MediaManagement/upload` | `/MediaManagement/upload` | ✅ MATCH |
| `POST /api/MediaManagement/delete` | `/MediaManagement/delete` | ✅ MATCH |
| `POST /api/MediaManagement/move` | `/MediaManagement/move` | ✅ MATCH |
| `POST /api/MediaManagement/_getMediaFile` | `/MediaManagement/_getMediaFile` | ✅ MATCH |
| `POST /api/MediaManagement/updateContext` | `/MediaManagement/updateContext` | ✅ MATCH |
| `POST /api/MediaManagement/addTranslatedText` | `/MediaManagement/addTranslatedText` | ✅ MATCH |

---

## 🎯 Configuration Summary

### Base URL
```javascript
// Frontend
const API_BASE_URL = 'http://localhost:8000/api'

// Backend
Server listening on http://localhost:8000
Base URL: /api

✅ MATCH!
```

### HTTP Method
```javascript
// ALL endpoints use POST
Frontend: method: 'POST'  ✅
Backend: POST             ✅

✅ MATCH!
```

### Request Format
```javascript
// Frontend sends JSON
headers: {
  'Content-Type': 'application/json'
}
body: JSON.stringify({ ...params })

// Backend expects JSON
✅ MATCH!
```

---

## 🚀 Ready to Test!

**Everything is configured correctly!**

### Test it now:

1. **Open:** `test-backend-connection.html` in your browser
   - OR -
2. **Run your app:** `npm run dev`
3. **Click:** "+ New Folder" button
4. **Type:** A folder name
5. **Watch:** It should work! ✨

---

## 🐛 Still Not Working?

If you still get errors, it's likely one of these:

### 1. CORS Issue
**Symptom:** Error in console about CORS policy

**Fix:** Add CORS middleware to your backend:
```typescript
// Your Deno backend needs something like:
import { oakCors } from "https://deno.land/x/cors/mod.ts";

app.use(oakCors({
  origin: "http://localhost:5173",
  credentials: true
}));
```

### 2. User Authentication Required
**Symptom:** Error about missing user or unauthorized

**Check:** Does your backend require a user parameter?

**If yes:** We need to add user authentication to the frontend

### 3. Request Format Mismatch
**Symptom:** 400 Bad Request or validation error

**Check:** Look at backend logs to see what it expects

**Debug:** Use the Network tab to see what's being sent

---

## 📝 No Changes Needed!

**I did NOT rename anything** because the configuration was **already correct**!

The endpoints in your frontend config:
- ✅ Already match your backend endpoints
- ✅ Already use POST method
- ✅ Already send correct JSON format
- ✅ Already use the right port (8000)

**Just test it now!** 🚀

If you get an error, copy/paste the exact error message and I'll help you fix it!
