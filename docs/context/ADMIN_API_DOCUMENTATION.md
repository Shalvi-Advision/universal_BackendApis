# Patel E-Commerce Admin API Documentation

Complete documentation for all Admin Panel APIs.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [User Management](#user-management)
  - [Product Management](#product-management)
  - [Order Management](#order-management)
  - [Analytics Dashboard](#analytics-dashboard)
  - [Category Management](#category-management)
  - [Department Management](#department-management)
  - [Subcategory Management](#subcategory-management)
- [Setup Instructions](#setup-instructions)
- [Postman Collection](#postman-collection)

---

## Overview

The Admin APIs provide comprehensive functionality for managing the Patel E-Commerce platform. All admin endpoints require authentication and admin role authorization.

**Base URL:** `http://localhost:5001/api/admin`

---

## Authentication

All admin APIs require:
1. **JWT Token** in Authorization header: `Bearer <token>`
2. **Admin Role** - User must have `role: "admin"`

### Setting Up Admin User

To make a user an admin, you need to manually update the database:

```javascript
// Using MongoDB shell or compass
db.users.updateOne(
  { mobile: "9876543210" },  // Replace with your mobile number
  { $set: { role: "admin" } }
)
```

Or use the admin API after you have at least one admin user:
```
PATCH /api/admin/users/:id/role
{
  "role": "admin"
}
```

---

## API Endpoints

### User Management

Base URL: `/api/admin/users`

#### 1. Get All Users
```
GET /api/admin/users
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search by mobile, name, or email
- `role` - Filter by role (user/admin)
- `sortBy` (default: createdAt) - Field to sort by
- `sortOrder` (default: desc) - Sort order (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### 2. Get User by ID
```
GET /api/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "stats": {
      "totalOrders": 10,
      "totalSpent": 5000,
      "completedOrders": 8,
      "cancelledOrders": 2
    }
  }
}
```

#### 3. Update User
```
PUT /api/admin/users/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "user",
  "isVerified": true
}
```

#### 4. Delete User
```
DELETE /api/admin/users/:id
```

**Note:** Cannot delete users with active orders.

#### 5. Change User Role
```
PATCH /api/admin/users/:id/role
```

**Request Body:**
```json
{
  "role": "admin"
}
```

#### 6. Get User Statistics
```
GET /api/admin/users/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "verifiedUsers": 850,
    "adminUsers": 5,
    "activeUsers24h": 120,
    "newUsersLast7Days": 45
  }
}
```

---

### Product Management

Base URL: `/api/admin/products`

#### 1. Get All Products
```
GET /api/admin/products
```

**Query Parameters:**
- `page`, `limit`, `search`
- `category` - Filter by category ID
- `subcategory` - Filter by subcategory ID
- `status` - Filter by status (active/inactive/out_of_stock/discontinued)
- `stockStatus` - Filter by stock (in_stock/out_of_stock/low_stock)
- `sortBy`, `sortOrder`

#### 2. Get Product by ID
```
GET /api/admin/products/:id
```

#### 3. Create Product
```
POST /api/admin/products
```

**Request Body:**
```json
{
  "productCode": "P001",
  "name": "Sample Product",
  "description": "Product description",
  "category": "category_id_here",
  "price": {
    "mrp": 100,
    "sellingPrice": 80,
    "discount": 20
  },
  "stock": {
    "quantity": 50,
    "minStockLevel": 5
  },
  "status": "active"
}
```

#### 4. Update Product
```
PUT /api/admin/products/:id
```

#### 5. Delete Product
```
DELETE /api/admin/products/:id
```

#### 6. Update Product Stock
```
PATCH /api/admin/products/:id/stock
```

**Request Body:**
```json
{
  "quantity": 100,
  "operation": "set"  // Options: set, add, subtract
}
```

#### 7. Update Product Status
```
PATCH /api/admin/products/:id/status
```

**Request Body:**
```json
{
  "status": "active"  // Options: active, inactive, out_of_stock, discontinued
}
```

#### 8. Update Product Price
```
PATCH /api/admin/products/:id/price
```

**Request Body:**
```json
{
  "mrp": 150,
  "sellingPrice": 120,
  "discount": 20
}
```

#### 9. Get Product Statistics
```
GET /api/admin/products/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 500,
    "activeProducts": 450,
    "outOfStock": 30,
    "lowStock": 20,
    "featuredProducts": 10,
    "totalStockValue": 500000
  }
}
```

#### 10. Bulk Update Product Status
```
POST /api/admin/products/bulk-update-status
```

**Request Body:**
```json
{
  "productIds": ["id1", "id2", "id3"],
  "status": "active"
}
```

---

### Order Management

Base URL: `/api/admin/orders`

#### 1. Get All Orders
```
GET /api/admin/orders
```

**Query Parameters:**
- `page`, `limit`, `search`
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `startDate`, `endDate` - Date range filter
- `sortBy`, `sortOrder`

#### 2. Get Order by ID
```
GET /api/admin/orders/:id
```

#### 3. Update Order Status
```
PATCH /api/admin/orders/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid statuses:** placed, confirmed, processing, packed, shipped, delivered, cancelled, refunded

#### 4. Update Payment Status
```
PATCH /api/admin/orders/:id/payment-status
```

**Request Body:**
```json
{
  "paymentStatus": "completed",
  "transactionId": "TXN123456"
}
```

**Valid payment statuses:** pending, processing, completed, failed, cancelled

#### 5. Update Order
```
PUT /api/admin/orders/:id
```

#### 6. Delete Order
```
DELETE /api/admin/orders/:id
```

**Note:** Only orders with status "placed" or "cancelled" can be deleted.

#### 7. Get Order Statistics
```
GET /api/admin/orders/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "todayOrders": 25,
    "monthOrders": 300,
    "statusCounts": {
      "placed": 50,
      "confirmed": 100,
      "delivered": 800
    },
    "paymentStatusCounts": {
      "completed": 900,
      "pending": 100
    },
    "revenue": {
      "totalRevenue": 500000,
      "averageOrderValue": 500,
      "totalItems": 2000
    }
  }
}
```

#### 8. Get Revenue Statistics
```
GET /api/admin/orders/stats/revenue
```

**Query Parameters:**
- `startDate` - Start date for analysis
- `endDate` - End date for analysis
- `groupBy` - Grouping (day/month/year)

#### 9. Bulk Update Order Status
```
POST /api/admin/orders/bulk-update-status
```

**Request Body:**
```json
{
  "orderIds": ["id1", "id2", "id3"],
  "status": "confirmed"
}
```

---

### Analytics Dashboard

Base URL: `/api/admin/dashboard`

#### 1. Dashboard Overview
```
GET /api/admin/dashboard/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "newToday": 5,
      "newThisMonth": 50,
      "growth": 10.5
    },
    "products": {
      "total": 500,
      "active": 450,
      "outOfStock": 30,
      "lowStock": 20
    },
    "orders": {
      "total": 1000,
      "today": 25,
      "thisWeek": 150,
      "thisMonth": 300,
      "pending": 50,
      "growth": 15.2
    },
    "revenue": {
      "total": 500000,
      "today": 5000,
      "thisMonth": 100000,
      "averageOrderValue": 500,
      "growth": 20.5
    }
  }
}
```

#### 2. Sales Trend
```
GET /api/admin/dashboard/sales-trend?days=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2024-01-01",
      "orders": 25,
      "revenue": 12500,
      "items": 75
    }
  ]
}
```

#### 3. Top Products
```
GET /api/admin/dashboard/top-products?limit=10
```

#### 4. Top Categories
```
GET /api/admin/dashboard/top-categories?limit=10
```

#### 5. Recent Orders
```
GET /api/admin/dashboard/recent-orders?limit=10
```

#### 6. Order Status Distribution
```
GET /api/admin/dashboard/order-status-distribution
```

#### 7. Payment Status Distribution
```
GET /api/admin/dashboard/payment-status-distribution
```

#### 8. User Activity
```
GET /api/admin/dashboard/user-activity
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeLastHour": 10,
    "activeLastDay": 120,
    "activeLastWeek": 500
  }
}
```

---

### Category Management

Base URL: `/api/admin/categories`

#### 1. Get All Categories
```
GET /api/admin/categories
```

**Query Parameters:**
- `page`, `limit`, `search`
- `storeCode` - Filter by store
- `deptId` - Filter by department
- `sortBy`, `sortOrder`

#### 2. Get Category by ID
```
GET /api/admin/categories/:id
```

#### 3. Create Category
```
POST /api/admin/categories
```

**Request Body:**
```json
{
  "idcategory_master": "CAT001",
  "category_name": "New Category",
  "dept_id": "DEPT001",
  "sequence_id": 1,
  "store_code": "STORE001",
  "image_link": "https://example.com/image.jpg",
  "category_bg_color": "#FFFFFF"
}
```

#### 4. Update Category
```
PUT /api/admin/categories/:id
```

#### 5. Delete Category
```
DELETE /api/admin/categories/:id
```

---

### Department Management

Base URL: `/api/admin/categories/departments`

#### 1. Get All Departments
```
GET /api/admin/categories/departments/all
```

#### 2. Get Department by ID
```
GET /api/admin/categories/departments/:id
```

#### 3. Create Department
```
POST /api/admin/categories/departments
```

**Request Body:**
```json
{
  "department_id": "DEPT001",
  "department_name": "New Department",
  "dept_type_id": "TYPE001",
  "sequence_id": 1,
  "store_code": "STORE001",
  "image_link": "https://example.com/image.jpg"
}
```

#### 4. Update Department
```
PUT /api/admin/categories/departments/:id
```

#### 5. Delete Department
```
DELETE /api/admin/categories/departments/:id
```

---

### Subcategory Management

Base URL: `/api/admin/categories/subcategories`

#### 1. Get All Subcategories
```
GET /api/admin/categories/subcategories/all
```

#### 2. Create Subcategory
```
POST /api/admin/categories/subcategories
```

#### 3. Update Subcategory
```
PUT /api/admin/categories/subcategories/:id
```

#### 4. Delete Subcategory
```
DELETE /api/admin/categories/subcategories/:id
```

---

## Setup Instructions

### 1. Create Your First Admin User

```bash
# Method 1: Using MongoDB Shell
mongosh "your-mongodb-connection-string"
use your_database_name
db.users.updateOne(
  { mobile: "9876543210" },
  { $set: { role: "admin" } }
)
```

### 2. Get Admin Token

```bash
# Send OTP
POST /api/auth/send-otp
{
  "mobile": "9876543210"
}

# Verify OTP (use 0000 for testing)
POST /api/auth/verify-otp
{
  "mobile": "9876543210",
  "otp": "0000"
}

# Response will include token:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "role": "admin",
    ...
  }
}
```

### 3. Use Token in Admin APIs

Add the token to Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Postman Collection

Import the Postman collection:
1. Open Postman
2. Click "Import"
3. Select file: `Patel_Ecommerce_Admin_APIs.postman_collection.json`
4. Update the `admin_token` variable with your JWT token

**Collection Variables:**
- `base_url`: `http://localhost:5001/api`
- `admin_token`: Your JWT token (set after login)

---

## API Features

### Common Features Across All APIs:
✅ Pagination support
✅ Search functionality
✅ Advanced filtering
✅ Sorting options
✅ Error handling
✅ Input validation
✅ Role-based access control

### Security Features:
🔒 JWT authentication required
🔒 Admin role authorization
🔒 Request validation
🔒 Rate limiting
🔒 CORS protection

---

## Error Responses

All APIs follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Server Error

---

## Notes

1. **OTP for Testing:** The current implementation uses hardcoded OTP `0000` for testing purposes
2. **Token Expiration:** JWT tokens don't expire in current implementation (add expiration for production)
3. **Pagination:** Default page size is 20, maximum is 100
4. **Search:** Case-insensitive partial matching
5. **Date Formats:** Use ISO 8601 format (e.g., `2024-01-01T00:00:00.000Z`)

---

## Support

For issues or questions:
- Check the error message in the response
- Verify your admin token is valid
- Ensure user has admin role
- Check request body format matches documentation

---

**Last Updated:** 2024
**Version:** 1.0.0
