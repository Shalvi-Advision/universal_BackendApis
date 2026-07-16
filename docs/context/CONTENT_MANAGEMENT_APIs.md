# Content Management Admin APIs

Complete documentation for all Content Management Admin APIs including Best Sellers, Advertisements, Popular Categories, Payment Modes, Pincodes, Stores, and Delivery Slots.

## Overview

**Base URL:** `/api/admin/content`

All endpoints require:
- JWT Authentication (Bearer token)
- Admin role authorization

**Total Endpoints:** 28 (4 endpoints per resource × 7 resources)

---

## Table of Contents
1. [Best Sellers Management](#1-best-sellers-management)
2. [Advertisements Management](#2-advertisements-management)
3. [Popular Categories Management](#3-popular-categories-management)
4. [Payment Modes Management](#4-payment-modes-management)
5. [Pincodes Management](#5-pincodes-management)
6. [Stores Management](#6-stores-management)
7. [Delivery Slots Management](#7-delivery-slots-management)

---

## 1. Best Sellers Management

Manage best-selling products display on the home page.

### Get All Best Sellers
```http
GET /api/admin/content/best-sellers?page=1&limit=20&sortBy=sequence&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Create Best Seller
```http
POST /api/admin/content/best-sellers
Content-Type: application/json

{
  "p_code": "P001",
  "sequence": 1,
  "image_link": "https://example.com/image.jpg"
}
```

### Update Best Seller
```http
PUT /api/admin/content/best-sellers/:id
Content-Type: application/json

{
  "sequence": 2,
  "image_link": "https://example.com/new-image.jpg"
}
```

### Delete Best Seller
```http
DELETE /api/admin/content/best-sellers/:id
```

---

## 2. Advertisements Management

Manage promotional banners and advertisements.

### Get All Advertisements
```http
GET /api/admin/content/advertisements?page=1&limit=20&sortBy=sequence&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

### Create Advertisement
```http
POST /api/admin/content/advertisements
Content-Type: application/json

{
  "title": "Summer Sale",
  "image_link": "https://example.com/banner.jpg",
  "redirect_url": "https://example.com/sale",
  "sequence": 1,
  "is_active": true
}
```

### Update Advertisement
```http
PUT /api/admin/content/advertisements/:id
Content-Type: application/json

{
  "title": "Updated Summer Sale",
  "is_active": false
}
```

### Delete Advertisement
```http
DELETE /api/admin/content/advertisements/:id
```

---

## 3. Popular Categories Management

Manage popular category highlights.

### Get All Popular Categories
```http
GET /api/admin/content/popular-categories?page=1&limit=20&sortBy=sequence&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### Create Popular Category
```http
POST /api/admin/content/popular-categories
Content-Type: application/json

{
  "category_id": "CAT001",
  "category_name": "Electronics",
  "image_link": "https://example.com/category.jpg",
  "sequence": 1
}
```

### Update Popular Category
```http
PUT /api/admin/content/popular-categories/:id
Content-Type: application/json

{
  "sequence": 2,
  "image_link": "https://example.com/new-category.jpg"
}
```

### Delete Popular Category
```http
DELETE /api/admin/content/popular-categories/:id
```

---

## 4. Payment Modes Management

Manage available payment methods.

### Get All Payment Modes
```http
GET /api/admin/content/payment-modes?page=1&limit=20&sortBy=sequence_id&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "payment_mode_id": 1,
      "payment_mode_name": "Cash on Delivery",
      "sequence_id": 1,
      "is_active": true
    }
  ],
  "pagination": {...}
}
```

### Create Payment Mode
```http
POST /api/admin/content/payment-modes
Content-Type: application/json

{
  "payment_mode_id": 3,
  "payment_mode_name": "UPI Payment",
  "sequence_id": 3,
  "is_active": true
}
```

### Update Payment Mode
```http
PUT /api/admin/content/payment-modes/:id
Content-Type: application/json

{
  "payment_mode_name": "Updated Payment Mode",
  "is_active": false
}
```

### Delete Payment Mode
```http
DELETE /api/admin/content/payment-modes/:id
```

---

## 5. Pincodes Management

Manage serviceable pincodes and delivery areas.

### Get All Pincodes
```http
GET /api/admin/content/pincodes?page=1&limit=20&search=&sortBy=pincode&sortOrder=asc
```

**Query Parameters:**
- `search` - Search by pincode, area, or city

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "pincode": "400001",
      "area": "Fort",
      "city": "Mumbai",
      "state": "Maharashtra",
      "is_serviceable": true
    }
  ],
  "pagination": {...}
}
```

### Create Pincode
```http
POST /api/admin/content/pincodes
Content-Type: application/json

{
  "pincode": "400001",
  "area": "Fort",
  "city": "Mumbai",
  "state": "Maharashtra",
  "is_serviceable": true
}
```

### Update Pincode
```http
PUT /api/admin/content/pincodes/:id
Content-Type: application/json

{
  "is_serviceable": false
}
```

### Delete Pincode
```http
DELETE /api/admin/content/pincodes/:id
```

---

## 6. Stores Management

Manage store locations and information.

### Get All Stores
```http
GET /api/admin/content/stores?page=1&limit=20&search=&sortBy=store_code&sortOrder=asc
```

**Query Parameters:**
- `search` - Search by store code or store name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "store_code": "STORE001",
      "store_name": "Main Branch",
      "address": "123 Main Street",
      "city": "Mumbai",
      "phone": "9876543210"
    }
  ],
  "pagination": {...}
}
```

### Create Store
```http
POST /api/admin/content/stores
Content-Type: application/json

{
  "store_code": "STORE001",
  "store_name": "Main Branch",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "9876543210",
  "email": "store@example.com"
}
```

### Update Store
```http
PUT /api/admin/content/stores/:id
Content-Type: application/json

{
  "store_name": "Updated Branch Name",
  "phone": "9876543211"
}
```

### Delete Store
```http
DELETE /api/admin/content/stores/:id
```

---

## 7. Delivery Slots Management

Manage delivery time slots for orders.

### Get All Delivery Slots
```http
GET /api/admin/content/delivery-slots?page=1&limit=20&sortBy=sequence_id&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "slot_id": 1,
      "slot_from": "09:00",
      "slot_to": "12:00",
      "sequence_id": 1,
      "is_active": true
    }
  ],
  "pagination": {...}
}
```

### Create Delivery Slot
```http
POST /api/admin/content/delivery-slots
Content-Type: application/json

{
  "slot_id": 4,
  "slot_from": "18:00",
  "slot_to": "21:00",
  "sequence_id": 4,
  "is_active": true
}
```

### Update Delivery Slot
```http
PUT /api/admin/content/delivery-slots/:id
Content-Type: application/json

{
  "slot_from": "18:30",
  "slot_to": "21:30",
  "is_active": false
}
```

### Delete Delivery Slot
```http
DELETE /api/admin/content/delivery-slots/:id
```

---

## Common Features

### All endpoints support:
✅ Pagination (page, limit)
✅ Sorting (sortBy, sortOrder)
✅ Search (where applicable)
✅ Standard CRUD operations
✅ Error handling
✅ Authentication & authorization

### Common Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## cURL Examples

### Best Sellers

```bash
# Get all
curl -X GET "http://localhost:5001/api/admin/content/best-sellers" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create
curl -X POST "http://localhost:5001/api/admin/content/best-sellers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"p_code":"P001","sequence":1}'

# Update
curl -X PUT "http://localhost:5001/api/admin/content/best-sellers/ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sequence":2}'

# Delete
curl -X DELETE "http://localhost:5001/api/admin/content/best-sellers/ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Pincodes with Search

```bash
curl -X GET "http://localhost:5001/api/admin/content/pincodes?search=400001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Payment Modes

```bash
curl -X POST "http://localhost:5001/api/admin/content/payment-modes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_mode_id": 4,
    "payment_mode_name": "Wallet",
    "sequence_id": 4,
    "is_active": true
  }'
```

---

## Postman Collection - New Endpoints

Add these to your existing Postman collection:

### Collection Structure
```
Content Management/
├── Best Sellers/
│   ├── Get All Best Sellers
│   ├── Create Best Seller
│   ├── Update Best Seller
│   └── Delete Best Seller
├── Advertisements/
│   ├── Get All Advertisements
│   ├── Create Advertisement
│   ├── Update Advertisement
│   └── Delete Advertisement
├── Popular Categories/
│   ├── Get All Popular Categories
│   ├── Create Popular Category
│   ├── Update Popular Category
│   └── Delete Popular Category
├── Payment Modes/
│   ├── Get All Payment Modes
│   ├── Create Payment Mode
│   ├── Update Payment Mode
│   └── Delete Payment Mode
├── Pincodes/
│   ├── Get All Pincodes
│   ├── Create Pincode
│   ├── Update Pincode
│   └── Delete Pincode
├── Stores/
│   ├── Get All Stores
│   ├── Create Store
│   ├── Update Store
│   └── Delete Store
└── Delivery Slots/
    ├── Get All Delivery Slots
    ├── Create Delivery Slot
    ├── Update Delivery Slot
    └── Delete Delivery Slot
```

---

## Complete API Endpoint List

### Content Management APIs (28 endpoints)

#### Best Sellers (4 endpoints)
1. `GET /api/admin/content/best-sellers`
2. `POST /api/admin/content/best-sellers`
3. `PUT /api/admin/content/best-sellers/:id`
4. `DELETE /api/admin/content/best-sellers/:id`

#### Advertisements (4 endpoints)
5. `GET /api/admin/content/advertisements`
6. `POST /api/admin/content/advertisements`
7. `PUT /api/admin/content/advertisements/:id`
8. `DELETE /api/admin/content/advertisements/:id`

#### Popular Categories (4 endpoints)
9. `GET /api/admin/content/popular-categories`
10. `POST /api/admin/content/popular-categories`
11. `PUT /api/admin/content/popular-categories/:id`
12. `DELETE /api/admin/content/popular-categories/:id`

#### Payment Modes (4 endpoints)
13. `GET /api/admin/content/payment-modes`
14. `POST /api/admin/content/payment-modes`
15. `PUT /api/admin/content/payment-modes/:id`
16. `DELETE /api/admin/content/payment-modes/:id`

#### Pincodes (4 endpoints)
17. `GET /api/admin/content/pincodes`
18. `POST /api/admin/content/pincodes`
19. `PUT /api/admin/content/pincodes/:id`
20. `DELETE /api/admin/content/pincodes/:id`

#### Stores (4 endpoints)
21. `GET /api/admin/content/stores`
22. `POST /api/admin/content/stores`
23. `PUT /api/admin/content/stores/:id`
24. `DELETE /api/admin/content/stores/:id`

#### Delivery Slots (4 endpoints)
25. `GET /api/admin/content/delivery-slots`
26. `POST /api/admin/content/delivery-slots`
27. `PUT /api/admin/content/delivery-slots/:id`
28. `DELETE /api/admin/content/delivery-slots/:id`

---

## Use Cases

### Example: Managing Delivery Slots

```javascript
// 1. Get all delivery slots
GET /api/admin/content/delivery-slots

// 2. Create morning slot
POST /api/admin/content/delivery-slots
{
  "slot_id": 1,
  "slot_from": "09:00",
  "slot_to": "12:00",
  "sequence_id": 1,
  "is_active": true
}

// 3. Update slot timing
PUT /api/admin/content/delivery-slots/ID
{
  "slot_from": "09:30",
  "slot_to": "12:30"
}

// 4. Disable slot temporarily
PUT /api/admin/content/delivery-slots/ID
{
  "is_active": false
}
```

### Example: Managing Serviceable Areas

```javascript
// 1. Check which pincodes are serviceable
GET /api/admin/content/pincodes?search=400

// 2. Add new serviceable pincode
POST /api/admin/content/pincodes
{
  "pincode": "400001",
  "area": "Fort",
  "city": "Mumbai",
  "state": "Maharashtra",
  "is_serviceable": true
}

// 3. Disable service for a pincode
PUT /api/admin/content/pincodes/ID
{
  "is_serviceable": false
}
```

---

## HTTP Status Codes

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Server Error

---

## Testing Checklist

### For Each Resource:
- [ ] GET - Fetch all items with pagination
- [ ] GET - Search functionality (where applicable)
- [ ] POST - Create new item
- [ ] PUT - Update existing item
- [ ] DELETE - Remove item
- [ ] Verify authentication required
- [ ] Verify admin role required
- [ ] Test error cases (invalid ID, missing fields)

---

## Summary

**Total New Endpoints:** 28
**Resources Managed:** 7
- Best Sellers
- Advertisements
- Popular Categories
- Payment Modes
- Pincodes
- Stores
- Delivery Slots

**Operations Per Resource:** 4 (Create, Read, Update, Delete)

All endpoints are production-ready and follow the same patterns as other admin APIs.

---

**Version:** 1.0.0
**Last Updated:** 2024
