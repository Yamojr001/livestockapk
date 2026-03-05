# Quick Test Commands - Blob URL Fix

## Immediate Actions to Take

### 1. Stop All Servers (if running)
```bash
# Press Ctrl+C in all terminals
```

### 2. Clear Database Records with Blob URLs
```bash
# Windows (XAMPP)
mysql -u root
# OR with password if you set one:
mysql -u root -p

# macOS/Linux
mysql -u root -p

# Once in MySQL
use livestock_db;
DELETE FROM livestock_submissions WHERE farmer_image LIKE 'blob:%';
EXIT;
```

### 3. Clear Storage Cache
```bash
cd livestock-api
php artisan cache:clear
php artisan config:clear
```

### 4. Verify Storage Link
```bash
cd livestock-api
php artisan storage:link
# Should output: The [storage] link has been connected.
```

### 5. Start Backend Server
```bash
cd livestock-api
php artisan serve
# Should show: Laravel development server started on livestock.northdemy.com
```

### 6. In Another Terminal - Start Frontend
```bash
cd /home/yamojr/Downloads/Role-Based-Access\ \(2\)
npm run android
# Or for iOS: npm run ios

# Wait until it shows: "App is ready at..."
```

### 7. Test Upload
```
1. Login to app
2. Go to "Submit Data" or "Add Submission"
3. Take/Select a photo
4. Fill in form
5. Submit
```

### 8. Check If It Worked

**Option A: Check Logs in Real-Time**
```bash
# In another terminal while uploading:
tail -f livestock-api/storage/logs/laravel.log | grep -i "image\|farmer"
```

**Option B: Check Database**
```bash
mysql -u root -p
use livestock_db;
SELECT id, registration_id, farmer_image FROM livestock_submissions ORDER BY created_at DESC LIMIT 3;
```

**Option C: Check File System**
```bash
# Check if image file was saved
ls -lh livestock-api/storage/app/public/farmers/

# Should see files like: farmer_1707234562_5f8c9a1d.jpg
# Not empty or no files = problem!
```

**Option D: Check in Browser**
```bash
# Go to DevTools Network tab
# When uploading, look for POST /submissions
# Response should contain:
{
  "success": true,
  "data": {
    "farmer_image": "http://localhost:8000/storage/farmers/farmer_1707XXX.jpg"
  }
}

# NOT blob:http://... ✅
```

## If Still Seeing Blob URLs

### Nuclear Option: Clean Everything
```bash
# 1. Delete all submissions with blob URLs
mysql -u root -p
use livestock_db;
DELETE FROM livestock_submissions WHERE farmer_image LIKE 'blob:%' OR farmer_image IS NULL;
OPTIMIZE TABLE livestock_submissions;
EXIT;

# 2. Delete storage files
rm -rf livestock-api/storage/app/public/farmers/*

# 3. Re-create symlink
cd livestock-api
php artisan storage:link

# 4. Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# 5. Restart server
php artisan serve
```

### Check What's Wrong

**Test 1: Can you access storage directory?**
```bash
ls -ld livestock-api/storage/app/public/farmers/
# If permission denied:
chmod 755 livestock-api/storage/app/public/farmers/
```

**Test 2: Is symlink working?**
```bash
ls -la livestock-api/storage/
# Should show: storage -> public/storage
# If not:
rm livestock-api/storage
php artisan storage:link
```

**Test 3: Can Laravel write files?**
```bash
touch livestock-api/storage/app/test.txt
# If permission denied, backend can't write!
# Fix: Check folder permissions
```

**Test 4: Check Base64 Conversion**
```bash
# Add this in SubmissionFormScreen.tsx after line 340:
console.log('FINAL IMAGE TYPE:', typeof finalImage);
console.log('FINAL IMAGE PREFIX:', finalImage?.substring(0, 150));

# Upload and check browser console
# Should show: data:image/jpeg;base64,/9j/4AAQSkZJ...
# NOT: blob:http://...
```

**Test 5: Check API Endpoint**
```bash
# Test the submission endpoint directly
curl -X GET http://localhost:8000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return JSON, not HTML error
# If 500 error, check logs:
tail -f livestock-api/storage/logs/laravel.log
```

## Verification Checklist

Run this after implementing fix:

```bash
#!/bin/bash
echo "🔍 Blob URL Fix Verification"
echo "================================"

# 1. Check backend code
echo "1️⃣  Checking backend image handling..."
if grep -q "explode(',', \$imageData, 2)" livestock-api/app/Http/Controllers/SubmissionController.php; then
  echo "✅ Backend code updated"
else
  echo "❌ Backend code NOT updated - FIX NEEDED"
fi

# 2. Check frontend code
echo ""
echo "2️⃣  Checking frontend blob safety..."
if grep -q "blob:" client/screens/SubmissionFormScreen.tsx; then
  echo "✅ Frontend has blob detection"
else
  echo "❌ Frontend blob check missing"
fi

# 3. Check storage directory
echo ""
echo "3️⃣  Checking storage directory..."
if [ -d "livestock-api/storage/app/public/farmers" ]; then
  count=$(ls -1 livestock-api/storage/app/public/farmers 2>/dev/null | wc -l)
  echo "✅ farmers directory exists with $count files"
else
  echo "❌ farmers directory missing"
fi

# 4. Check storage symlink
echo ""
echo "4️⃣  Checking storage symlink..."
if [ -L "livestock-api/storage" ]; then
  echo "✅ Storage symlink exists"
else
  echo "❌ Storage symlink NOT found - RUN: php artisan storage:link"
fi

echo ""
echo "================================"
echo "Fix verification complete!"
```

Save as `verify-blob-fix.sh` and run:
```bash
bash verify-blob-fix.sh
```

## What Each File Does

| File | Purpose |
|------|---------|
| `livestock-api/app/Http/Controllers/SubmissionController.php` | **FIXED**: Properly handles base64 images |
| `client/screens/SubmissionFormScreen.tsx` | **FIXED**: Prevents blob URLs from being sent |
| `livestock-api/storage/app/public/farmers/` | Stores actual image files |
| `livestock-api/storage` (symlink) | Makes images accessible via public URL |

## Expected Results

### Before Fix
```
Database:     farmer_image = blob:http://localhost:8081/...
Frontend:     ❌ Image broken, shows placeholder
File System:  No image file saved
Error Log:    "Cannot find blob:// file"
```

### After Fix
```
Database:     farmer_image = http://localhost:8000/storage/farmers/farmer_1707234562_5f8c9a1d.jpg
Frontend:     ✅ Image displays correctly
File System:  Image saved at storage/app/public/farmers/farmer_1707234562_5f8c9a1d.jpg
Error Log:    "Image saved successfully"
```

---

**Need Help?** Check BLOB_URL_FIX_DEBUG.md for detailed troubleshooting.
