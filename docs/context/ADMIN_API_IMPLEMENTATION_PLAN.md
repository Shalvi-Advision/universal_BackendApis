# Admin API Implementation Plan - Store Code Based

## Overview
Implement admin GET APIs similar to customer-side pattern:
- POST endpoints that require `store_code` in request body
- Products filtered by `store_code` and search functionality
- Categories, Departments, Subcategories filtered by `store_code`
- GET endpoint to retrieve all store codes with store names

## Backend Implementation

### 1. Create GET Store Codes Endpoint
**File:** `routes/admin/stores.js` (new file) or add to existing admin routes

**Endpoint:** `GET /api/admin/stores/codes`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "store_code": "AME",
      "store_name": "Store Name Here"
    }
  ]
}
```

### 2. Update Products Admin Route
**File:** `routes/admin/products.js`

**Add POST endpoint:** `POST /api/admin/products/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "page": 1,
  "limit": 20,
  "category": "optional category filter",
  "subcategory": "optional subcategory filter",
  "status": "optional status filter",
  "stockStatus": "optional stock status filter"
}
```

**Response:** Same structure as current GET endpoint but filtered by store_code

### 3. Update Categories Admin Route
**File:** `routes/admin/categories.js`

**Add POST endpoint:** `POST /api/admin/categories/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "deptId": "optional department filter",
  "page": 1,
  "limit": 20
}
```

### 4. Update Departments Admin Route
**File:** `routes/admin/categories.js` (departments section)

**Add POST endpoint:** `POST /api/admin/categories/departments/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "deptTypeId": "optional department type filter",
  "page": 1,
  "limit": 20
}
```

### 5. Update Subcategories Admin Route
**File:** `routes/admin/categories.js` (subcategories section)

**Add POST endpoint:** `POST /api/admin/categories/subcategories/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "optional search term",
  "categoryId": "optional category filter",
  "page": 1,
  "limit": 20
}
```

## Frontend Implementation

### 1. Add Store Codes Service
**File:** `admin_panel/src/services/stores.ts` (update existing or create)

**Function:** `getAllStoreCodes()` - Get all store codes with names

### 2. Update Products Service
**File:** `admin_panel/src/services/products.ts`

**Function:** `getProductsByStore(params)` - Get products filtered by store_code

### 3. Update Categories Service
**File:** `admin_panel/src/services/categories.ts`

**Function:** `getCategoriesByStore(params)` - Get categories filtered by store_code

### 4. Update Departments Service
**File:** `admin_panel/src/services/departments.ts`

**Function:** `getDepartmentsByStore(params)` - Get departments filtered by store_code

### 5. Update Subcategories Service
**File:** `admin_panel/src/services/subcategories.ts`

**Function:** `getSubcategoriesByStore(params)` - Get subcategories filtered by store_code

### 6. Update Page Components
All pages need:
- Store code selector dropdown (populated from store codes API)
- Filter by selected store code
- Search functionality for products

## Implementation Order

1. **Backend:**
   - Create GET store codes endpoint
   - Add POST endpoints for products, categories, departments, subcategories with store_code filtering
   - Test all endpoints

2. **Frontend:**
   - Add store codes service and types
   - Update all services to support store_code filtering
   - Update page components with store selector and filtering
   - Add search functionality to products page

## Notes

- Store code is required in request body (like customer-side APIs)
- Search functionality should work with store_code filter
- All endpoints should maintain pagination
- Response structure should match existing admin API patterns

