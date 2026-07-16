# Pincode API Documentation

## Overview
The Pincode API provides endpoints to manage and check pincode serviceability for the e-commerce platform. The data is stored in the `pincodemasters` collection in MongoDB.

## Base URL
```
http://localhost:5001/api/pincodes
```

---

## Endpoints

### 1. Get All Pincodes
Get a list of all pincodes with pagination and filtering options.

**Endpoint:** `GET /api/pincodes`

**Query Parameters:**
- `enabled` (optional): Filter by enabled status (`true` or `false`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 50)
- `search` (optional): Search pincodes by partial match

**Example Request:**
```bash
GET /api/pincodes?enabled=true&page=1&limit=20&search=421
```

**Example Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 22,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "67fb89db48accb6c5d800a0c",
      "idpincode_master": 1,
      "pincode": "421002",
      "is_enabled": "Enabled",
      "createdAt": "2025-01-13T10:00:00.000Z",
      "updatedAt": "2025-01-13T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Pincode by ID
Get a specific pincode by its MongoDB ObjectId.

**Endpoint:** `GET /api/pincodes/:id`

**Example Request:**
```bash
GET /api/pincodes/67fb89db48accb6c5d800a0c
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67fb89db48accb6c5d800a0c",
    "idpincode_master": 1,
    "pincode": "421002",
    "is_enabled": "Enabled",
    "createdAt": "2025-01-13T10:00:00.000Z",
    "updatedAt": "2025-01-13T10:00:00.000Z"
  }
}
```

---

### 3. Check Pincode (GET Method)
Check if a pincode is serviceable using URL parameter.

**Endpoint:** `GET /api/pincodes/check/:pincode`

**Example Request:**
```bash
GET /api/pincodes/check/421002
```

**Example Response (Available):**
```json
{
  "success": true,
  "serviceable": true,
  "message": "Great! We deliver to this pincode",
  "data": {
    "_id": "67fb89db48accb6c5d800a0c",
    "idpincode_master": 1,
    "pincode": "421002",
    "is_enabled": "Enabled"
  }
}
```

**Example Response (Not Available):**
```json
{
  "success": true,
  "serviceable": false,
  "message": "Sorry, we do not deliver to this pincode yet"
}
```

---

### 4. Check Pincode Availability (POST Method) ⭐ NEW
Check if a pincode is available/serviceable by sending pincode in request body.

**Endpoint:** `POST /api/pincodes/check-availability`

**Request Body:**
```json
{
  "pincode": "421002"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5001/api/pincodes/check-availability \
  -H "Content-Type: application/json" \
  -d '{"pincode": "421002"}'
```

**Example Response (Available):**
```json
{
  "success": true,
  "available": true,
  "serviceable": true,
  "message": "Great! We deliver to this pincode",
  "pincode": "421002",
  "data": {
    "id": "67fb89db48accb6c5d800a0c",
    "pincode": "421002",
    "idpincode_master": 1,
    "is_enabled": "Enabled"
  }
}
```

**Example Response (Not Available):**
```json
{
  "success": true,
  "available": false,
  "serviceable": false,
  "message": "Sorry, we do not deliver to this pincode yet",
  "pincode": "123456"
}
```

**Error Response (Invalid Format):**
```json
{
  "success": false,
  "error": "Please provide a valid 6-digit pincode"
}
```

**Error Response (Missing Pincode):**
```json
{
  "success": false,
  "error": "Please provide a pincode"
}
```

---

### 5. Get Enabled Pincodes List
Get a simplified list of enabled pincodes (optimized for dropdowns/autocomplete).

**Endpoint:** `GET /api/pincodes/enabled/list`

**Example Request:**
```bash
GET /api/pincodes/enabled/list
```

**Example Response:**
```json
{
  "success": true,
  "count": 22,
  "data": [
    {
      "id": "67fb89db48accb6c5d800a0c",
      "pincode": "421002",
      "idpincode_master": 1
    },
    {
      "id": "67fb89db48accb6c5d800a0d",
      "pincode": "421004",
      "idpincode_master": 2
    }
  ]
}
```

---

## Data Model

### Pincode Schema
```javascript
{
  idpincode_master: Number (unique),
  pincode: String (6 digits, required),
  is_enabled: String (enum: ['Enabled', 'Disabled']),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

---

## Testing

### Run Test Suite
To test all pincode API endpoints:

```bash
node test_pincode_api.js
```

This will test:
1. ✅ Get all pincodes
2. ✅ Get enabled pincodes only
3. ✅ Search pincodes
4. ✅ Get enabled list for dropdown
5. ✅ Check available pincode (GET)
6. ✅ Check unavailable pincode (GET)
7. ✅ Check available pincode (POST) - NEW
8. ✅ Check unavailable pincode (POST) - NEW
9. ✅ Check invalid pincode (POST) - NEW
10. ✅ POST without pincode - NEW

---

## Use Cases

### Frontend Integration Examples

#### 1. Check Pincode on Checkout Page
```javascript
// Using POST method
const checkPincode = async (pincode) => {
  try {
    const response = await fetch('http://localhost:5001/api/pincodes/check-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pincode })
    });
    
    const data = await response.json();
    
    if (data.available) {
      console.log('✅ Delivery available!');
      // Show delivery options
    } else {
      console.log('❌ Not serviceable');
      // Show message to user
    }
  } catch (error) {
    console.error('Error checking pincode:', error);
  }
};
```

#### 2. Pincode Dropdown/Autocomplete
```javascript
// Get all enabled pincodes for dropdown
const loadPincodes = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/pincodes/enabled/list');
    const data = await response.json();
    
    // Populate dropdown
    const dropdown = document.getElementById('pincode-select');
    data.data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.pincode;
      option.text = item.pincode;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading pincodes:', error);
  }
};
```

#### 3. Real-time Pincode Search
```javascript
// Search as user types
const searchPincodes = async (searchTerm) => {
  try {
    const response = await fetch(
      `http://localhost:5001/api/pincodes?enabled=true&search=${searchTerm}&limit=10`
    );
    const data = await response.json();
    
    // Show search results
    console.log('Found:', data.count, 'pincodes');
    return data.data;
  } catch (error) {
    console.error('Error searching pincodes:', error);
  }
};
```

---

## Notes

- All pincodes are validated to be exactly 6 digits
- The `is_enabled` field determines if a pincode is serviceable
- Both GET and POST methods are available for checking pincode availability
- POST method is recommended for frontend forms as it keeps the pincode in the request body
- GET method is useful for direct URL access and quick checks
- Pagination is available for all listing endpoints
- All responses follow a consistent JSON format with `success` field

---

## Available Pincodes (from Database)

Current database contains 22 serviceable pincodes:
- 421002, 421004, 421103, 421202, 421401, 421506, 421605, 421501
- 421203, 421005, 421502, 421301, 421201, 410203, 421601, 421503
- 421204, 400612, 421101, 410101, 421306, 421302

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Server Error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

