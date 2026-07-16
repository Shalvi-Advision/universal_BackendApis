# Admin Store Code Based APIs

## Overview
These APIs follow the customer-side pattern where `store_code` is required in the request body (POST endpoints). All endpoints require admin authentication.

**Base URL:** `/api/admin`  
**Authentication:** Bearer Token required

---

## 1. Get Store Codes

**Endpoint:** `GET /api/admin/content/stores/codes`

**Description:** Get all unique store codes with store names (for dropdown/selection)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "store_code": "AME",
      "store_name": "Shivaji Chowk, Ambernath (E)"
    }
  ]
}
```

---

## 2. Get Products by Store Code

**Endpoint:** `POST /api/admin/products/by-store`

**Description:** Get products filtered by store_code with search and filters

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "page": 1,
  "limit": 20,
  "dept_id": "optional department filter",
  "category_id": "optional category filter",
  "sub_category_id": "optional subcategory filter",
  "sortBy": "product_name",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "68c236c4bf96087eee211e41",
      "p_code": "20620",
      "barcode": "20620",
      "product_name": "13x19 MIX MAT",
      "product_description": "UN BRAND DOOR MAT (PLASTIC)  1 NO PLS",
      "package_size": 1,
      "package_unit": "NO",
      "product_mrp": 55,
      "our_price": 39,
      "brand_name": "UN BRAND",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "1",
      "category_id": "91",
      "sub_category_id": "359",
      "store_quantity": 11,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/20620_1.webp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5706,
    "pages": 1142
  }
}
```

**Notes:**
- Uses `ProductMaster` model (same as customer-side)
- `store_code` is required
- Search filters by `product_name` (case-insensitive)
- Returns only active products (`pcode_status: 'Y'`)

---

## 3. Get Categories by Store Code

**Endpoint:** `POST /api/admin/categories/by-store`

**Description:** Get categories filtered by store_code

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "deptId": "optional department filter",
  "page": 1,
  "limit": 20,
  "sortBy": "sequence_id",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68a8a2804169ced4c49f968b",
      "idcategory_master": "104",
      "category_name": "COLDDRINK / FRUITDRINK",
      "dept_id": "11",
      "sequence_id": 0,
      "store_code": "AME",
      "no_of_col": "6",
      "image_link": "https://patelrmart.com/...",
      "category_bg_color": "#FFFF00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 4. Get Departments by Store Code

**Endpoint:** `POST /api/admin/categories/departments/by-store`

**Description:** Get departments filtered by store_code

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "deptTypeId": "optional department type filter",
  "page": 1,
  "limit": 20,
  "sortBy": "sequence_id",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/...",
      "sequence_id": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 9,
    "pages": 1
  }
}
```

**Notes:**
- `store_code` can be `"null"` (string) to get departments with null store_code
- Some departments have `store_code: null` (global departments)

---

## 5. Get Subcategories by Store Code

**Endpoint:** `POST /api/admin/categories/subcategories/by-store`

**Description:** Get subcategories filtered by store_code (via categories)

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "categoryId": "optional category filter",
  "page": 1,
  "limit": 20,
  "sortBy": "idsub_category_master",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6891b9aa9cdf8ee98b590865",
      "idsub_category_master": "4",
      "sub_category_name": "SOYABEAN OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 388,
    "pages": 20
  }
}
```

**Notes:**
- Subcategories don't have `store_code` directly
- Endpoint finds categories for the store_code, then returns subcategories for those categories
- If no categories found for store_code, returns empty array

---

## Common Features

1. **Authentication:** All endpoints require admin JWT token
2. **Pagination:** All endpoints support pagination with `page` and `limit`
3. **Search:** Products and categories support search functionality
4. **Filtering:** All endpoints support additional filters
5. **Sorting:** All endpoints support custom sorting

## Error Responses

**Missing store_code:**
```json
{
  "success": false,
  "message": "store_code is required"
}
```

**Server Error:**
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error message"
}
```

---

## Testing Examples

### Get Store Codes
```bash
curl -X GET "http://localhost:5001/api/admin/content/stores/codes" \
  -H "Authorization: Bearer <token>"
```

### Get Products by Store
```bash
curl -X POST "http://localhost:5001/api/admin/products/by-store" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"store_code":"AME","search":"","page":1,"limit":20}'
```

### Get Categories by Store
```bash
curl -X POST "http://localhost:5001/api/admin/categories/by-store" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"store_code":"AME","page":1,"limit":20}'
```

### Get Departments by Store
```bash
curl -X POST "http://localhost:5001/api/admin/categories/departments/by-store" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"store_code":"AME","page":1,"limit":20}'
```

### Get Subcategories by Store
```bash
curl -X POST "http://localhost:5001/api/admin/categories/subcategories/by-store" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"store_code":"AME","page":1,"limit":20}'
```

