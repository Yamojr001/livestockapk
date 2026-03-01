#!/bin/bash

# Image Upload Fix Verification Script
# This script verifies all image upload and display fixes

set -e

echo "================================"
echo "Image Upload Fix Verification"
echo "================================"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo -e "${YELLOW}1. Backend Image Handling${NC}"
check "Laravel SubmissionController stores full URLs" \
    "grep -q \"url('storage/'\" livestock-api/app/Http/Controllers/SubmissionController.php"
check "Backend saves to storage/app/public/farmers/" \
    "grep -q \"farmers/\" livestock-api/app/Http/Controllers/SubmissionController.php"
check "Base64 image handling present" \
    "grep -q \"base64_decode\" livestock-api/app/Http/Controllers/SubmissionController.php"
echo

echo -e "${YELLOW}2. Frontend Image Display${NC}"
check "DataManagementScreen handles HTTP URLs" \
    "grep -q \"startsWith.*http\" client/screens/DataManagementScreen.tsx"
check "DataManagementScreen returns direct URLs" \
    "grep -q \"return imagePath\" client/screens/DataManagementScreen.tsx"
check "Image cache service imported in DataManagement" \
    "grep -q \"imageCacheService\" client/screens/DataManagementScreen.tsx"
echo

echo -e "${YELLOW}3. ID Card Screen Fixes${NC}"
check "AgentIDCardScreen shows registration ID in QR" \
    "grep -q \"const regId = selectedSubmission?.registration_id\" client/screens/AgentIDCardScreen.tsx && grep -q \"return regId\" client/screens/AgentIDCardScreen.tsx"
check "AgentIDCardScreen has imageUri state" \
    "grep -q \"const \[imageUri, setImageUri\]\" client/screens/AgentIDCardScreen.tsx"
check "AgentIDCardScreen renders image with error handling" \
    "grep -q \"onError=\" client/screens/AgentIDCardScreen.tsx"
check "Card uses green color scheme" \
    "grep -q '#057856' client/screens/AgentIDCardScreen.tsx"
echo

echo -e "${YELLOW}4. File System Checks${NC}"
check "farmers storage directory exists" "[ -d livestock-api/storage/app/public/farmers ]"
check "farmers directory is readable" "[ -r livestock-api/storage/app/public/farmers ]"
check "farmers directory is writable" "[ -w livestock-api/storage/app/public/farmers ]"
echo

echo -e "${YELLOW}5. Documentation Updates${NC}"
check "IMAGE_UPLOAD_FIX_GUIDE.md created" "[ -f IMAGE_UPLOAD_FIX_GUIDE.md ]"
check "Fix guide contains backend instructions" "grep -q \"SubmissionController\" IMAGE_UPLOAD_FIX_GUIDE.md"
check "Fix guide contains frontend instructions" "grep -q \"DataManagementScreen\" IMAGE_UPLOAD_FIX_GUIDE.md"
check "Fix guide contains troubleshooting" "grep -q \"Troubleshooting\" IMAGE_UPLOAD_FIX_GUIDE.md"
echo

echo "================================"
echo -e "Results: ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC} (out of ${check_count} checks)"
echo "================================"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ All fixes verified successfully!${NC}"
    echo
    echo "Next steps:"
    echo "1. Run: cd livestock-api && php artisan storage:link"
    echo "2. Run: npm run check:types"
    echo "3. Test image upload in app"
    echo "4. Verify images appear in farmer details"
    echo "5. Check ID cards show correctly"
    exit 0
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the items above.${NC}"
    exit 1
fi
