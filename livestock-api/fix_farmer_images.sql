-- Clean up bad farmer_image data in database
-- Run this to fix existing records with invalid values

-- Show current state
SELECT 
    id, 
    farmer_name, 
    CASE 
        WHEN farmer_image IS NULL THEN 'NULL'
        WHEN farmer_image = '' THEN 'EMPTY STRING'
        WHEN farmer_image LIKE '%[object Object]%' THEN 'INVALID OBJECT'
        WHEN farmer_image LIKE 'blob:%' THEN 'BLOB URL'
        WHEN farmer_image LIKE 'http%' THEN 'FULL URL'
        WHEN farmer_image LIKE 'storage/%' THEN 'STORAGE PATH (CORRECT)'
        ELSE 'OTHER'
    END as image_type,
    LENGTH(farmer_image) as image_length,
    LEFT(farmer_image, 50) as image_preview
FROM livestock_submissions 
ORDER BY id DESC 
LIMIT 20;

-- Fix: Set NULL for empty strings
UPDATE livestock_submissions 
SET farmer_image = NULL 
WHERE farmer_image = '';

-- Fix: Set NULL for [object Object] values
UPDATE livestock_submissions 
SET farmer_image = NULL 
WHERE farmer_image LIKE '%[object Object]%';

-- Fix: Set NULL for blob URLs (these won't work on backend)
UPDATE livestock_submissions 
SET farmer_image = NULL 
WHERE farmer_image LIKE 'blob:%';

-- Fix: Convert full URLs to storage paths if they're our own URLs
-- Example: http://localhost:8000/storage/farmers/abc.jpg -> storage/farmers/abc.jpg
UPDATE livestock_submissions 
SET farmer_image = SUBSTRING(farmer_image, LOCATE('storage/', farmer_image))
WHERE farmer_image LIKE 'http://localhost%storage/farmers/%'
   OR farmer_image LIKE 'https://localhost%storage/farmers/%';

-- Show updated state
SELECT 
    id, 
    farmer_name, 
    CASE 
        WHEN farmer_image IS NULL THEN 'NULL'
        WHEN farmer_image = '' THEN 'EMPTY STRING'
        WHEN farmer_image LIKE 'storage/farmers/%' THEN 'STORAGE PATH (CORRECT)'
        ELSE 'OTHER: ' || LEFT(farmer_image, 30)
    END as image_status
FROM livestock_submissions 
ORDER BY id DESC 
LIMIT 20;

-- Count by status
SELECT 
    CASE 
        WHEN farmer_image IS NULL THEN 'NULL (No Image)'
        WHEN farmer_image LIKE 'storage/farmers/%' THEN 'Valid Storage Path'
        ELSE 'Other/Invalid'
    END as status,
    COUNT(*) as count
FROM livestock_submissions 
GROUP BY status;
