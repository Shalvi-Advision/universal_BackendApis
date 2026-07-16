# 🚀 Admin APIs - Quick Start

Get started with Admin Panel APIs in 3 minutes!

---

## ⚡ 3-Step Quick Start

### 1️⃣ Create Admin User
```bash
npm run create-admin
```
**Creates admin with mobile: `9999999999`**

### 2️⃣ Get Token
```bash
# In Postman: Authentication > Verify OTP & Login
Mobile: 9999999999
OTP: 0000
```
**Token saved automatically in collection!**

### 3️⃣ Test Admin API
```bash
# In Postman: Admin APIs > Analytics Dashboard > Dashboard Overview
# Click Send (token already configured!)
```

**Done! You're using Admin APIs! ✅**

---

## 📁 Updated Files

✅ **Postman Collection Updated**
   - Location: `/postman/Patel_Ecommerce_API.postman_collection.json`
   - Version: 2.0.0
   - New Folder: "Admin APIs" with 75 endpoints

✅ **Admin Routes Created**
   - `/routes/admin/users.js` - User management (6 endpoints)
   - `/routes/admin/products.js` - Product management (10 endpoints)
   - `/routes/admin/orders.js` - Order management (9 endpoints)
   - `/routes/admin/dashboard.js` - Analytics (8 endpoints)
   - `/routes/admin/categories.js` - Categories/Departments (14 endpoints)
   - `/routes/admin/content.js` - Content management (28 endpoints)

✅ **Scripts Added**
   - `npm run create-admin` - Create admin user
   - `npm run update-postman` - Update Postman collection

---

## 🎯 Most Used Commands

```bash
# Start server
npm start

# Create admin
npm run create-admin

# Create custom admin
node create-admin.js 9876543210
```

---

## 📊 Admin APIs Overview

### 75 Total Endpoints

**User Management** - 6 endpoints
- Manage users, roles, permissions

**Product Management** - 10 endpoints
- Catalog, stock, pricing, bulk ops

**Order Management** - 9 endpoints
- Orders, payments, analytics

**Analytics Dashboard** - 8 endpoints
- Stats, trends, reports

**Categories** - 14 endpoints
- Categories, departments, subcategories

**Content Management** - 28 endpoints
- Best sellers, ads, payment modes, pincodes, stores, delivery slots

---

## 🔑 Default Credentials

```
Mobile: 9999999999
OTP: 0000 (for testing)
Role: admin
```

---

## 📚 Documentation

**Start Here:**
- [ADMIN_README.md](ADMIN_README.md) - Main guide
- [POSTMAN_UPDATE_SUMMARY.md](POSTMAN_UPDATE_SUMMARY.md) - Postman details

**Complete Reference:**
- [ADMIN_API_DOCUMENTATION.md](ADMIN_API_DOCUMENTATION.md) - Core APIs (47 endpoints)
- [CONTENT_MANAGEMENT_APIs.md](CONTENT_MANAGEMENT_APIs.md) - Content APIs (28 endpoints)
- [FINAL_ADMIN_SUMMARY.md](FINAL_ADMIN_SUMMARY.md) - Complete overview

---

## ✅ Verification

After setup, verify everything works:

```bash
# 1. Server running?
curl http://localhost:5001/health

# 2. Admin created?
npm run create-admin

# 3. Can get token?
# Use Postman: Authentication > Verify OTP & Login

# 4. Admin API works?
# Use Postman: Admin APIs > Analytics Dashboard > Dashboard Overview
```

---

## 🎯 Key Features

✅ 75 fully functional admin endpoints
✅ Complete CRUD operations
✅ Real-time analytics
✅ Bulk operations
✅ Search & filters
✅ Pagination
✅ JWT authentication
✅ Role-based access control

---

## 💡 Pro Tips

### Use Postman
- Import: `postman/Patel_Ecommerce_API.postman_collection.json`
- Token saved automatically after login
- All 75 admin endpoints ready to use

### Multiple Admins
```bash
node create-admin.js 9876543210
node create-admin.js 9123456780
```

### Database Access
```javascript
// MongoDB: users collection
role: "admin"  // Required for admin APIs
```

---

## 🔄 Workflow

```
1. Start Server → npm start
2. Create Admin → npm run create-admin
3. Open Postman → Import collection
4. Login → Get token (auto-saved)
5. Test APIs → Admin APIs folder
6. Build Frontend → Use these APIs
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Add token to Authorization header |
| 403 Forbidden | User must have `role: "admin"` |
| 404 Not Found | Check endpoint URL and server is running |
| Token invalid | Get new token via Postman login |

---

## 📞 Common Endpoints

```bash
# Dashboard
GET /api/admin/dashboard/overview

# Users
GET /api/admin/users?page=1&limit=20

# Products
GET /api/admin/products?page=1&limit=20

# Orders
GET /api/admin/orders?page=1&limit=20

# Update Order
PATCH /api/admin/orders/:id/status
{"status": "confirmed"}

# Update Stock
PATCH /api/admin/products/:id/stock
{"quantity": 100, "operation": "set"}
```

---

## 🎉 You're Ready!

Everything is set up and ready to use:
- ✅ 75 admin endpoints available
- ✅ Postman collection updated
- ✅ Documentation complete
- ✅ Scripts ready
- ✅ Zero configuration needed

**Start building your admin panel frontend!** 🚀

---

**Quick Links:**
- [Full Setup Guide](ADMIN_README.md)
- [API Documentation](ADMIN_API_DOCUMENTATION.md)
- [Postman Guide](POSTMAN_UPDATE_SUMMARY.md)
- [Complete Summary](FINAL_ADMIN_SUMMARY.md)

**Version:** 2.0.0 | **Status:** ✅ Ready
