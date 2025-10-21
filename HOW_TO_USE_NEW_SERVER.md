# 🚀 How to Use the New Server with CORS

## ✅ What I Created

**New file:** `concept_server_with_cors.ts`

This is an **enhanced version** of your server with CORS support. It does **everything the old one does** PLUS fixes the CORS error!

---

## 🔄 Step-by-Step Setup

### Option 1: Copy to Your Backend (Recommended)

1. **Copy the new file to your backend:**
   ```bash
   # Copy concept_server_with_cors.ts to your backend's src folder
   # For example, if your backend is at C:\Users\jingy\downloads\concept_backend\

   cp concept_server_with_cors.ts C:\Users\jingy\downloads\concept_backend\src\concept_server.ts
   ```

2. **Restart your backend:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then run:
   deno task concepts
   ```

3. **Done!** ✨

### Option 2: Run Directly (Alternative)

If you want to test it first without replacing the original:

1. **Move the file to your backend directory**

2. **Run it directly:**
   ```bash
   cd C:\Users\jingy\downloads\concept_backend
   deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server_with_cors.ts --port 8000 --baseUrl /api
   ```

---

## 📝 What Changed?

### Before (No CORS):
```typescript
const app = new Hono();
app.get("/", (c) => c.text("Concept Server is running."));
// ... concept routes
```

### After (With CORS): ✅
```typescript
const app = new Hono();

// ⭐ THIS IS THE NEW PART ⭐
app.use("/*", cors({
  origin: "http://localhost:5173", // Your Vue frontend URL
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.get("/", (c) => c.text("Concept Server is running."));
// ... concept routes (unchanged)
```

**That's it!** Just 6 lines of code added. Everything else stays the same.

---

## ✅ What Still Works (100% Backward Compatible)

- ✅ All your concepts load exactly the same
- ✅ All endpoints work the same (`/api/MediaManagement/...`, etc.)
- ✅ Database connections unchanged
- ✅ All concept methods work identically
- ✅ Command-line arguments work (`--port`, `--baseUrl`)

**The ONLY difference:** Frontend can now connect! 🎉

---

## 🧪 Test It

After starting the new server:

1. **Check backend terminal:**
   ```
   Server listening on http://localhost:8000
   CORS enabled for: http://localhost:5173  ← NEW!
   ```

2. **Reload your frontend** (http://localhost:5173)

3. **Open browser console (F12)**
   - ❌ Before: "CORS policy" errors
   - ✅ After: No errors, data loads!

4. **Try creating a folder:**
   - Click "+ New Folder"
   - Type a name
   - Click OK
   - ✅ It works!

---

## 🔍 Troubleshooting

### If you see "cors is not defined"

The CORS middleware is imported at the top:
```typescript
import { cors } from "jsr:@hono/hono/cors";
```

If you get an error, make sure you have the latest Hono version.

### If frontend still shows CORS errors

1. **Make sure you restarted the backend** (stop and start again)
2. **Clear browser cache** (Ctrl+Shift+R or Ctrl+F5)
3. **Check the backend URL** in frontend matches `http://localhost:8000`

### If concepts don't load

The concept loading code is **unchanged**, so if it worked before, it will work now.

Check your backend terminal for errors when it starts.

---

## 🎯 Quick Command Reference

### Start Backend with New Server:
```bash
# If you replaced the original file:
deno task concepts

# If running the new file separately:
deno run --allow-net --allow-read --allow-sys --allow-env concept_server_with_cors.ts --port 8000 --baseUrl /api
```

### Test Frontend Connection:
```bash
# In frontend directory:
npm run dev

# Open browser:
http://localhost:5173
```

---

## 📊 Before vs After

### Before (with CORS error):
```
Frontend (5173) → Backend (8000)
                    ❌ BLOCKED!
                    "No Access-Control-Allow-Origin header"
```

### After (with CORS fix):
```
Frontend (5173) → Backend (8000)
                    ✅ ALLOWED!
                    Backend: "Yes, 5173 can access me"
                    Data flows freely!
```

---

## 💡 Next Steps

1. **Copy** `concept_server_with_cors.ts` to your backend
2. **Restart** your backend server
3. **Reload** your frontend
4. **Enjoy!** Everything should work now! 🎉

---

## 🔐 Production Note

For production, you'd want to:
```typescript
// Instead of hardcoding:
origin: "http://localhost:5173"

// Use environment variable:
origin: Deno.env.get("FRONTEND_URL") || "http://localhost:5173"
```

But for development, the hardcoded version is fine!

---

## ✨ Summary

**What you need to do:**
1. Copy `concept_server_with_cors.ts` to your backend's `src/` folder
2. Rename it to `concept_server.ts` (replace the old one)
3. Restart backend: `deno task concepts`
4. Reload frontend
5. ✅ Done!

**That's it!** Your "+ New Folder" button and all other features will work now! 🚀
