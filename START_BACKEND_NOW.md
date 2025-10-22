# 🚀 Start Backend - Quick Guide

## ⚡ Quick Start (No Permission Prompts!)

### **Option 1: Use the Scripts (Recommended)**

Copy one of these scripts to your **BACKEND** folder:

#### **PowerShell:**
```powershell
# Copy script to backend
cp START_BACKEND_NO_PROMPTS.ps1 C:\path\to\your\backend\

# Navigate to backend
cd C:\path\to\your\backend

# Run the script
.\START_BACKEND_NO_PROMPTS.ps1
```

#### **Command Prompt:**
```cmd
# Copy script to backend
copy START_BACKEND_NO_PROMPTS.bat C:\path\to\your\backend\

# Navigate to backend
cd C:\path\to\your\backend

# Run the script
START_BACKEND_NO_PROMPTS.bat
```

---

### **Option 2: Direct Command**

Navigate to your backend folder and run:

#### **PowerShell:**
```powershell
$env:GEMINI_API_KEY="AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:MONGODB_URL="mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
$env:DB_NAME="First_Concept_DB"

deno run --allow-all src/concept_server.ts --port 8000 --baseUrl /api
```

#### **Command Prompt:**
```cmd
set GEMINI_API_KEY=AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o
set GEMINI_MODEL=gemini-2.5-flash
set MONGODB_URL=mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true^&w=majority^&appName=Cluster0
set DB_NAME=First_Concept_DB

deno run --allow-all src\concept_server.ts --port 8000 --baseUrl /api
```

---

## ✅ What You Should See

When backend starts successfully:

```
Scanning for concepts...
- Registering concept: MediaManagement
  - Endpoint: POST /api/MediaManagement/upload
  - Endpoint: POST /api/MediaManagement/_serveImage
  ...
- Registering concept: TextExtraction
  - Endpoint: POST /api/TextExtraction/extractTextFromMedia
  ...
- Registering concept: Translation
- Registering concept: Rendering
- Registering concept: User

Server listening on http://localhost:8000
CORS enabled for: http://localhost:5173
✅ Backend ready!
```

---

## 🎯 Key Points

### **Why `--allow-all`?**
- ✅ No manual permission prompts when uploading images
- ✅ No need to press 'A' every time
- ✅ Smooth development experience

### **Environment Variables Set:**
- ✅ `GEMINI_API_KEY` - For AI text extraction
- ✅ `GEMINI_MODEL` - Using gemini-2.5-flash
- ✅ `MONGODB_URL` - Your MongoDB Atlas connection
- ✅ `DB_NAME` - First_Concept_DB

---

## 🧪 Test It

### **1. Start Backend**
Run one of the commands above

### **2. Start Frontend**
In a separate terminal:
```bash
cd C:\Users\jingy\Downloads\TEPKonjacFrontEnd
npm run dev
```

### **3. Upload an Image**
- Go to http://localhost:5173
- Upload an image
- **Should work without any prompts!** ✅

---

## 🐛 Troubleshooting

### **"Command not found: deno"**
Install Deno first:
```powershell
irm https://deno.land/install.ps1 | iex
```

### **Still Getting Permission Prompts?**
Make sure you're using `--allow-all` flag in the command

### **Backend Won't Start?**
1. Check you're in the backend directory
2. Verify `src/concept_server.ts` exists
3. Check for error messages in terminal

### **MongoDB Connection Failed?**
1. Check your internet connection
2. Verify MongoDB URL is correct
3. Check MongoDB Atlas IP whitelist settings

---

## 📁 Available Scripts

You now have multiple options to start the backend:

| Script | Description |
|--------|-------------|
| `RUN_BACKEND_WITH_NEW_KEY.ps1` | Simple PowerShell startup |
| `RUN_BACKEND_WITH_NEW_KEY.bat` | Simple CMD startup |
| `START_BACKEND_NO_PROMPTS.ps1` | Detailed PowerShell startup with info |
| `START_BACKEND_NO_PROMPTS.bat` | Detailed CMD startup with info |

All of them use `--allow-all` to avoid permission prompts.

---

## 🔐 Security Note

**For Development:** `--allow-all` is fine for local development

**For Production:** Use specific permissions:
```bash
deno run \
  --allow-net \
  --allow-read \
  --allow-write=./uploads \
  --allow-env \
  --allow-sys \
  src/concept_server.ts --port 8000 --baseUrl /api
```

---

**Ready to go! 🎉**

See `BACKEND_NO_PROMPT_SETUP.md` for more detailed information.
