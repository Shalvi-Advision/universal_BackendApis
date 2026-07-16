# Admin Dashboard API Responses

**Base URL:** `http://localhost:5001`  
**Authentication:** Bearer Token required in Authorization header

---

## 1. Dashboard Overview

**Endpoint:** `GET /api/admin/dashboard/overview`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 11,
      "newToday": 1,
      "newThisMonth": 3,
      "newLastMonth": 8,
      "growth": -62.5
    },
    "products": {
      "total": 0,
      "active": 0,
      "outOfStock": 0,
      "lowStock": 0
    },
    "orders": {
      "total": 2,
      "today": 0,
      "thisWeek": 0,
      "thisMonth": 0,
      "lastMonth": 2,
      "pending": 2,
      "growth": -100
    },
    "revenue": {
      "total": 127,
      "today": 0,
      "thisMonth": 0,
      "lastMonth": 127,
      "averageOrderValue": 63.5,
      "growth": null
    }
  }
}
```

**Notes:**
- Growth percentages can be negative
- Revenue growth can be `null` (handle gracefully)
- All counts are integers

---

## 2. Sales Trend

**Endpoint:** `GET /api/admin/dashboard/sales-trend?days=30`

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to fetch

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2025-10-23",
      "orders": 2,
      "revenue": 127,
      "items": 3
    }
  ]
}
```

**Notes:**
- `_id` is date string in format `YYYY-MM-DD`
- Data is sorted chronologically
- Empty array if no orders in date range

---

## 3. Top Products

**Endpoint:** `GET /api/admin/dashboard/top-products?limit=10`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of products to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2390",
      "productName": "SABUDANA 250 (N.W.)",
      "totalQuantity": 3,
      "totalRevenue": 54,
      "orderCount": 2
    },
    {
      "_id": "1001",
      "productName": "ORALB T/B SEN WHITE-SOFT",
      "totalQuantity": 1,
      "totalRevenue": 54,
      "orderCount": 1
    }
  ]
}
```

**Notes:**
- `_id` is product code (p_code)
- Sorted by `totalQuantity` descending
- Empty array if no products sold

---

## 4. Top Categories

**Endpoint:** `GET /api/admin/dashboard/top-categories?limit=10`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of categories to return

**Response:**
```json
{
  "success": true,
  "data": []
}
```

**Notes:**
- Returns empty array if no categories with products
- Sorted by `productCount` descending
- Includes category name, product count, and total stock

---

## 5. Recent Orders

**Endpoint:** `GET /api/admin/dashboard/recent-orders?limit=10`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of orders to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customer_info": {
        "name": "Test User",
        "email": "test@example.com"
      },
      "order_summary": {
        "total_amount": 106
      },
      "_id": "68fa14663891334f53bb4cfe",
      "order_number": "ORD2510230002",
      "mobile_no": "9876543210",
      "order_status": "placed",
      "order_placed_at": "2025-10-23T11:41:26.639Z"
    }
  ]
}
```

**Notes:**
- Sorted by `order_placed_at` descending (most recent first)
- Only includes selected fields (not full order object)
- Dates in ISO 8601 format

---

## 6. Order Status Distribution

**Endpoint:** `GET /api/admin/dashboard/order-status-distribution`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "placed",
      "count": 2,
      "totalValue": 127
    }
  ]
}
```

**Notes:**
- `_id` is order status name
- Sorted by `count` descending
- Possible statuses: placed, confirmed, processing, packed, shipped, delivered, cancelled, refunded

---

## 7. Payment Status Distribution

**Endpoint:** `GET /api/admin/dashboard/payment-status-distribution`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "pending",
      "count": 2,
      "totalValue": 127
    }
  ]
}
```

**Notes:**
- `_id` is payment status name
- Sorted by `count` descending
- Possible statuses: pending, processing, completed, failed, cancelled

---

## 8. User Activity

**Endpoint:** `GET /api/admin/dashboard/user-activity`

**Response:**
```json
{
  "success": true,
  "data": {
    "activeLastHour": 1,
    "activeLastDay": 4,
    "activeLastWeek": 7
  }
}
```

**Notes:**
- Based on `lastActiveAt` field in User model
- All values are integers (counts)
- Time ranges: 1 hour, 24 hours, 7 days

---

## Common Response Structure

All endpoints return:
```json
{
  "success": true,
  "data": {...}
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## Testing Examples

### Dashboard Overview
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/overview" \
  -H "Authorization: Bearer <token>"
```

### Sales Trend (30 days)
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/sales-trend?days=30" \
  -H "Authorization: Bearer <token>"
```

### Top Products (limit 10)
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/top-products?limit=10" \
  -H "Authorization: Bearer <token>"
```

### Top Categories (limit 10)
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/top-categories?limit=10" \
  -H "Authorization: Bearer <token>"
```

### Recent Orders (limit 10)
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/recent-orders?limit=10" \
  -H "Authorization: Bearer <token>"
```

### Order Status Distribution
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/order-status-distribution" \
  -H "Authorization: Bearer <token>"
```

### Payment Status Distribution
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/payment-status-distribution" \
  -H "Authorization: Bearer <token>"
```

### User Activity
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/user-activity" \
  -H "Authorization: Bearer <token>"
```

