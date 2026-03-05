#!/bin/bash

echo "========================================="
echo "Testing Image Upload Fix"
echo "========================================="
echo ""

# Get auth token
echo "1. Getting auth token..."
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@gmail.com","password":"admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token. Check credentials."
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."
echo ""

# Test 1: Create submission WITHOUT image
echo "2. Testing submission WITHOUT image..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/v1/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_name": "Test No Image",
    "contact_number": "09012345678",
    "lga": "Auyo",
    "ward": "Auyo",
    "association": "Cattle Breeders Association of Nigeria (CBAN)",
    "number_of_animals": 10
  }')

echo "$RESPONSE" | grep -q '"success":true'
if [ $? -eq 0 ]; then
  echo "✅ Submission created successfully"
  FARMER_IMAGE=$(echo "$RESPONSE" | grep -o '"farmer_image":[^,}]*' | head -1)
  FARMER_IMAGE_URL=$(echo "$RESPONSE" | grep -o '"farmer_image_url":[^,}]*' | head -1)
  echo "   $FARMER_IMAGE"
  echo "   $FARMER_IMAGE_URL"
  
  if echo "$FARMER_IMAGE" | grep -q 'null'; then
    echo "   ✅ farmer_image is NULL (correct!)"
  else
    echo "   ❌ farmer_image is not NULL"
  fi
else
  echo "❌ Failed to create submission"
  echo "$RESPONSE"
fi

echo ""
echo "3. Checking recent submissions in database..."
cd /home/yamojr/Downloads/Livestock/livestock-api
php artisan tinker --execute="
\$last = \App\Models\LivestockSubmission::latest()->first();
if (\$last) {
    echo 'Latest: ID ' . \$last->id . ' | ' . \$last->farmer_name . PHP_EOL;
    echo '  farmer_image: ' . (\$last->farmer_image ?? 'NULL') . PHP_EOL;
    echo '  farmer_image_url: ' . (\$last->farmer_image_url ?? 'NULL') . PHP_EOL;
    
    if (\$last->farmer_image === null) {
        echo '  ✅ Database has proper NULL value' . PHP_EOL;
    } else {
        echo '  ⚠️  Database value: ' . \$last->farmer_image . PHP_EOL;
    }
}
"

echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="
