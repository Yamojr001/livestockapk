# Postman Testing Guide for Farmer Image Upload

## Server Details
- **Base URL**: `http://localhost:8000/api/v1`
- **Server is already running on port 8000**

## Test 1: Register/Login to Get Auth Token

### POST Login
```
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "a@gmail.com",
  "password": "your_password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "access_token": "TOKEN_HERE",
  "user": {...}
}
```

**Copy the access_token for next requests!**

---

## Test 2: Create Submission WITH Image (Using File Upload)

### POST Create Submission with File
```
POST http://localhost:8000/api/v1/submissions
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Form Data:**
- `farmer_name`: John Doe
- `contact_number`: 09012345678
- `lga`: Auyo
- `ward`: Auyo
- `association`: Cattle Breeders Association of Nigeria (CBAN)
- `number_of_animals`: 10
- `gender`: Male
- `age`: 35
- `nin`: 12345678901
- `literacy_status`: Literate
- `farmer_image`: [Select File - Any JPEG/PNG image]

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "id": 12,
    "registration_id": "JG-XXXXX",
    "farmer_name": "John Doe",
    "farmer_image": "storage/farmers/abc123.jpg",
    "farmer_image_url": "http://localhost:8000/storage/farmers/abc123.jpg",
    ...
  }
}
```

**✅ Check:**
- `farmer_image` should be: `storage/farmers/filename.jpg`
- `farmer_image_url` should be: `http://localhost:8000/storage/farmers/filename.jpg`
- NOT NULL!

---

## Test 3: Create Submission WITHOUT Image

### POST Create Submission without Image
```
POST http://localhost:8000/api/v1/submissions
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "farmer_name": "Jane Doe",
  "contact_number": "09087654321",
  "lga": "Auyo",
  "ward": "Auyo",
  "association": "Cattle Breeders Association of Nigeria (CBAN)",
  "number_of_animals": 5,
  "gender": "Female",
  "age": 28
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "id": 13,
    "registration_id": "JG-YYYYY",
    "farmer_name": "Jane Doe",
    "farmer_image": null,
    "farmer_image_url": null,
    ...
  }
}
```

**✅ Check:**
- `farmer_image` should be: `null`
- `farmer_image_url` should be: `null`
- Database should show `NULL` not empty string or "[object Object]"

---

## Test 4: Get All Submissions (Check Response)

### GET All Submissions
```
GET http://localhost:8000/api/v1/submissions
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 12,
        "farmer_name": "John Doe",
        "farmer_image": "storage/farmers/abc123.jpg",
        "farmer_image_url": "http://localhost:8000/storage/farmers/abc123.jpg",
        ...
      },
      {
        "id": 13,
        "farmer_name": "Jane Doe",
        "farmer_image": null,
        "farmer_image_url": null,
        ...
      }
    ]
  }
}
```

**✅ Check:**
- Images with files show proper storage path
- Images without files show `null`
- NO "NULL" strings, NO empty strings, NO "[object Object]"

---

## Test 5: Batch Sync with Images

### POST Batch Sync
```
POST http://localhost:8000/api/v1/submissions/sync
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "submissions": [
    {
      "farmer_name": "Batch Test 1",
      "contact_number": "09011111111",
      "lga": "Auyo",
      "ward": "Auyo",
      "association": "Cattle Breeders Association of Nigeria (CBAN)",
      "number_of_animals": 3,
      "farmer_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    },
    {
      "farmer_name": "Batch Test 2",
      "contact_number": "09022222222",
      "lga": "Auyo",
      "ward": "Auyo",
      "association": "Cattle Breeders Association of Nigeria (CBAN)",
      "number_of_animals": 7
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "synced_count": 2,
  "failed_count": 0,
  "data": [
    {
      "farmer_image": "storage/farmers/xyz789.jpg",
      "farmer_image_url": "http://localhost:8000/storage/farmers/xyz789.jpg"
    },
    {
      "farmer_image": null,
      "farmer_image_url": null
    }
  ]
}
```

---

## Database Verification

After testing, check your database:

```sql
SELECT id, farmer_name, farmer_image FROM livestock_submissions ORDER BY id DESC LIMIT 10;
```

**Expected Results:**
- Submissions with images: `storage/farmers/filename.jpg`
- Submissions without images: `NULL` (not "NULL" string)
- NO empty strings
- NO "[object Object]"
- NO blob:http URLs

---

## Image Access Test

If a submission has `farmer_image`: `storage/farmers/abc123.jpg`

**Test URL in Browser:**
```
http://localhost:8000/storage/farmers/abc123.jpg
```

**✅ Should display the image!**

---

## Common Issues & Solutions

### Issue: Getting "NULL" string instead of actual NULL
**Solution:** Already fixed! Controller now sets `null` properly.

### Issue: Getting "[object Object]" in database
**Solution:** Already fixed! Controller filters these out.

### Issue: Image URL not working
**Solution:** Make sure `php artisan storage:link` was run (we did this!)

### Issue: farmer_image_url not appearing in response
**Solution:** Model has `$appends = ['farmer_image_url']` added.

---

## Next Steps

1. ✅ Test all endpoints above in Postman
2. ✅ Verify database shows proper values
3. ✅ Test image URLs work in browser
4. ✅ Test from mobile app frontend
