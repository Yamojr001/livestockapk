# Image Upload & Caching System Documentation

## Overview
This system ensures that images are properly uploaded to the Laravel backend storage and cached locally on the device for offline use.

## Frontend Flow

### 1. Image Capture/Selection
- User takes photo or selects from gallery using `ImagePicker`
- Image is stored locally in app cache

### 2. Online Submission (Image Upload)
- Image is converted to **base64** format
- Base64 string is sent to backend API
- Image is cached locally using `imageCacheService.cacheImageFromBase64()`
- Server returns image path (e.g., `farmers/farmer_12345.jpg`)
- Server image URL is also cached using `imageCacheService.cacheImageFromUrl()`

### 3. Offline Submission
- Image is cached locally for later sync
- Cached image path is stored in submission
- When online, sync service reads cached image and sends as base64

### 4. Image Display
- First tries to get cached version using `imageCacheService.getCachedImage()`
- Falls back to remote URL if cached version not found
- Local file paths are used directly

## Backend Flow (Laravel)

### 1. Image Reception & Storage
**File**: `livestock-api/app/Http/Controllers/SubmissionController.php`

```php
// Detects base64 image data
if (str_starts_with($request->farmer_image, 'data:image')) {
    // Decodes base64 to binary
    // Saves to `storage/app/public/farmers/farmer_TIMESTAMP_UNIQID.jpg`
    // Returns relative path for storage
}
```

### 2. Storage Configuration
**File**: `livestock-api/config/filesystems.php`

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => rtrim(env('APP_URL'), '/').'/storage',
    'visibility' => 'public',
],
```

This means:
- Images are stored in: `storage/app/public/farmers/`
- Served via: `APP_URL/storage/farmers/farmer_TIMESTAMP_UNIQID.jpg`
- Accessible publicly for download/caching

### 3. Image Serving
Images can be accessed via:
```
http://your-domain/storage/farmers/farmer_12345_abc123.jpg
```

## Services & Classes

### ImageCacheService (`client/lib/image-cache-service.ts`)
Handles all image caching operations:

```typescript
// Cache image from remote URL
await imageCacheService.cacheImageFromUrl('https://...');

// Cache image from base64 data
await imageCacheService.cacheImageFromBase64(base64String, imageId);

// Get cached image path or null
const cachedPath = await imageCacheService.getCachedImage(imageUrl);

// Get image for display (cached or remote)
const displayUri = await imageCacheService.getImageForDisplay(imagePath);

// Clear expired cache (auto 30-day expiration)
await imageCacheService.clearExpiredCache();

// Get cache size
const sizeInBytes = await imageCacheService.getCacheSize();
```

**Storage Location**: `${FileSystem.documentDirectory}livestock_image_cache/`
**Cache Duration**: 30 days
**Cache Index**: Stored in `.cache_index.json`

### Submission Form (`client/screens/SubmissionFormScreen.tsx`)

**Online Flow**:
1. User takes/selects photo
2. On submit (online):
   - Converts to base64
   - Caches locally using `imageCacheService.cacheImageFromBase64()`
   - Sends base64 to backend
   - Backend saves and returns path
   - Caches server URL using `imageCacheService.cacheImageFromUrl()`

**Offline Flow**:
1. User takes/selects photo
2. On submit (offline):
   - Converts to base64
   - Caches locally using `imageCacheService.cacheImageFromBase64()`
   - Stores submission as pending with cached image path
   - When online, sync service reads cached image and sends as base64

### Sync Service (`client/lib/sync-service.ts`)

**Image Sync Process**:
```typescript
// When syncing pending submissions:
const apiData = await this.prepareApiData(submission);

// prepareApiData checks if image is a cached file path:
if (imagePath.includes(FileSystem.documentDirectory)) {
    // Reads cached image file
    // Converts to base64
    // Sends base64 to server
}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ USER SUBMISSION (ONLINE)                                │
├─────────────────────────────────────────────────────────┤
│ 1. Take/Select Photo                                    │
│    ↓                                                     │
│ 2. Convert to Base64                                    │
│    ↓                                                     │
│ 3. Cache Locally (imageCacheService)                    │
│    ↓                                                     │
│ 4. Send Base64 to Backend API                           │
│    ↓                                                     │
│ 5. Backend Saves to Storage/Public/Farmers/             │
│    ↓                                                     │
│ 6. Backend Returns Image Path (farmers/farmer_xxx.jpg)  │
│    ↓                                                     │
│ 7. Cache Server URL                                     │
│    ↓                                                     │
│ 8. Store Submission with Image Reference                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ USER SUBMISSION (OFFLINE)                               │
├─────────────────────────────────────────────────────────┤
│ 1. Take/Select Photo                                    │
│    ↓                                                     │
│ 2. Convert to Base64                                    │
│    ↓                                                     │
│ 3. Cache Locally (imageCacheService)                    │
│    ↓                                                     │
│ 4. Store Submission as Pending (cached image path)      │
│    ↓                                                     │
│ ⚡ OFFLINE - WAIT FOR INTERNET ⚡                        │
│    ↓                                                     │
│ 5. Online Sync: Read Cached Image                       │
│    ↓                                                     │
│ 6. Convert to Base64                                    │
│    ↓                                                     │
│ 7. Send to Backend                                      │
│    ↓                                                     │
│ 8. Backend Saves & Returns Path                         │
│    ↓                                                     │
│ 9. Cache Server URL                                     │
│    ↓                                                     │
│ 10. Move to Synced Submissions                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ IMAGE DISPLAY                                            │
├─────────────────────────────────────────────────────────┤
│ 1. Get Image Path from Submission                       │
│    ↓                                                     │
│ 2. Check if Cached?                                     │
│    ├─→ YES: Use Cached Path (OFFLINE-READY)             │
│    └─→ NO: Use Remote URL                               │
│    ↓                                                     │
│ 3. Display in Image Component                           │
│    ↓                                                     │
│ 4. Remote URL Auto-Caches on First Load                 │
└─────────────────────────────────────────────────────────┘
```

## Testing Checklist

### ✅ Online Submission with Image
- [ ] Take photo in submission form
- [ ] Submit (online)
- [ ] Check backend storage: `storage/app/public/farmers/farmer_*.jpg` exists
- [ ] Image path returned in response
- [ ] Verify image is cached locally

### ✅ Offline Submission with Image
- [ ] Turn off internet
- [ ] Take photo in submission form
- [ ] Submit (offline)
- [ ] Submission saved as pending
- [ ] Turn on internet
- [ ] Sync submissions
- [ ] Verify image uploaded to backend
- [ ] Verify submission is now synced

### ✅ Image Display (Online)
- [ ] View farmer details
- [ ] Image loads from backend
- [ ] Image is cached for offline use

### ✅ Image Display (Offline)
- [ ] View farmer details (offline)
- [ ] Image loads from cache
- [ ] No network errors

### ✅ Cache Management
- [ ] Images auto-cache with 30-day expiration
- [ ] Old images are cleaned up
- [ ] Cache size can be checked

## Environment Variables

**Laravel `.env`**:
```
FILESYSTEM_DISK=public
APP_URL=http://your-domain.com
```

**Expo `.env`**:
```
EXPO_PUBLIC_DOMAIN=your-domain.com
```

## Troubleshooting

### Images not saving to backend
1. Check `storage/app/public/farmers/` directory exists
2. Check directory permissions: `chmod 755 storage/app/public/farmers/`
3. Check Laravel logs: `tail -f storage/logs/laravel.log`
4. Verify base64 encoding in API request logs

### Images not caching locally
1. Check `${FileSystem.documentDirectory}livestock_image_cache/` exists
2. Check device has sufficient storage space
3. Check file permissions on device storage
4. View cache index: `~/.cache_index.json`

### Images showing 404 in offline mode
1. Verify cache index file exists
2. Verify cached file still exists on device
3. Check cache expiration date
4. Force cache refresh: `await imageCacheService.clearExpiredCache()`

### High cache memory usage
1. Clear old cache: `await imageCacheService.clearExpiredCache()`
2. Clear all cache: `await imageCacheService.clearAllCache()`
3. Check cache size: `const size = await imageCacheService.getCacheSize()`
4. Reduce cache duration in `image-cache-service.ts` if needed

## Performance Considerations

- **Base64 Encoding**: Large images increase network payload. Consider compressing images before upload.
- **Cache Storage**: Default 30-day expiration prevents excessive disk usage.
- **Concurrent Caching**: System handles parallel downloads efficiently.
- **Offline Sync**: Images are re-read from cache during sync, no additional network calls needed for image re-download.
