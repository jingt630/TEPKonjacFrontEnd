# Troubleshooting: "Failed to Fetch" Error

## 🚨 Problem: "Failed to fetch" when creating folder

This error means your **frontend can't connect to your backend**.

---

## ✅ Solution Checklist

### Step 1: Is Your Backend Running?

**Check if your backend server is running:**

```bash
# In your backend directory, run:
npm start
# or
python app.py
# or
node server.js
# or whatever command starts your backend
```

**Look for output like:**
```
✓ Server running on http://localhost:3000
✓ Server listening on port 5000
✓ API ready at http://localhost:8000
```

**Write down the port number!** (e.g., 3000, 5000, 8000)

---

### Step 2: Test Backend Manually

**Open your browser and try these URLs:**

If your backend is on port 8000:
```
http://localhost:8000/api/folders
```

If your backend is on port 3000:
```
http://localhost:3000/api/folders
```

If your backend is on port 5000:
```
http://localhost:5000/api/folders
```

**What you should see:**
- ✅ JSON response (even if empty array `[]`)
- ✅ Or a proper error message from your backend
- ❌ "This site can't be reached" = Backend not running
- ❌ 404 Not Found = Wrong endpoint

---

### Step 3: Update Frontend Configuration

**If your backend is on a DIFFERENT port than 8000:**

1. Open `src/config/api.js`
2. Change line 4:

```javascript
// If backend is on port 3000:
export const API_BASE_URL = 'http://localhost:3000/api';

// If backend is on port 5000:
export const API_BASE_URL = 'http://localhost:5000/api';

// If backend is on port 8080:
export const API_BASE_URL = 'http://localhost:8080/api';
```

3. **Save the file**
4. Your frontend will automatically reload (Vite hot reload)

---

### Step 4: Check API Endpoint Path

**Does your backend use `/api` prefix?**

Some backends use:
- `http://localhost:8000/api/folders` ← Has `/api` prefix
- `http://localhost:8000/folders` ← NO `/api` prefix

**If your backend does NOT use `/api`:**

Update `src/config/api.js`:
```javascript
// Remove /api from the end
export const API_BASE_URL = 'http://localhost:8000';
```

---

### Step 5: Test in Browser Console

**Open browser console (F12) and run:**

```javascript
// Test if backend is reachable
fetch('http://localhost:8000/api/folders')
  .then(res => res.json())
  .then(data => console.log('✅ Backend works!', data))
  .catch(err => console.error('❌ Backend error:', err))
```

**Replace `8000` with your actual port!**

**Possible results:**

✅ **Success:**
```javascript
✅ Backend works! []
// or
✅ Backend works! [{ _id: '...', name: 'Photos', ... }]
```

❌ **Failed to fetch:**
```javascript
❌ Backend error: TypeError: Failed to fetch
```
**→ Backend is not running or wrong port**

❌ **CORS error:**
```javascript
❌ Access to fetch has been blocked by CORS policy
```
**→ See Step 6 below**

---

### Step 6: Fix CORS Issues

**If you see CORS error**, your backend needs to allow requests from `http://localhost:5173`.

**For Express.js backend:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true
}));
```

**For Flask backend:**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173'])
```

**For FastAPI backend:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 Common Scenarios

### Scenario 1: Backend on Port 3000

**Your backend:**
```
Server running on http://localhost:3000
```

**Fix:**
```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:3000/api';
```

---

### Scenario 2: Backend Has No /api Prefix

**Your backend routes:**
```
GET  /folders
POST /folders
GET  /media
```

**Fix:**
```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:8000';  // No /api at end
```

---

### Scenario 3: Backend on Different Machine

**Your backend runs on another computer:**
```
Server running on http://192.168.1.100:8000
```

**Fix:**
```javascript
// src/config/api.js
export const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

---

## 🧪 Debug Helper Script

**Add this to your browser console to diagnose:**

```javascript
// Run this in browser console (F12)
async function testBackend() {
  const ports = [3000, 5000, 8000, 8080];
  const paths = ['/api/folders', '/folders'];

  for (const port of ports) {
    for (const path of paths) {
      const url = `http://localhost:${port}${path}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`✅ FOUND! ${url}`, data);
        return url;
      } catch (e) {
        console.log(`❌ Not here: ${url}`);
      }
    }
  }
  console.log('Backend not found on common ports');
}

testBackend();
```

This will automatically test common port/path combinations!

---

## 📝 Quick Checklist

- [ ] Backend server is running
- [ ] I know what port it's on (e.g., 8000)
- [ ] I can access backend in browser (http://localhost:PORT/api/folders)
- [ ] I updated `src/config/api.js` with correct URL
- [ ] I saved the file and frontend reloaded
- [ ] CORS is configured in backend (if needed)
- [ ] I tested in browser console with fetch()

---

## 🎯 Still Not Working?

### Check the Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "+ New Folder" button
4. Look for the request to `/folders`

**Click on it and check:**

**General tab:**
- Request URL: `http://localhost:8000/api/folders` ← Is this correct?
- Status Code: `(failed)` or `200 OK` or `404`?

**Console tab shows:**
- `Failed to fetch` = Backend not running
- `CORS error` = Need to configure CORS
- `404 Not Found` = Wrong endpoint URL
- `500 Internal Server Error` = Backend has a bug

---

## 🚀 Example: Working Configuration

**Backend (Express.js on port 3000):**
```javascript
// server.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

app.post('/api/folders', (req, res) => {
  console.log('Creating folder:', req.body);
  res.json({ _id: '123', name: req.body.name, filePath: req.body.filePath });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

**Frontend config:**
```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:3000/api';
```

**Result:** ✅ Works!

---

## 💡 Pro Tip: Environment Variables

**For easier configuration, use environment variables:**

1. Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

2. Update `src/config/api.js`:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

3. Restart dev server (`npm run dev`)

Now you can change the URL without editing code!

---

## 📞 Need More Help?

**Run this diagnostic and share the output:**

```javascript
// Browser console (F12)
console.log('Frontend URL:', window.location.origin);
console.log('API URL:', 'http://localhost:8000/api');  // Update this

fetch('http://localhost:8000/api/folders')  // Update this
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => console.log('Response data:', data))
  .catch(err => console.error('Error details:', err));
```

This will help diagnose the exact issue!
