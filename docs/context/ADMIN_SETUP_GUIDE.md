# Quick Admin Setup Guide

This guide will help you set up and test the Admin APIs in 5 minutes.

## Step 1: Create an Admin User

You need to manually set at least one user as admin in the database.

### Option A: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `users` collection
4. Find a user and click Edit
5. Change `role` from `"user"` to `"admin"`
6. Click Update

### Option B: Using MongoDB Shell
```bash
# Connect to your database
mongosh "your-mongodb-connection-string"

# Switch to your database
use your_database_name

# Update a user to admin (replace mobile number)
db.users.updateOne(
  { mobile: "9876543210" },
  { $set: { role: "admin" } }
)
```

### Option C: Using Node.js Script
Create a file `make-admin.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function makeAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const mobile = "9876543210"; // Replace with your mobile

  const user = await User.findOneAndUpdate(
    { mobile },
    { role: "admin" },
    { new: true }
  );

  if (user) {
    console.log("User is now admin:", user.mobile);
  } else {
    console.log("User not found. First register using the app.");
  }

  process.exit(0);
}

makeAdmin();
```

Run it:
```bash
node make-admin.js
```

---

## Step 2: Get Your Admin Token

### 2.1 Send OTP
```bash
curl -X POST http://localhost:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'
```

### 2.2 Verify OTP (use 0000 for testing)
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "0000"}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "mobile": "9876543210",
    "role": "admin",
    ...
  }
}
```

**Copy the token value!**

---

## Step 3: Test Admin APIs

### 3.1 Test Dashboard Overview
```bash
curl -X GET http://localhost:5001/api/admin/dashboard/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.2 Test Get All Users
```bash
curl -X GET "http://localhost:5001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.3 Test Get All Products
```bash
curl -X GET "http://localhost:5001/api/admin/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3.4 Test Get All Orders
```bash
curl -X GET "http://localhost:5001/api/admin/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Step 4: Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select the file: `Patel_Ecommerce_Admin_APIs.postman_collection.json`
4. Collection will be imported with all endpoints

### Set Your Token in Postman:
1. Click on the collection name
2. Go to **Variables** tab
3. Set `admin_token` value to your JWT token
4. Click **Save**

Now all requests in the collection will use your token!

---

## Step 5: Common Admin Tasks

### Make Another User Admin
```bash
curl -X PATCH http://localhost:5001/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Update Product Stock
```bash
curl -X PATCH http://localhost:5001/api/admin/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 100, "operation": "set"}'
```

### Update Order Status
```bash
curl -X PATCH http://localhost:5001/api/admin/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### Get Sales Analytics
```bash
curl -X GET "http://localhost:5001/api/admin/dashboard/sales-trend?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Complete API Endpoint List

### User Management (6 endpoints)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/role` - Change role
- `GET /api/admin/users/stats/overview` - User stats

### Product Management (10 endpoints)
- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:id` - Get product details
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PATCH /api/admin/products/:id/stock` - Update stock
- `PATCH /api/admin/products/:id/status` - Update status
- `PATCH /api/admin/products/:id/price` - Update price
- `GET /api/admin/products/stats/overview` - Product stats
- `POST /api/admin/products/bulk-update-status` - Bulk update

### Order Management (9 endpoints)
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update status
- `PATCH /api/admin/orders/:id/payment-status` - Update payment
- `PUT /api/admin/orders/:id` - Update order
- `DELETE /api/admin/orders/:id` - Delete order
- `GET /api/admin/orders/stats/overview` - Order stats
- `GET /api/admin/orders/stats/revenue` - Revenue stats
- `POST /api/admin/orders/bulk-update-status` - Bulk update

### Analytics Dashboard (8 endpoints)
- `GET /api/admin/dashboard/overview` - Complete overview
- `GET /api/admin/dashboard/sales-trend` - Sales trend
- `GET /api/admin/dashboard/top-products` - Top products
- `GET /api/admin/dashboard/top-categories` - Top categories
- `GET /api/admin/dashboard/recent-orders` - Recent orders
- `GET /api/admin/dashboard/order-status-distribution` - Order distribution
- `GET /api/admin/dashboard/payment-status-distribution` - Payment distribution
- `GET /api/admin/dashboard/user-activity` - User activity

### Category Management (5 endpoints)
- `GET /api/admin/categories` - Get all categories
- `GET /api/admin/categories/:id` - Get category
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Department Management (5 endpoints)
- `GET /api/admin/categories/departments/all` - Get all departments
- `GET /api/admin/categories/departments/:id` - Get department
- `POST /api/admin/categories/departments` - Create department
- `PUT /api/admin/categories/departments/:id` - Update department
- `DELETE /api/admin/categories/departments/:id` - Delete department

### Subcategory Management (4 endpoints)
- `GET /api/admin/categories/subcategories/all` - Get all subcategories
- `POST /api/admin/categories/subcategories` - Create subcategory
- `PUT /api/admin/categories/subcategories/:id` - Update subcategory
- `DELETE /api/admin/categories/subcategories/:id` - Delete subcategory

---

## Troubleshooting

### "Access denied. No token provided"
- Make sure you're sending the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`

### "User role user is not authorized"
- Your user is not an admin
- Update the user's role in database to "admin"

### "Token is not valid"
- Your token expired or is invalid
- Get a new token by verifying OTP again

### "Order not found" / "Product not found"
- The ID you're using doesn't exist
- Use the GET endpoints to find valid IDs first

---

## Security Notes

### For Production:
1. **Change OTP:** Remove hardcoded `0000` OTP
2. **Add Token Expiration:** Set JWT expiration (e.g., 7 days)
3. **Rate Limiting:** Already implemented but verify limits
4. **HTTPS Only:** Use HTTPS in production
5. **Environment Variables:** Store secrets in .env file

### Current Test Settings:
- OTP: `0000` (hardcoded for testing)
- Token: No expiration
- Rate Limit: 1500 requests per 15 minutes

---

## Next Steps

1. ✅ Set up admin user
2. ✅ Get admin token
3. ✅ Import Postman collection
4. ✅ Test basic endpoints
5. 📱 Build admin panel frontend
6. 🚀 Deploy to production

---

## Support

Need help? Check:
1. Server logs for errors
2. MongoDB connection
3. Token format in Authorization header
4. User role is "admin" in database

**Total Admin APIs:** 47 endpoints across 7 categories

Happy Admin Panel Building! 🎉
