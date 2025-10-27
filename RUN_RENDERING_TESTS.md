# 🧪 Run Rendering Tests

I've created two test files to help debug the rendering issue.

## 📁 Test Files

1. **`test-rendering-textbox.ts`** - Basic functionality test
2. **`test-rendering-with-real-data.ts`** - Real-world data scenarios

## 🚀 How to Run

### **From your FRONTEND folder:**

```powershell
# Test 1: Basic functionality
deno run --allow-write --allow-net test-rendering-textbox.ts

# Test 2: Real-world data
deno run --allow-write --allow-net test-rendering-with-real-data.ts
```

## 📊 What Each Test Does

### **Test 1: Basic (`test-rendering-textbox.ts`)**

Tests these scenarios:
- ✅ Normal text box (200x50)
- ✅ Small text box (10x10)
- ✅ Fractional dimensions (5.5x3.7)
- ✅ Invalid dimensions (0x0)
- ✅ Very small (0.5x0.3)
- ✅ Large text box (300x100)

**Output:** Creates `test-rendering-output.png`

### **Test 2: Real Data (`test-rendering-with-real-data.ts`)**

Tests with data that looks like what your frontend sends:
- Normal coordinates
- Fractional coordinates (100.5, 150.7, etc.)
- Very small boxes (< 1px after flooring)
- Edge cases (exactly 1px)
- Problematic cases (0.7px width)

**Output:** Creates `test-real-data-output.png`

## 🔍 What to Look For

### **In the Console:**

```
📦 Element 1/7:
   Text: "ライオン・キング"
   Position: { x: 100, y: 50, x2: 300, y2: 100 }
   Raw coordinates:
      From: (100, 50)
      To: (300, 100)
   Raw dimensions: 200x50
   Floored dimensions: 200x50
   Final dimensions: 200x50
   🎨 Creating canvas...
   ✅ Canvas created successfully
```

### **If There's an Error:**

```
📦 Element 4/7:
   Text: "T"
   Position: { x: 100, y: 200, x2: 100.5, y2: 201 }
   Raw dimensions: 0.5x1
   Floored dimensions: 0x1
   ❌ Invalid dimensions after flooring!
   🔍 Analysis:
      x2 - x = 100.5 - 100 = 0.5
      floor(width) = 0
      floor(height) = 1
```

## 🎯 Find the Problem

The test will show you **exactly** which coordinates cause the issue:

1. **Look for** `❌ ERROR` in the output
2. **Check the coordinates** that caused it
3. **See the dimensions** before and after flooring
4. **Compare** with your actual data from the frontend

## 📝 Example Output

```
🎨 ========== SIMULATING ACTUAL RENDER ==========

📷 Creating main image (800x600)...
✅ Main image created

📦 Element 1/7:
   Text: "ライオン・キング"
   Position: { x: 100, y: 50, x2: 300, y2: 100 }
   Raw dimensions: 200x50
   Floored dimensions: 200x50
   Final dimensions: 200x50
   🎨 Creating canvas...
   ✅ Canvas created successfully
   🎨 Compositing at (100, 50)...
   ✅ Composited successfully

... (more elements)

💾 Saving result...
✅ Saved to: test-real-data-output.png

✅ ========== TEST COMPLETED ==========
```

## 🐛 Debug Your Actual Data

To test with YOUR actual coordinates:

1. **Get the coordinates** from your browser console when rendering fails
2. **Edit `test-rendering-with-real-data.ts`**
3. **Add your data** to the `testData` array:

```typescript
const testData: TextElement[] = [
  {
    text: "Your actual text",
    position: {
      x: 123.45,   // Your actual x
      y: 67.89,    // Your actual y
      x2: 234.56,  // Your actual x2
      y2: 178.90   // Your actual y2
    }
  }
];
```

4. **Run the test** again

## ✅ Expected Results

If all tests pass:
- You'll see `✅ ========== TEST COMPLETED ==========`
- Two PNG files will be created
- No errors in console

If a test fails:
- You'll see exactly which element failed
- The exact coordinates that caused the problem
- Details about dimensions before/after flooring

## 🔧 What to Do Next

### **If Test 1 Fails:**
The basic ImageScript functionality isn't working - might be a Deno/ImageScript issue

### **If Test 2 Fails:**
One of the real-world scenarios is problematic - check which one and adjust the validation in `RenderingWithTextBoxes.ts`

### **If Both Pass:**
The issue is with the actual data from your frontend - check browser console for the actual coordinates being sent

## 📞 Send Me the Results

Run the tests and send me:
1. The console output (copy/paste the entire output)
2. Which test failed (if any)
3. The coordinates that caused the error

Then I can fix the exact issue!

---

**Quick Command:**
```powershell
# Run both tests
deno run --allow-write --allow-net test-rendering-with-real-data.ts && deno run --allow-write --allow-net test-rendering-textbox.ts
```
