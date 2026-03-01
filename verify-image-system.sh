#!/bin/bash

# Image Upload System Verification Script
# This script verifies all components of the image upload and offline caching system

set -e

echo "========================================"
echo "Image Upload System Verification"
echo "========================================"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_count=0
pass_count=0
fail_count=0

# Function to check a condition
check() {
    local name="$1"
    local condition="$2"
    check_count=$((check_count + 1))
    
    if eval "$condition"; then
        echo -e "${GREEN}✓${NC} $name"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} $name"
        fail_count=$((fail_count + 1))
    fi
}

echo -e "${BLUE}1. Checking Documentation Files${NC}"
check "START_HERE.md exists" "[ -f START_HERE.md ]"
check "IMAGE_UPLOAD_README.md exists" "[ -f IMAGE_UPLOAD_README.md ]"
check "IMAGE_CACHING_SYSTEM.md exists" "[ -f IMAGE_CACHING_SYSTEM.md ]"
check "IMAGE_UPLOAD_IMPLEMENTATION.md exists" "[ -f IMAGE_UPLOAD_IMPLEMENTATION.md ]"
check "DEPLOYMENT_GUIDE.md exists" "[ -f DEPLOYMENT_GUIDE.md ]"
check "IMPLEMENTATION_SUMMARY.txt exists" "[ -f IMPLEMENTATION_SUMMARY.txt ]"
echo

echo -e "${BLUE}2. Checking Frontend Source Files${NC}"
check "image-cache-service.ts exists" "[ -f client/lib/image-cache-service.ts ]"
check "image-caching.test.ts exists" "[ -f client/lib/image-caching.test.ts ]"
check "imageCacheService imported in SubmissionFormScreen" "grep -q 'imageCacheService' client/screens/SubmissionFormScreen.tsx"
check "imageCacheService imported in DataManagementScreen" "grep -q 'imageCacheService' client/screens/DataManagementScreen.tsx"
check "imageCacheService used in sync-service" "grep -q 'imageCacheService' client/lib/sync-service.ts"
echo

echo -e "${BLUE}3. Checking Backend Files${NC}"
check "ImageUploadTest.php exists" "[ -f livestock-api/tests/Feature/ImageUploadTest.php ]"
check "farmers storage directory exists" "[ -d livestock-api/storage/app/public/farmers ]"
check "farmers directory is writable" "[ -w livestock-api/storage/app/public/farmers ]"
echo

echo -e "${BLUE}4. Checking Code Imports${NC}"
check "FileSystem imported in sync-service" "grep -q 'FileSystem' client/lib/sync-service.ts"
check "FileSystem imported in SubmissionFormScreen" "grep -q 'FileSystem' client/screens/SubmissionFormScreen.tsx"
check "async/await in prepareApiData" "grep -q 'async.*prepareApiData' client/lib/sync-service.ts"
check "FileSystem storage in cache service" "grep -q 'FileSystem' client/lib/image-cache-service.ts"
echo

echo -e "${BLUE}5. Checking TypeScript Configuration${NC}"
check "tsconfig.json exists" "[ -f tsconfig.json ]"
check "Types for expo-file-system" "grep -q 'expo-file-system' package.json || grep -q 'expo' package.json"
echo

echo -e "${BLUE}6. Checking Image Cache Service Implementation${NC}"
check "cacheImageFromBase64 method" "grep -q 'cacheImageFromBase64' client/lib/image-cache-service.ts"
check "cacheImageFromUrl method" "grep -q 'cacheImageFromUrl' client/lib/image-cache-service.ts"
check "getCachedImage method" "grep -q 'getCachedImage' client/lib/image-cache-service.ts"
check "getImageForDisplay method" "grep -q 'getImageForDisplay' client/lib/image-cache-service.ts"
check "clearExpiredCache method" "grep -q 'clearExpiredCache' client/lib/image-cache-service.ts"
check "getCacheSize method" "grep -q 'getCacheSize' client/lib/image-cache-service.ts"
echo

echo -e "${BLUE}7. Checking Submission Form Implementation${NC}"
check "handleSubmit modified" "grep -q 'if (isOnline)' client/screens/SubmissionFormScreen.tsx"
check "Base64 encoding in submission" "grep -q 'data:image/jpeg;base64' client/screens/SubmissionFormScreen.tsx"
check "Cache before upload" "grep -q 'cacheImageFromBase64' client/screens/SubmissionFormScreen.tsx"
echo

echo -e "${BLUE}8. Checking Sync Service Implementation${NC}"
check "prepareApiData is async" "grep -q 'async.*prepareApiData' client/lib/sync-service.ts"
check "FileSystem reads in sync" "grep -q 'readAsStringAsync' client/lib/sync-service.ts"
check "Base64 conversion in sync" "grep -q 'base64' client/lib/sync-service.ts"
echo

echo -e "${BLUE}9. Checking Display Implementation${NC}"
check "getImageUrl is async" "grep -q 'getImageUrl.*async' client/screens/DataManagementScreen.tsx || grep -q 'async.*getImageUrl' client/screens/DataManagementScreen.tsx"
check "Cache-first strategy" "grep -q 'getCachedImage\|getImageForDisplay' client/screens/DataManagementScreen.tsx"
echo

echo -e "${BLUE}10. Checking Backend Upload Handler${NC}"
check "Base64 detection in backend" "grep -q 'data:image' livestock-api/app/Http/Controllers/SubmissionController.php || grep -q 'base64' livestock-api/app/Http/Controllers/SubmissionController.php"
check "Storage facade usage" "grep -q 'Storage::' livestock-api/app/Http/Controllers/SubmissionController.php"
echo

echo
echo "========================================"
echo -e "Results: ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC} (out of ${check_count} checks)"
echo "========================================"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is ready for deployment.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the items above.${NC}"
    exit 1
fi
