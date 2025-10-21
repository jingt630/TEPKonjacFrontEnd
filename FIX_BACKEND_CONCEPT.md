# 🔧 Fix Your Backend MediaManagement Concept

## 🎯 The Real Problem

Your **frontend is correctly sending `userId`**, but your **backend concept isn't using it**.

### Current Backend Issue
```typescript
// Your backend concept probably looks like this:
class MediaManagementConcept {
  constructor(db) {
    this.db = db;
    this.mediaCollection = this.db.collection('media');
    this.folderCollection = this.db.collection('folders');
  }

  async createFolder({ filePath, name }) {
    // ❌ Where does owner come from?
    const folder = await this.folderCollection.insert({
      filePath,
      name,
      owner: ???  // This is undefined!
    });
    return folder;
  }

  async _listFolders({ filePath }) {
    // ❌ Filtering by undefined owner!
    return await this.folderCollection.find({
      filePath,
      owner: ???  // This returns nothing!
    });
  }
}
```

---

## ✅ The Fix

Extract `userId` from the request parameters and use it!

### Step 1: Open Your Backend File
Navigate to your backend repo:
```
C:\Users\jingy\Downloads\concept_backend\src\concepts\MediaManagement\MediaManagement.ts
```

### Step 2: Update `createFolder` Method

**Find this:**
```typescript
async createFolder({ filePath, name }) {
  const folder = await this.folderCollection.insert({
    filePath,
    name,
    owner: this.user?._id  // ❌ this.user doesn't exist!
  });
  return folder;
}
```

**Replace with:**
```typescript
async createFolder({ userId, filePath, name }) {
  // ✅ Extract userId from request body
  const folder = await this.folderCollection.insert({
    filePath,
    name,
    owner: userId  // ✅ Use userId from request!
  });
  return folder.toJSON();
}
```

### Step 3: Update `_listFolders` Method

**Find this:**
```typescript
async _listFolders({ filePath }) {
  const folders = await this.folderCollection.find({
    filePath,
    owner: this.user?._id  // ❌ this.user doesn't exist!
  });
  return folders.map(f => f.toJSON());
}
```

**Replace with:**
```typescript
async _listFolders({ userId, filePath }) {
  // ✅ Extract userId from request body
  const folders = await this.folderCollection.find({
    filePath,
    owner: userId  // ✅ Use userId from request!
  });
  return folders.map(f => f.toJSON());
}
```

### Step 4: Update ALL Other Methods

Apply the same pattern to **every method** that creates or queries data:

#### `upload` Method
```typescript
async upload({ userId, filePath, mediaType, filename, relativePath }) {
  const media = await this.mediaCollection.insert({
    filePath,
    mediaType,
    filename,
    relativePath,
    owner: userId,  // ✅ Add userId
    uploadedAt: new Date()
  });
  return media.toJSON();
}
```

#### `_listMediaFiles` Method
```typescript
async _listMediaFiles({ userId, filePath }) {
  const files = await this.mediaCollection.find({
    filePath,
    owner: userId  // ✅ Filter by userId
  });
  return files.map(f => f.toJSON());
}
```

#### `delete` Method
```typescript
async delete({ userId, mediaId }) {
  // ✅ Only delete if owner matches
  const result = await this.mediaCollection.deleteOne({
    _id: mediaId,
    owner: userId
  });
  return { success: true, deleted: result.deletedCount };
}
```

#### `move` Method
```typescript
async move({ userId, mediaId, newFilePath }) {
  // ✅ Only move if owner matches
  const result = await this.mediaCollection.updateOne(
    { _id: mediaId, owner: userId },
    { $set: { filePath: newFilePath } }
  );
  return { success: true, updated: result.modifiedCount };
}
```

#### `updateContext` Method
```typescript
async updateContext({ userId, mediaId, context }) {
  const result = await this.mediaCollection.updateOne(
    { _id: mediaId, owner: userId },
    { $set: { context } }
  );
  return { success: true };
}
```

#### `addTranslatedText` Method
```typescript
async addTranslatedText({ userId, mediaId, translatedText }) {
  const result = await this.mediaCollection.updateOne(
    { _id: mediaId, owner: userId },
    { $set: { translatedText } }
  );
  return { success: true };
}
```

#### `_getMediaFile` Method
```typescript
async _getMediaFile({ userId, mediaId }) {
  const file = await this.mediaCollection.findOne({
    _id: mediaId,
    owner: userId
  });
  return file ? file.toJSON() : null;
}
```

---

## 📋 Complete Example

Here's what your updated `MediaManagement.ts` should look like:

```typescript
export default class MediaManagementConcept {
  private db: any;
  private mediaCollection: any;
  private folderCollection: any;

  constructor(db: any) {
    this.db = db;
    this.mediaCollection = this.db.collection('media');
    this.folderCollection = this.db.collection('folders');
  }

  // ✅ All methods extract userId from parameters
  async createFolder({ userId, filePath, name }: {
    userId: string;
    filePath: string;
    name: string;
  }) {
    // Check for duplicate folder names
    const existing = await this.folderCollection.findOne({
      filePath,
      name,
      owner: userId
    });

    if (existing) {
      return { error: 'Folder already exists' };
    }

    const folder = await this.folderCollection.insert({
      filePath,
      name,
      owner: userId,
      createdAt: new Date()
    });

    return folder.toJSON();
  }

  async _listFolders({ userId, filePath }: {
    userId: string;
    filePath: string;
  }) {
    const folders = await this.folderCollection.find({
      filePath,
      owner: userId
    });

    return folders.map((f: any) => f.toJSON());
  }

  async upload({ userId, filePath, mediaType, filename, relativePath }: {
    userId: string;
    filePath: string;
    mediaType: string;
    filename: string;
    relativePath: string;
  }) {
    const media = await this.mediaCollection.insert({
      filePath,
      mediaType,
      filename,
      relativePath,
      owner: userId,
      uploadedAt: new Date()
    });

    return media.toJSON();
  }

  async _listMediaFiles({ userId, filePath }: {
    userId: string;
    filePath: string;
  }) {
    const files = await this.mediaCollection.find({
      filePath,
      owner: userId
    });

    return files.map((f: any) => f.toJSON());
  }

  async delete({ userId, mediaId }: {
    userId: string;
    mediaId: string;
  }) {
    const result = await this.mediaCollection.deleteOne({
      _id: mediaId,
      owner: userId
    });

    return { success: true, deleted: result.deletedCount };
  }

  async move({ userId, mediaId, newFilePath }: {
    userId: string;
    mediaId: string;
    newFilePath: string;
  }) {
    const result = await this.mediaCollection.updateOne(
      { _id: mediaId, owner: userId },
      { $set: { filePath: newFilePath } }
    );

    return { success: true };
  }

  async _getMediaFile({ userId, mediaId }: {
    userId: string;
    mediaId: string;
  }) {
    const file = await this.mediaCollection.findOne({
      _id: mediaId,
      owner: userId
    });

    return file ? file.toJSON() : null;
  }

  async updateContext({ userId, mediaId, context }: {
    userId: string;
    mediaId: string;
    context: string;
  }) {
    await this.mediaCollection.updateOne(
      { _id: mediaId, owner: userId },
      { $set: { context } }
    );

    return { success: true };
  }

  async addTranslatedText({ userId, mediaId, translatedText }: {
    userId: string;
    mediaId: string;
    translatedText: string;
  }) {
    await this.mediaCollection.updateOne(
      { _id: mediaId, owner: userId },
      { $set: { translatedText } }
    );

    return { success: true };
  }
}
```

---

## 🎯 Key Pattern

**Every method should:**
1. ✅ Accept `userId` as first parameter
2. ✅ Use `userId` for filtering queries
3. ✅ Set `owner: userId` when creating documents

```typescript
async methodName({ userId, ...otherParams }) {
  // When creating:
  const doc = await collection.insert({
    ...data,
    owner: userId  // ✅ Set owner
  });

  // When querying:
  const results = await collection.find({
    ...query,
    owner: userId  // ✅ Filter by owner
  });
}
```

---

## 🚀 After Fixing

1. **Save** your `MediaManagement.ts` file
2. **Restart** your backend server (it should auto-restart if watching)
3. **Refresh** your frontend
4. **Try creating a folder** - it should now appear!

---

## 🐛 Verify the Fix

### Backend Logs
After creating a folder, check your backend terminal. You should see the `userId` being received:
```typescript
// Add this console.log to verify:
async createFolder({ userId, filePath, name }) {
  console.log('📥 createFolder received userId:', userId);
  // ... rest of code
}
```

### Database Check
If you have MongoDB Compass or similar, check your collections:
```json
// folders collection should have:
{
  "_id": "...",
  "name": "My Images",
  "filePath": "/",
  "owner": "019a064b-c751-7714-ae2f-ce3c07930189",  // ✅ Should match logged-in user
  "createdAt": "2025-10-21T..."
}
```

---

## 📞 Still Having Issues?

If folders still don't show after this fix, check:

1. **Frontend sending userId?**
   - Browser console: `📤 Sending createFolder with userId: [id]`

2. **Backend receiving userId?**
   - Backend logs: `📥 createFolder received userId: [id]`

3. **Same userId for create and list?**
   - Create: `userId: abc123`
   - List: `userId: abc123` ← Must match!

4. **Database has owner field?**
   - Check MongoDB: folders should have `owner` field
