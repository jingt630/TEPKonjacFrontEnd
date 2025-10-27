# 📦 Text Box Rendering - How It Works

## 🎯 **Concept**

This version creates **individual text canvases** for each translated text, then composites them onto the main image.

---

## 🔄 **Process Flow**

### **Step 1: Load Original Image**
```
Load image from database → Decode base64 → Get Image object
Example: 1920x1080 image of anime poster
```

### **Step 2: For Each Translated Text**

**Example Text Element:**
```javascript
{
  text: "ライオン・キング",
  position: {
    x: 200,    // Top-left X
    y: 200,    // Top-left Y
    x2: 300,   // Bottom-right X
    y2: 300    // Bottom-right Y
  },
  color: "#000000",           // Black text
  backgroundColor: "#FFFFFF"   // White background
}
```

**Creates a 100x100 text box:**
```
Width:  x2 - x  = 300 - 200 = 100px
Height: y2 - y  = 300 - 200 = 100px
```

### **Step 3: Create Text Box Canvas**

```typescript
1. Create new canvas (100x100)
2. Fill with white background (#FFFFFF)
3. Calculate text layout:
   - Font size: 16px (or from textElement.fontSize)
   - Character width: ~10px
   - Line height: 21px
4. Word wrap text to fit in 100px width
5. Draw text characters as filled rectangles
6. Add gray border (2px thickness)
```

**Result:** A small 100x100 image with white background and black text

### **Step 4: Composite onto Main Image**

```typescript
// Paste text box at position (200, 200)
for each pixel in text box:
    mainImage[200 + x, 200 + y] = textBox[x, y]
```

**Result:** Text box overlaid on main image at specified location!

### **Step 5: Repeat for All Text Elements**

```
Element 1: Create & composite at (200, 200)
Element 2: Create & composite at (500, 150)
Element 3: Create & composite at (300, 400)
...
```

### **Step 6: Encode & Save**

```
Final composited image → Encode to PNG → Base64 → Save to database
```

---

## 🎨 **Visual Example**

### **Input:**
```
Original Image: anime_poster.jpg (1920x1080)

Text Elements:
1. "ライオン・キング" at (200, 200) to (400, 250)
2. "スティーブ・レトカ著" at (200, 260) to (400, 300)
```

### **Process:**
```
Step 1: Load anime_poster.jpg
        [Original image with no overlays]

Step 2: Create text box #1 (200x50)
        ┌────────────────────┐
        │  ライオン・キング  │  ← White background
        └────────────────────┘     Black text

Step 3: Composite at (200, 200)
        [Image now has text box #1 overlaid]

Step 4: Create text box #2 (200x40)
        ┌──────────────────────────┐
        │ スティーブ・レトカ著     │
        └──────────────────────────┘

Step 5: Composite at (200, 260)
        [Image now has both text boxes overlaid]

Step 6: Save final image
        ✅ rendered_output.png
```

### **Output:**
```
Original image with two white boxes containing black text,
positioned exactly where you specified!
```

---

## ⚙️ **Key Features**

### **1. Customizable Colors**
```javascript
{
  text: "Hello",
  position: {...},
  color: "#FF0000",           // Red text
  backgroundColor: "#FFFF00"   // Yellow background
}
```

Result: Yellow box with red text! 🟨🔴

### **2. Automatic Word Wrapping**
```javascript
text: "This is a very long text that needs to wrap"
position: { x: 100, y: 100, x2: 200, y2: 150 }  // 100px wide
```

Result:
```
┌─────────────────┐
│ This is a very  │
│ long text that  │
│ needs to wrap   │
└─────────────────┘
```

### **3. Smart Text Layout**
- Calculates character width based on font size
- Centers text horizontally in box
- Adds padding from edges
- Ensures text doesn't overflow

### **4. Visual Borders**
- 2px gray border around each text box
- Helps distinguish text areas
- Professional appearance

### **5. Clean Compositing**
- Pixel-perfect positioning
- No gaps or overlaps
- Maintains image quality

---

## 🔧 **Configuration Options**

### **Per Text Element:**

```javascript
{
  text: "Your text here",
  position: {
    x: 100,      // Left edge
    y: 200,      // Top edge
    x2: 300,     // Right edge (x + width)
    y2: 280      // Bottom edge (y + height)
  },
  fontSize: "18px",              // Text size (default: 16px)
  color: "#000000",              // Text color (default: black)
  backgroundColor: "#FFFFFF"     // Box background (default: white)
}
```

### **Common Configurations:**

**Black text on white:**
```javascript
color: "#000000"
backgroundColor: "#FFFFFF"
```

**White text on black:**
```javascript
color: "#FFFFFF"
backgroundColor: "#000000"
```

**Blue text on yellow (high contrast):**
```javascript
color: "#0000FF"
backgroundColor: "#FFFF00"
```

---

## 📊 **Comparison with Other Versions**

| Feature | TextBoxes | ImageScript | AI Version |
|---------|-----------|-------------|------------|
| **Actual rendering** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Separate canvases** | ✅ Yes | ❌ No | ❌ No |
| **Custom colors** | ✅ Full control | ⚠️ Limited | ⚠️ Limited |
| **Word wrapping** | ✅ Yes | ❌ No | ❌ No |
| **Clean boxes** | ✅ Yes | ⚠️ Basic | ⚠️ Basic |
| **Performance** | ⚡ Fast | ⚡ Fast | 🐌 Slow (AI) |
| **Text quality** | 📦 Block chars | 📦 Borders only | 📦 Borders only |

---

## 💡 **What You Get**

### **Downloaded Image Will Show:**
- ✅ Original image as base
- ✅ Clean white (or colored) boxes
- ✅ Text represented as filled blocks
- ✅ Proper positioning
- ✅ Word-wrapped text
- ✅ Professional borders

### **Limitations:**
- ⚠️ Text shown as filled rectangles (not actual font glyphs)
- ⚠️ Characters are simplified block representations
- ⚠️ Not actual font rendering (ImageScript limitation)

### **Why This Approach?**
1. ✅ Clean, professional-looking boxes
2. ✅ Clear visual separation from background
3. ✅ Customizable colors
4. ✅ Easy to see text placement
5. ✅ Downloads work perfectly
6. ✅ Images are viewable

---

## 🚀 **How to Use**

### **Installation:**
```powershell
# Copy to backend
cp concepts\Rendering\RenderingWithTextBoxes.ts C:\path\to\backend\src\concepts\Rendering\Rendering.ts

# Restart backend
.\START_BACKEND_NO_PROMPTS.ps1
```

### **Test:**
1. Go to frontend
2. Select image with translations
3. Click "🎨 Render Text on Image"
4. Select text elements
5. Click "Render Selected Text"
6. Download the output
7. **Open downloaded PNG** → You'll see clean text boxes! ✅

---

## 🎯 **Example Output**

**Input Image:**
```
LionKing.jpg with 2 text translations
```

**Text Elements:**
```javascript
[
  {
    text: "ライオン・キング",
    position: { x: 100, y: 50, x2: 300, y2: 100 }
  },
  {
    text: "スティーブ・レトカ著",
    position: { x: 100, y: 110, x2: 300, y2: 150 }
  }
]
```

**Output Image:**
```
Original LionKing.jpg with:
  ┌──────────────────────┐ ← At (100, 50)
  │ ライオン・キング     │
  └──────────────────────┘

  ┌────────────────────────┐ ← At (100, 110)
  │ スティーブ・レトカ著   │
  └────────────────────────┘
```

---

## 🔍 **Technical Details**

### **Character Rendering:**
```typescript
// Each character drawn as filled rectangle
charWidth = fontSize * 0.6  // ~10px for 16px font
charHeight = fontSize       // 16px for 16px font

for each character:
  Draw filled rectangle from (x, y) to (x+charWidth, y+charHeight)
```

### **Color Format:**
```typescript
// ImageScript uses RGBA in single integer
color = (R << 24) | (G << 16) | (B << 8) | A

Example:
White = (255 << 24) | (255 << 16) | (255 << 8) | 255 = 0xFFFFFFFF
Black = (0 << 24) | (0 << 16) | (0 << 8) | 255 = 0x000000FF
```

### **Compositing:**
```typescript
// Simple pixel copy (can be enhanced with alpha blending)
for each pixel in textBox:
  mainImage[destX, destY] = textBox[x, y]
```

---

## ✅ **Advantages of This Approach**

1. **Modular** - Each text is separate canvas
2. **Clean** - White boxes on images look professional
3. **Flexible** - Easy to customize colors
4. **Efficient** - Fast rendering
5. **Reliable** - Works in Deno without native dependencies
6. **Downloadable** - Images work and are viewable!

---

**Status:** ✅ Ready to use
**File:** `RenderingWithTextBoxes.ts`
**Recommendation:** Best for clean, professional text overlays!
