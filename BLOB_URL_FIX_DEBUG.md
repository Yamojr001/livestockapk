# Blob URL Fix - Complete Debug Guide

## Problem Identified
**Issue**: Images are being saved in database as blob URLs instead of proper backend URLs.
```
❌ WRONG: blob:http://localhost:8081/b9a955dd-1ba4-41c4-80fa-3dfc26cb671e
✅ RIGHT: http://localhost:8000/storage/farmers/farmer_1707XXX_abc123.jpg
```

## Root Causes Fixed

### 1. Backend Issue - Improper Base64 Handling
**Problem**: Backend wasn't properly extracting base64 data from the data URI format.

**Old Code**:
```php
$image = str_replace(['data:image/png;base64,', 'data:image/jpeg;base64,', ' '], ['', '', '+'], $imageData);
$binaryImage = base64_decode($image);
```

**Issues**:
- String replacement wasn't reliable (could miss other MIME types)
- Didn't handle edge cases properly
- Didn't validate if decoding succeeded

**New Code**:
```php
// Proper extraction using explode
$base64Image = explode(',', $imageData, 2)[1] ?? '';

// Validate extraction
if (empty($base64Image)) {
    throw new \Exception('Could not extract base64 data from image');
}

// Decode with validation
$binaryImage = base64_decode($base64Image, true);

if ($binaryImage === false) {
    throw new \Exception('Failed to decode base64 image data');
}

// Save binary to disk
$saved = Storage::disk('public')->put($relativePath, $binaryImage);

if (!$saved) {
    throw new \Exception('Failed to save image file to storage');
}
```

**Improvements**:
- ✅ Properly extracts base64 from any MIME type
- ✅ Validates each step with error checking
- ✅ Returns proper full URL on success
- ✅ Sets image to null on failure (doesn't store blob URL)

### 2. Frontend Safety - Blob URL Detection
**Problem**: Sometimes blob URLs might make it through to backend if frontend had issues.

**Added Safety Check**:
```typescript
// Safety check: Never send blob URLs to backend
if (farmerImage && farmerImage.startsWith('blob:')) {
  console.error("ERROR: Blob URL detected, converting to base64");
  try {
    const base64 = await FileSystem.readAsStringAsync(farmerImage, { encoding: "base64" });
    finalImage = `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    console.error("Cannot convert blob URL:", e);
    finalImage = null;
  }
}
```

### 3. Comprehensive Error Logging
**Added Detailed Logs**:
```php
Log::info('Processing image upload', [
    'has_image' => true,
    'image_prefix' => substr($imageData, 0, 50),
]);

Log::info('Image saved successfully', [
    'filename' => $imageName,
    'path' => $relativePath,
    'url' => $imageUrl,
    'size' => strlen($binaryImage),
]);

Log::error('Failed to save image', [
    'error' => $e->getMessage(),
    'image_length' => strlen($imageData),
    'image_prefix' => substr($imageData, 0, 100),
]);
```

## Testing Steps

### Step 1: Check Logs
```bash
# Watch Laravel logs in real-time
tail -f livestock-api/storage/logs/laravel.log

# When you upload an image, you should see:
# [timestamp] local.INFO: Processing image upload {"has_image":true,"image_prefix":"data:image/jpeg;base64,/9j/4AAQ..."}
# [timestamp] local.INFO: Image saved successfully {"filename":"farmer_1707234562_5f8c9a1d.jpg","path":"farmers/farmer_1707234562_5f8c9a1d.jpg","url":"http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg","size":123456}
```

### Step 2: Check Database
```bash
# Connect to MySQL
mysql -u root -p

# Use your database
use livestock_db;

# Query submissions and check farmer_image field
SELECT id, registration_id, farmer_image FROM livestock_submissions ORDER BY created_at DESC LIMIT 5;

# Expected output (NOT blob):
# +----+-----------+-------------------------------------------------------------------------------+
# | id | reg_id    | farmer_image                                                                  |
# +----+-----------+-------------------------------------------------------------------------------+
# | 1  | JG-123456 | http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg        |
# | 2  | JG-123457 | http://localhost:8000/storage/farmers/farmer_1707234563_6f8c9b2e.jpg        |
```

### Step 3: Check File System
```bash
# Check if files are actually saved
ls -lah livestock-api/storage/app/public/farmers/

# Expected:
# drwxr-xr-x  2 www-data www-data 4.0K Feb 24 12:34 farmers/
# -rw-r--r--  1 www-data www-data 145K Feb 24 12:30 farmer_1707234562_5f8c9a1d.jpg
# -rw-r--r--  1 www-data www-data 128K Feb 24 12:31 farmer_1707234563_6f8c9b2e.jpg

# Check symlink
ls -lah livestock-api/storage/

# Expected:
# lrwxrwxrwx 1 www-data www-data 30 Feb 24 12:00 storage -> public/storage
```

### Step 4: Test Image Access
```bash
# Try to access image directly (will only work if symlink is set up)
# In browser: http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg

# Or test from command line
curl -I http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg
# Should return: HTTP/1.1 200 OK
# NOT: 404 Not Found
```

### Step 5: Frontend Verification
```bash
# Check Network tab in browser DevTools:
# POST /submissions should have in Response:
# {
#   "success": true,
#   "data": {
#     "farmer_image": "http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg"
#   }
# }

# NOT:
# {
#   "farmer_image": "blob:http://localhost:8081/..."
# }
```

## If You Still See Blob URLs

### Check 1: Did You Run Storage Link?
```bash
cd livestock-api
php artisan storage:link
```

If you see: `The [storage] link has been connected.` ✅

### Check 2: Is Image Directory Writable?
```bash
# Check permissions
ls -lad livestock-api/storage/app/public/farmers/

# Should show: drwxrwxrwx or drwxr-xr-x
# If it shows: dr--r--r-- ❌ - needs fix:
chmod 755 livestock-api/storage/app/public/farmers/
```

### Check 3: Check Laravel Logs for Errors
```bash
tail -n 50 livestock-api/storage/logs/laravel.log | grep -i "image\|error\|failed"

# Look for lines like:
# [ERROR] Failed to decode base64 image data
# [ERROR] Failed to save image file to storage
```

### Check 4: Verify Base64 is Being Sent
```bash
# Add temporary debug in SubmissionFormScreen.tsx
console.log('Final image to send:', finalImage?.substring(0, 100));

# Should show in browser console:
# Final image to send: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...
# NOT: blob:http://localhost:8081/...
```

### Check 5: Check API Config
```bash
# Verify api-config.ts has correct backend URL
cat client/lib/api-config.ts | grep -i "baseurl\|api"

# Should show: http://localhost:8000 (not 8081)
# 8000 = Laravel backend
# 8081 = React Native dev server (wrong!)
```

## Cleanup If Already Have Blob URLs

```bash
# 1. Stop the apps
# Press Ctrl+C on all terminals

# 2. Clear old submissions with blob URLs
mysql -u root -p
use livestock_db;
DELETE FROM livestock_submissions WHERE farmer_image LIKE 'blob:%';

# 3. Clear storage cache
cd livestock-api
php artisan cache:clear
php artisan config:clear

# 4. Remove old images (optional)
rm -f livestock-api/storage/app/public/farmers/*

# 5. Restart backend
cd livestock-api
php artisan serve

# 6. In another terminal, restart frontend
npm run android  # or npm run ios

# 7. Test upload again
```

## Complete Verification Checklist

- [ ] Backend logs show `Image saved successfully` with `.jpg` URL
- [ ] Database shows full URL (not blob:)
- [ ] File exists in `storage/app/public/farmers/`
- [ ] Can access image via browser at `http://localhost:8000/storage/farmers/farmer_*.jpg`
- [ ] Frontend receives full URL from `/submissions` POST response
- [ ] Image displays in Data Management screen
- [ ] ID card displays image correctly

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `SubmissionController.php` | Improved base64 extraction and error handling | Ensures images are saved properly, not as blob URLs |
| `SubmissionFormScreen.tsx` | Added blob URL safety check | Prevents blob URLs from reaching backend |

## Expected Result After Fix

**Before**:
```
Database: farmer_image = "blob:http://localhost:8081/b9a955dd-1ba4-..."
Frontend: Shows broken image
Error: net::ERR_FILE_NOT_FOUND
```

**After**:
```
Database: farmer_image = "http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg"
Frontend: Shows image correctly ✅
File System: Image saved at storage/app/public/farmers/farmer_1707234562_5f8c9a1d.jpg ✅
```

---

**Last Updated**: February 24, 2026
**Status**: Complete Fix Applied ✅
