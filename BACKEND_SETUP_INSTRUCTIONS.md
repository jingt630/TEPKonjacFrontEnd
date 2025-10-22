# 🚀 Backend Setup Instructions

## Based on Your env.txt Configuration

I can see you're using:
- **Gemini API Key:** Already configured ✅
- **Model:** `gemini-2.5-flash` (Gemini 2.5 experimental)
- **MongoDB:** Cloud Atlas cluster
- **Config File:** `./geminiConfig.json`

---

## 📋 Setup Steps

### 1. **Copy Files to Backend**

From your `TEPKonjacFrontEnd` folder to your backend:

```bash
# Copy Gemini LLM integration
cp src/gemini-llm.ts /path/to/your/backend/src/

# Copy updated TextExtraction concept
cp concepts/TextExtraction/TextExtraction.ts /path/to/your/backend/concepts/TextExtraction/

# Copy updated MediaManagement concept (if not already done)
cp concepts/MediaManagement/MediaManagement.ts /path/to/your/backend/concepts/MediaManagement/

# Copy server with CORS support
cp concept_server_with_cors.ts /path/to/your/backend/src/concept_server.ts
```

---

### 2. **Create .env File in Backend**

In your backend root folder, create `.env`:

```bash
# Navigate to your backend folder
cd /path/to/your/backend

# Create .env file
notepad .env
```

**Contents of .env:**
```env
GEMINI_API_KEY=AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o
GEMINI_MODEL=gemini-2.5-flash
GEMINI_CONFIG=./geminiConfig.json
MONGODB_URL=mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=First_Concept_DB
```

**⚠️ Security Note:**
- Never commit `.env` to git!
- Add `.env` to your `.gitignore`
- The API key I see here is exposed - consider regenerating it after testing

---

### 3. **Create geminiConfig.json (Optional)**

If you want to customize Gemini's behavior, create `geminiConfig.json` in your backend root:

```json
{
  "temperature": 0.2,
  "topP": 0.95,
  "topK": 40,
  "maxOutputTokens": 2048
}
```

**Config Options:**
- `temperature`: 0.0-1.0 (lower = more deterministic, good for OCR)
- `topP`: Nucleus sampling (0.95 is good default)
- `topK`: Top-k sampling (40 is good default)
- `maxOutputTokens`: Max response length (2048 is usually enough)

**For OCR, recommended:**
```json
{
  "temperature": 0.1,
  "topP": 0.95,
  "topK": 40,
  "maxOutputTokens": 4096
}
```

---

### 4. **Install Dependencies**

Make sure you have the Gemini package:

```bash
# In your backend folder
deno cache --reload src/gemini-llm.ts
```

This will download `npm:@google/genai` automatically.

---

### 5. **Start Backend**

```bash
# From your backend folder
deno run --allow-net --allow-read --allow-write --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api
```

**Important Flags:**
- `--allow-env` - Required to read .env variables
- `--allow-write` - Required to save uploaded images
- `--allow-read` - Required to read images and config
- `--allow-net` - Required for API calls and MongoDB

---

### 6. **Verify Setup**

**Check Backend Logs:**

When backend starts, you should see:
```
Scanning for concepts...
- Registering concept: MediaManagement
- Registering concept: TextExtraction
  - Endpoint: POST /api/TextExtraction/extractTextFromMedia
  ...
Server listening on http://localhost:8000
CORS enabled for: http://localhost:5173
```

**No errors about:**
- ❌ Missing GEMINI_API_KEY
- ❌ Missing GEMINI_MODEL
- ❌ Cannot connect to MongoDB

---

## 🧪 Testing

### **Test 1: Environment Variables Loaded**

Add this to your backend (temporarily) to verify:
```typescript
console.log("GEMINI_API_KEY:", Deno.env.get("GEMINI_API_KEY") ? "✅ Set" : "❌ Missing");
console.log("GEMINI_MODEL:", Deno.env.get("GEMINI_MODEL"));
console.log("MONGODB_URL:", Deno.env.get("MONGODB_URL") ? "✅ Set" : "❌ Missing");
```

### **Test 2: Upload & Extract**

1. Start frontend: `npm run dev`
2. Start backend (as shown above)
3. Login to your app
4. Upload an image with text
5. Click "Edit Image"
6. Click "Auto Extract Text"

**Expected Backend Logs:**
```
🤖 Starting Gemini AI text extraction for: image.png
📐 Image dimensions: 1024x768
🤖 Calling Gemini AI...
📷 Reading image from: ./uploads/user:xxx/folder/image.png
✅ Gemini response received
✅ Gemini extraction complete
📝 Found 3 text blocks
✅ Created 3 extraction records
```

**Expected Frontend:**
- Multiple text extractions appear
- Each with coordinates
- No 404 errors

---

## 🔧 Troubleshooting

### **Issue 1: "Missing GEMINI_API_KEY"**

**Cause:** Backend not loading .env file

**Solutions:**

1. **Load .env file manually in Deno:**

Create `src/load-env.ts`:
```typescript
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

export async function loadEnv() {
  const env = await load();
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value);
  }
  console.log("✅ Environment variables loaded from .env");
}
```

Then in your `concept_server.ts`, at the very top:
```typescript
import { loadEnv } from "./load-env.ts";
await loadEnv();
```

2. **Or set variables in terminal:**
```powershell
# Windows PowerShell
$env:GEMINI_API_KEY="AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:MONGODB_URL="mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
$env:DB_NAME="First_Concept_DB"

# Then start server
deno run --allow-net --allow-read --allow-write --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api
```

---

### **Issue 2: "Cannot find module gemini-llm.ts"**

**Cause:** Wrong import path

**Fix:**

In `concepts/TextExtraction/TextExtraction.ts`, check the import:
```typescript
// Adjust based on your backend folder structure
import { GeminiLLM } from "../../src/gemini-llm.ts";
```

**If your structure is:**
```
backend/
  src/
    gemini-llm.ts
    concept_server.ts
  concepts/
    TextExtraction/
      TextExtraction.ts
```

Then use: `../../src/gemini-llm.ts` ✅

---

### **Issue 3: MongoDB Connection Failed**

**Symptoms:**
```
MongoError: Authentication failed
```

**Solutions:**

1. **Verify MongoDB URL is correct**
2. **Check IP whitelist** in MongoDB Atlas:
   - Go to Network Access
   - Add your current IP or use `0.0.0.0/0` (allow all - for testing)
3. **Verify database name:** `First_Concept_DB`

---

### **Issue 4: Gemini API Quota Exceeded**

**Free tier limits:**
- 15 requests/minute
- 1,500 requests/day

**Solution:**
- Wait 1 minute between extractions
- Or upgrade to paid tier

---

## 📁 File Structure Checklist

Your backend should look like:

```
your-backend/
├── .env                              ← Create this
├── .gitignore                        ← Add .env to this
├── geminiConfig.json                 ← Optional
├── deno.json or deno.jsonc
├── src/
│   ├── concept_server.ts             ← Updated
│   ├── gemini-llm.ts                 ← New! Copy from frontend
│   └── ... other files
├── concepts/
│   ├── MediaManagement/
│   │   └── MediaManagement.ts        ← Updated
│   └── TextExtraction/
│       └── TextExtraction.ts         ← Updated
└── uploads/                          ← Created automatically
    └── user:xxx/
        └── folder/
            └── images...
```

---

## ✅ Final Checklist

Before running:

- [ ] Copied `gemini-llm.ts` to `src/`
- [ ] Copied `TextExtraction.ts` to `concepts/TextExtraction/`
- [ ] Copied `MediaManagement.ts` to `concepts/MediaManagement/`
- [ ] Created `.env` file with all variables
- [ ] Added `.env` to `.gitignore`
- [ ] Created `geminiConfig.json` (optional)
- [ ] MongoDB connection URL is correct
- [ ] API key is valid
- [ ] Verified import paths in TypeScript files

---

## 🎯 Quick Start Command

```bash
# Set environment (if not using .env loader)
$env:GEMINI_API_KEY="AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:MONGODB_URL="mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
$env:DB_NAME="First_Concept_DB"

# Start backend
deno run --allow-net --allow-read --allow-write --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api
```

---

## 🔐 Security Recommendations

1. **Regenerate API Key:**
   - Your key is now exposed in this file
   - Go to https://aistudio.google.com/app/apikey
   - Delete old key, create new one
   - Update .env

2. **Add to .gitignore:**
```gitignore
.env
.env.*
uploads/
node_modules/
```

3. **Use Secrets Manager** (for production):
   - Google Cloud Secret Manager
   - AWS Secrets Manager
   - Azure Key Vault

---

## 📞 Support

If you run into issues:

1. **Check backend terminal** for error messages
2. **Check frontend browser console** (F12)
3. **Verify all files copied correctly**
4. **Ensure .env is in backend root folder**
5. **Make sure backend has all --allow flags**

---

**You're all set! 🎉**

Your configuration is ready. Just copy the files, create .env, and start the backend!
