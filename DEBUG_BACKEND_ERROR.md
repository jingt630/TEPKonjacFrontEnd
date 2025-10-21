# 🔍 Debug Backend Errors

## What to Check

Your backend terminal should show the **actual error**. Let's find out what's really happening.

---

## Step 1: Check Backend Terminal

Look at your backend terminal (where you ran the `deno run` command).

You should see error messages like:
```
Error in MediaManagement._listMediaFiles: ...
Error in MediaManagement._listFolders: ...
Error in User._getUserByEmail: ...
```

**📋 COPY THE FULL ERROR MESSAGE AND SEND IT TO ME**

---

## Step 2: Common Issues

### Issue A: Methods Expecting Objects But Getting Strings

**Backend error might say:**
```
TypeError: Cannot destructure property 'userId' of 'undefined'
```

This means the backend methods are expecting `{ userId, filePath }` but the server is passing just `filePath`.

### Issue B: Import Path Wrong

**Backend error might say:**
```
Cannot find module './MediaManagementConcept.ts'
```

The import should be `./MediaManagement.ts` not `./MediaManagementConcept.ts`

### Issue C: Server Still Using Old Code

**Check your backend file:**
```
C:\Users\jingy\Downloads\concept_backend\src\concepts\MediaManagement\MediaManagement.ts
```

Line 42 should be:
```typescript
constructor(private readonly db: Db) {  // ✅ NO owner parameter
```

NOT:
```typescript
constructor(private readonly db: Db, owner: User) {  // ❌ HAS owner parameter
```

---

## Step 3: Verify Server File Import

Open this file in your backend:
```
C:\Users\jingy\Downloads\concept_backend\src\concept_server.ts
```

or

```
C:\Users\jingy\Downloads\concept_backend\concept_server_with_cors.ts
```

Check around line 70-80 how it creates the concept instance.

It should be:
```typescript
const instance = new ConceptClass(db);  // ✅ Just db
```

NOT:
```typescript
const instance = new ConceptClass(db, user);  // ❌ Has user parameter
```

---

## 🚨 CRITICAL: Which Server File Are You Using?

In your backend terminal, what command did you run?

### Option A: Old Server (Won't Work)
```bash
deno run ... concept_server.ts  ❌
```

### Option B: New Server with CORS (Should Work)
```bash
deno run ... concept_server_with_cors.ts  ✅
```

**You MUST use `concept_server_with_cors.ts`!**

---

## Step 4: Try This Debug Command

In your backend terminal, run:

```bash
# Stop current server (Ctrl+C)

# Run with the CORS-enabled server
deno run --allow-net --allow-read --allow-sys --allow-env concept_server_with_cors.ts --port 8000 --baseUrl /api
```

Watch the terminal output carefully when you try to create a folder from the frontend.

---

## Step 5: Send Me the Error

**Copy the error from your backend terminal and send it to me.**

It will look something like:
```
Error in MediaManagement._listFolders: TypeError: ...
    at MediaManagementConcept._listFolders (file:///.../MediaManagement.ts:275:5)
    at ...
```

This will tell us exactly what's wrong!

---

## 🎯 Quick Checklist

- [ ] I copied MediaManagement.ts to backend
- [ ] I copied MediaManagement.test.ts to backend
- [ ] I'm using `concept_server_with_cors.ts` (not `concept_server.ts`)
- [ ] I restarted the backend server after copying
- [ ] I can see "Server listening on http://localhost:8000" in terminal
- [ ] I'm looking at the backend terminal for error messages

---

**Send me the exact error from your backend terminal!** 🔍
