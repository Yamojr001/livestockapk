#!/bin/bash

# Database Check Script for Farmer Images
# This script checks the current state of farmer_image data

echo "========================================="
echo "Farmer Image Database Check"
echo "========================================="
echo ""

cd /home/yamojr/Downloads/Livestock/livestock-api

echo "📊 Checking farmer_image data..."
echo ""

# Count total submissions
php artisan tinker --execute="
echo '✅ Total Submissions: ' . \App\Models\LivestockSubmission::count() . PHP_EOL;
echo '' . PHP_EOL;

echo '📈 Breakdown by image status:' . PHP_EOL;

\$withImages = \App\Models\LivestockSubmission::whereNotNull('farmer_image')
    ->where('farmer_image', '!=', '')
    ->count();
echo '  Images (has value): ' . \$withImages . PHP_EOL;

\$withNull = \App\Models\LivestockSubmission::whereNull('farmer_image')->count();
echo '  No Images (NULL): ' . \$withNull . PHP_EOL;

\$withEmpty = \App\Models\LivestockSubmission::where('farmer_image', '')->count();
echo '  ⚠️  Empty Strings: ' . \$withEmpty . PHP_EOL;

\$withInvalid = \App\Models\LivestockSubmission::where('farmer_image', 'like', '%[object Object]%')->count();
echo '  ⚠️  [object Object]: ' . \$withInvalid . PHP_EOL;

\$withBlob = \App\Models\LivestockSubmission::where('farmer_image', 'like', 'blob:%')->count();
echo '  ⚠️  Blob URLs: ' . \$withBlob . PHP_EOL;

echo '' . PHP_EOL;

echo '📋 Recent submissions (last 5):' . PHP_EOL;
\App\Models\LivestockSubmission::latest()->take(5)->get()->each(function(\$s) {
    \$imageStatus = 'NULL';
    if (\$s->farmer_image) {
        if (str_starts_with(\$s->farmer_image, 'storage/farmers/')) {
            \$imageStatus = '✅ ' . substr(\$s->farmer_image, 0, 30) . '...';
        } else if (str_contains(\$s->farmer_image, '[object Object]')) {
            \$imageStatus = '❌ [object Object]';
        } else if (str_starts_with(\$s->farmer_image, 'blob:')) {
            \$imageStatus = '❌ Blob URL';
        } else if (empty(\$s->farmer_image)) {
            \$imageStatus = '⚠️  Empty String';
        } else {
            \$imageStatus = '⚠️  Other: ' . substr(\$s->farmer_image, 0, 30);
        }
    } else {
        \$imageStatus = '✅ NULL';
    }
    
    echo '  ID ' . \$s->id . ': ' . str_pad(\$s->farmer_name, 20) . ' | ' . \$imageStatus . PHP_EOL;
});

echo '' . PHP_EOL;
echo '✅ Check complete!' . PHP_EOL;
"

echo ""
echo "========================================="
echo "🔍 To fix issues found above, run:"
echo "  mysql -u root -p livestock1 < fix_farmer_images.sql"
echo "========================================="
