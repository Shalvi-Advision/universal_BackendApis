# Admin GET API Response Documentation

**Base URL:** `http://localhost:5001`  
**Authentication:** Bearer Token required in Authorization header

---

## 1. GET Products

**Endpoint:** `GET /api/admin/products`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by name, productCode, or brand
- `category` - Filter by category ID
- `subcategory` - Filter by subcategory ID
- `status` - Filter by status (active, inactive, out_of_stock, discontinued)
- `stockStatus` - Filter by stock status (in_stock, out_of_stock, low_stock)
- `sortBy` (default: createdAt) - Field to sort by
- `sortOrder` (default: desc) - Sort order (asc, desc)

**Response Structure:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "pages": 0
  }
}
```

**Example Response (Empty):**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "pages": 0
  }
}
```

**Product Object Structure (when data exists):**
```typescript
{
  _id: string;
  productCode: string;
  name: string;
  description?: string;
  shortDescription?: string;
  category: {
    _id: string;
    name: string;
  };
  subcategory?: {
    _id: string;
    name: string;
  };
  department?: {
    _id: string;
    name: string;
  };
  brand?: string;
  sku?: string;
  barcode?: string;
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  price: {
    mrp: number;
    sellingPrice: number;
    discount: number;
  };
  stock: {
    quantity: number;
    minStockLevel: number;
    maxStockLevel?: number;
  };
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. GET Categories

**Endpoint:** `GET /api/admin/categories`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by category_name
- `storeCode` - Filter by store code
- `deptId` - Filter by department ID
- `sortBy` (default: sequence_id) - Field to sort by
- `sortOrder` (default: asc) - Sort order (asc, desc)

**Response Structure:**
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
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/COLDDRINK&FRUITDRINK_1.jpg",
      "category_bg_color": "#FFFF00",
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3830,
    "pages": 766
  }
}
```

**Category Object Structure:**
```typescript
{
  _id: string;
  idcategory_master: string;
  category_name: string;
  dept_id: string;
  sequence_id: number;
  store_code: string;
  no_of_col?: string;
  image_link?: string;
  category_bg_color?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
```

---

## 3. GET Departments

**Endpoint:** `GET /api/admin/categories/departments/all`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by department_name
- `storeCode` - Filter by store code
- `deptTypeId` - Filter by department type ID
- `sortBy` (default: sequence_id) - Field to sort by
- `sortOrder` (default: asc) - Sort order (asc, desc)

**Response Structure:**
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
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1,
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 9,
    "pages": 2
  }
}
```

**Department Object Structure:**
```typescript
{
  _id: string;
  department_id: string;
  department_name: string;
  dept_type_id: string;
  dept_no_of_col: number;
  store_code: string | null;
  image_link?: string;
  sequence_id: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
```

---

## 4. GET Subcategories

**Endpoint:** `GET /api/admin/categories/subcategories/all`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by subcategory_name
- `categoryId` - Filter by category ID
- `sortBy` (default: sequence_id) - Field to sort by
- `sortOrder` (default: asc) - Sort order (asc, desc)

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6891b9aa9cdf8ee98b590865",
      "idsub_category_master": "4",
      "sub_category_name": "SOYABEAN OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 388,
    "pages": 78
  }
}
```

**Subcategory Object Structure:**
```typescript
{
  _id: string;
  idsub_category_master: string;
  sub_category_name: string;
  category_id: string;
  main_category_name: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
```

---

## Common Response Patterns

### Success Response
All endpoints return the same structure:
```json
{
  "success": true,
  "data": Array<T>,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error message"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Unauthorized - Please sign in again"
}
```

---

## Notes

1. **Authentication:** All endpoints require a valid JWT token in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

2. **Pagination:** 
   - `page` starts at 1
   - `pages` is calculated as `Math.ceil(total / limit)`
   - When `total` is 0, `pages` will be 0

3. **Empty Data:** When no records are found, `data` will be an empty array `[]` but `success` will still be `true`

4. **Null Values:** Some fields like `store_code` in departments can be `null` instead of empty strings

5. **Timestamps:** `createdAt` and `updatedAt` are included in the MongoDB document but may not always be present in the response (depends on model configuration)

6. **Populated Fields:** Products endpoint populates `category`, `subcategory`, and `department` fields with their names, while other endpoints return IDs as strings

