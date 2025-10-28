# 🚀 Complete User Journey Guide

This guide walks you through the entire workflow of TEP Konjac, from creating your account to rendering your translated image.

---

## 📋 Table of Contents
1. [Sign Up & Login](#1-sign-up--login)
2. [Create a New Folder](#2-create-a-new-folder)
3. [Upload an Image](#3-upload-an-image)
4. [AI Text Extraction](#4-ai-text-extraction)
5. [Translate Extracted Text](#5-translate-extracted-text)
6. [Manual Location Editing](#6-manual-location-editing)
7. [Final Rendering](#7-final-rendering)

---

## 1. 🔐 Sign Up & Login

### First Time User - Sign Up
1. **Open the application** in your browser
2. You'll see the **authentication page** with the TEP Konjac logo
3. Click **"Sign Up"** button at the bottom
4. Fill in the registration form:
   - **Username**: Choose a unique username
   - **Email**: Enter your email address
   - **Password**: Create a secure password
5. Click **"✨ Sign Up"** to create your account
6. You'll be automatically logged in after successful registration

### Returning User - Log In
1. Enter your **email** and **password**
2. Click **"🔓 Log In"**
3. You'll be redirected to the main dashboard

> **Note**: Each user has isolated storage, so your files are private and secure.

---

## 2. 📁 Create a New Folder

Organize your images by creating folders for different projects.

1. **Locate the Folder Browser** on the left side of the dashboard
2. Click the **"+ New Folder"** button (blue rounded button)
3. Enter a **folder name** when prompted
   - Example: "Manga Chapter 1", "Marketing Materials", "Japanese Signs"
4. Press **Enter** or click **OK**
5. Your new folder appears in the folder list
6. **Click on the folder name** to navigate into it

### Navigation Tips:
- Use **breadcrumbs** at the top to see your current path
- Click **"← Back"** to return to the parent folder
- Click any folder name in breadcrumbs to jump directly to that level

---

## 3. 📤 Upload an Image

Upload images that contain text you want to translate.

1. **Navigate to your desired folder** (or stay in root `/`)
2. Click **"📤 Upload"** button in the upload section
3. The upload area expands - you have two options:

   **Option A: Drag & Drop**
   - Drag your image file from your computer
   - Drop it onto the upload area

   **Option B: Click to Browse**
   - Click the **"📁 Choose File"** text in the upload area
   - Select your image from the file browser
   - Supported formats: **JPG, PNG, WebP**

4. **Preview** your image
   - You'll see a preview of the selected image
   - File name and size are displayed
5. Click **"⬆️ Upload"** to confirm
6. Wait for the upload to complete
7. Your image appears in the **Media Gallery** below

> **Tip**: The current folder path is shown at the top, so you always know where you're uploading to!

---

## 4. 🤖 AI Text Extraction

Let AI automatically detect and extract text from your image.

1. **Select your uploaded image** from the gallery
   - Click on the image card
   - The image card will have a blue border when selected
2. File details appear on the right panel
3. Click **"✏️ Edit Image"** button
4. The **Image Editor** opens in a modal

### Extract Text with AI:
1. In the Image Editor, locate the **"🤖 Extract Text with AI"** button
   - It's a green button with the light green accent color
2. Click the button to start AI extraction
3. **Wait for processing** (this may take 10-30 seconds)
   - The button shows "⏳ Please wait..."
   - AI analyzes the image and detects text regions
4. **Review extracted text**:
   - Each detected text element appears in a card
   - Shows:
     - **Original Text**: The text detected by AI
     - **Coordinates**: Location (x, y, width, height) where text was found
     - **Visual Indicators**: Box dimensions are highlighted

### Manual Text Extraction (Optional):
If AI misses some text, you can add it manually:
1. Click **"+ Add Text"** button
2. Enter the text in the textarea
3. Enter coordinates manually:
   - **X**: Horizontal position (pixels from left)
   - **Y**: Vertical position (pixels from top)
   - **Width**: Text box width in pixels
   - **Height**: Text box height in pixels
4. Click **"💾 Save"** to add the extraction

> **Pro Tip**: You can edit text by clicking the ✏️ (pencil) icon next to any extracted text!

---

## 5. 🌐 Translate Extracted Text

Translate your extracted text into multiple languages.

1. In the **Image Editor**, scroll to your extracted text items
2. Each extraction card has a **"🌐 Translate"** button at the bottom
3. Click **"🌐 Translate"** on the text you want to translate
4. A **Translation Dialog** appears with:
   - **Original Text**: Shows the source text
   - **Language Selection**: Choose from 4 languages:
     - 🇺🇸 **English**
     - 🇨🇳 **Chinese (Simplified)**
     - 🇯🇵 **Japanese**
     - 🇰🇷 **Korean**
5. **Select your target language** by clicking on it
   - The selected language has a blue gradient background
6. Click **"✅ Translate"** to confirm
7. **Wait for AI translation** (5-15 seconds)
8. The translation appears below the original text in the extraction card

### Managing Translations:
- **View**: Translations are shown with their language code (EN, CN, JP, KR)
- **Edit**: Click the ✏️ pencil icon next to a translation to modify it
- **Delete**: Click the 🗑️ trash icon to remove a translation
- **Multiple Languages**: You can translate the same text into multiple languages

> **Note**: Each text element can have translations in all 4 languages!

---

## 6. 🎯 Manual Location Editing

After rendering, you may need to adjust text box positions for better results.

### Why Edit Locations?
- AI might place text boxes slightly off
- Text might overlap with images
- You want better visual alignment
- The rendered preview doesn't look right

### How to Edit Locations:

#### Method 1: From the Image Editor
1. In the **Image Editor**, find the extraction you want to adjust
2. Scroll to the **Coordinates** section (blue box with coordinate icons)
3. Click **"📍 Edit Coordinates"**
4. The coordinate inputs become editable with a green background
5. **Adjust the values**:
   - **X** ↔️: Move left (lower) or right (higher)
   - **Y** ↕️: Move up (lower) or down (higher)
   - **Width** ↔️: Make box narrower or wider
   - **Height** ↕️: Make box shorter or taller
6. Click **"💾 Save"** when done
7. The coordinates update immediately

#### Method 2: From the Rendering Panel (Recommended)
1. Close the Image Editor
2. Click **"🎨 Render Text"** to open the Rendering Panel
3. The panel shows a **side-by-side layout**:
   - **Left**: Scrollable list of text elements
   - **Right**: Sticky rendered preview
4. Select the **target language** (EN, CN, JP, or KR) at the top
5. **Check/uncheck text elements** you want to include in rendering
6. In the element list, click **"📍 Edit Location"** button for any text
7. A **location editor** appears inline with input fields
8. **Adjust coordinates** and see changes in real-time
9. The preview updates automatically as you edit

### Tips for Location Editing:
- **Start small**: Make incremental changes (±5-10 pixels)
- **Use the preview**: The rendering preview shows exactly where text will appear
- **Check dimensions**: Ensure width/height match your text length
- **Test render**: Do a quick render to verify positioning

---

## 7. 🎨 Final Rendering

Generate your final image with translated text overlays.

### Prepare for Rendering:
1. Click **"🎨 Render Text"** button from the file details panel
2. The **Rendering Panel** opens in a modal
3. You'll see a side-by-side layout

### Configure Rendering:
1. **Select Language** at the top:
   - Choose the language version you want to render
   - Text elements show translations in that language
2. **Select Text Elements**:
   - Each text element has a checkbox
   - ✅ Check: Include in rendering
   - ⬜ Uncheck: Skip this text
   - You can selectively render only certain texts
3. **Review Locations**:
   - Red dashed border = Missing location data (fix before rendering)
   - Blue solid border = Location is set (ready to render)
   - Position information shown below each text

### Start Rendering:
1. Click **"🎨 Render Image"** button (yellow, at the bottom)
2. **Wait for processing** (10-30 seconds depending on image size)
   - The button shows "⏳ Rendering..."
   - The system:
     - Loads your original image
     - Creates white text boxes at specified locations
     - Overlays translated text in black
     - Centers and sizes text automatically
3. **Preview appears** in the right panel
   - You'll see the rendered image with text overlays
   - White background boxes with black text

### Review & Download:
1. **Check the preview**:
   - Is text positioned correctly?
   - Is text readable?
   - Do you need to adjust any locations?
2. If **adjustments needed**:
   - Click **"📍 Edit Location"** for specific texts
   - Make changes
   - Click **"🎨 Render Image"** again
3. If **satisfied**:
   - Right-click the preview image
   - Select **"Save image as..."**
   - Choose your download location
   - Save your translated image!

> **Note**: Each new render replaces the previous one, so there's always just one render output per media file.

---

## 🎉 Workflow Summary

Here's the complete journey at a glance:

```
1. Sign Up / Login
   ↓
2. Create Folder (organize your work)
   ↓
3. Upload Image (drag & drop or browse)
   ↓
4. AI Text Extraction (automatic detection)
   ↓
5. Translate Text (choose language, AI translates)
   ↓
6. Review Rendering (check text positions)
   ↓
7. Edit Locations (adjust if needed)
   ↓
8. Final Render (generate translated image)
   ↓
9. Download (save your result!)
```

---

## 💡 Pro Tips

### For Best Results:
- **High-quality images**: Use clear, well-lit images for better AI extraction
- **Clean backgrounds**: Simpler backgrounds help AI detect text more accurately
- **Test translations**: Review AI translations and edit if needed for accuracy
- **Iterative positioning**: Don't expect perfect placement first try—iterate!
- **Preview before final**: Always check the rendered preview before downloading

### Organizing Your Work:
- Create **folders by project** or **language pair**
- Use **descriptive file names** when uploading
- Keep **related images together** in the same folder
- **Translate systematically**: Do all extractions, then all translations, then render

### Troubleshooting:
- **AI missed text?** → Add manual extraction with coordinates
- **Translation not accurate?** → Click ✏️ to edit translation manually
- **Text positioned wrong?** → Edit coordinates from Rendering Panel
- **Can't see translated text?** → Ensure you selected the right language
- **Render looks off?** → Adjust location coordinates and re-render

---

## 🔄 Need Help?

- **Missing features?** Check that you've completed all previous steps
- **Errors?** Try refreshing the page and logging in again
- **Data not saving?** Ensure you're logged in with a valid account
- **Performance slow?** Large images take longer to process—be patient!

---

## 🌟 Congratulations!

You've completed the full TEP Konjac workflow! You can now:
- ✅ Manage your translated image projects
- ✅ Extract text using AI
- ✅ Translate into multiple languages
- ✅ Fine-tune positioning
- ✅ Generate professional translated images

**Happy translating!** 🎨✨
