# Department API Documentation

## Overview

The Department API provides endpoints to fetch departments based on store code, department type, or retrieve all departments. This API is designed to support the Patel E-commerce application's department browsing functionality.

## Base URL

```
http://localhost:5001/api/departments
```

## Model Schema

### Department Model

```javascript
{
  department_id: String (required),
  department_name: String (required),
  dept_type_id: String (required),
  dept_no_of_col: Number (default: 0),
  store_code: String (default: 'null'),
  image_link: String,
  sequence_id: Number (required)
}
```

### Collection Name
- MongoDB Collection: `departmentmasters`

### Indexes
- `store_code` - for efficient store-based queries
- `department_id` - for unique department lookups
- `dept_type_id` - for type-based filtering
- `sequence_id` - for ordered retrieval
- Compound index: `store_code` + `sequence_id`

---

## API Endpoints

### 1. Get Departments by Store Code

Retrieve all departments for a specific store code.

**Endpoint:** `POST /api/departments/by-store`

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "store_code": "STORE001"
}
```

**Note:** 
- If `store_code` is empty, null, or "null", it will default to "null"
- Departments are returned sorted by `sequence_id` in ascending order

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 9,
  "message": "Found 9 department(s) for store code: null",
  "store_code": "null",
  "data": [
    {
      "id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": "null",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1
    },
    {
      "id": "68a8a27d4169ced4c49f94cf",
      "department_id": "2",
      "department_name": "GROCERY & STAPLES",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": "null",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/GROCERY&STAPLES.webp",
      "sequence_id": 2
    }
  ]
}
```

**No Departments Found (200 OK):**
```json
{
  "success": true,
  "count": 0,
  "message": "No departments found for store code: STORE999",
  "store_code": "STORE999",
  "data": []
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error message"
}
```

---

### 2. Get Departments by Type

Retrieve all departments filtered by department type, optionally filtered by store code.

**Endpoint:** `POST /api/departments/by-type`

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "dept_type_id": "1",
  "store_code": "null"
}
```

**Note:** 
- `dept_type_id` is **required**
- `store_code` is **optional** - if not provided, returns departments from all stores
- Departments are returned sorted by `sequence_id` in ascending order

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "message": "Found 8 department(s) for type 1 and store code: null",
  "dept_type_id": "1",
  "store_code": "null",
  "data": [
    {
      "id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": "null",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1
    }
  ]
}
```

**Missing dept_type_id (400 Bad Request):**
```json
{
  "success": false,
  "error": "Please provide a dept_type_id"
}
```

**No Departments Found (200 OK):**
```json
{
  "success": true,
  "count": 0,
  "message": "No departments found for type 99",
  "dept_type_id": "99",
  "store_code": null,
  "data": []
}
```

---

### 3. Get All Departments

Retrieve all departments from the database.

**Endpoint:** `GET /api/departments`

**Method:** GET

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:** None

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 9,
  "message": "Found 9 department(s)",
  "data": [
    {
      "id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": "null",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1
    }
  ]
}
```

---

## Department Types

Based on the sample data, here are the known department types:

- **Type 1**: Regular departments (e.g., HOUSEHOLD ITEMS, GROCERY & STAPLES, PERSONAL CARE, BABY CARE, BEVERAGES, etc.)
- **Type 2**: Special categories (e.g., SEASONAL PICKS)

---

## Example Use Cases

### Use Case 1: Display Store-Specific Departments
When a user selects a store, fetch and display departments available at that store:

```javascript
const response = await fetch('http://localhost:5001/api/departments/by-store', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    store_code: 'STORE001'
  })
});

const data = await response.json();
console.log(`Found ${data.count} departments`);
data.data.forEach(dept => {
  console.log(`- ${dept.department_name}`);
});
```

### Use Case 2: Display Regular Departments Only
Filter departments by type to show only regular departments (type 1):

```javascript
const response = await fetch('http://localhost:5001/api/departments/by-type', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dept_type_id: '1'
  })
});

const data = await response.json();
// Display regular departments only
```

### Use Case 3: Display All Available Departments
Fetch and display all departments in the system:

```javascript
const response = await fetch('http://localhost:5001/api/departments', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
// Display all departments
```

---

## Data Upload

Department data is automatically uploaded from `Database/PatelDB.departmentmasters.json` when running the upload script:

```bash
node upload_patel_data.js
```

The upload script processes all JSON files in the Database directory, including the departmentmasters collection.

---

## Testing

### Test with cURL

**Get departments by store code:**
```bash
curl -X POST http://localhost:5001/api/departments/by-store \
  -H "Content-Type: application/json" \
  -d '{"store_code": "null"}'
```

**Get departments by type:**
```bash
curl -X POST http://localhost:5001/api/departments/by-type \
  -H "Content-Type: application/json" \
  -d '{"dept_type_id": "1"}'
```

**Get all departments:**
```bash
curl -X GET http://localhost:5001/api/departments \
  -H "Content-Type: application/json"
```

### Test with Postman

Import the collection from `postman/Patel_Ecommerce_API.postman_collection.json` and use the Department endpoints.

---

## Error Handling

All endpoints use the centralized error handling middleware. Common error scenarios:

1. **Missing Required Fields (400 Bad Request)**
   - Missing `dept_type_id` in `/by-type` endpoint

2. **No Results Found (200 OK)**
   - Returns empty array with success: true
   - Includes descriptive message

3. **Server Errors (500 Internal Server Error)**
   - Database connection issues
   - Unexpected errors during processing

---

## Performance Considerations

1. **Indexing**: All frequently queried fields are indexed for optimal performance
2. **Sorting**: Results are pre-sorted by `sequence_id` at the database level
3. **Pagination**: Currently not implemented - all matching departments are returned
4. **Caching**: Consider implementing client-side caching as department data changes infrequently

---

## Future Enhancements

Potential improvements for the Department API:

1. **Pagination**: Add pagination support for large department lists
2. **Search**: Add text search functionality for department names
3. **Filtering**: Add more filtering options (active/inactive, custom attributes)
4. **Admin Endpoints**: Add endpoints for department CRUD operations
5. **Image Optimization**: Add image URL transformation/optimization support
6. **Caching**: Implement Redis caching for frequently accessed department data

---

## Related Documentation

- [Store API Documentation](./README_STORE_API.md)
- [Pincode API Documentation](./README_PINCODE_API.md)
- [Main README](../README.md)

