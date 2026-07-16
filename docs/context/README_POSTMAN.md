# Postman Collection - Patel E-commerce API

## 🚀 Quick Start

### 1. Import the Collection

1. Open **Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Patel_Ecommerce_API.postman_collection.json`
5. Click **Import**

### 2. Import the Environment

1. In Postman, click **Environments** (left sidebar)
2. Click **Import**
3. Choose `Patel_Ecommerce_API.postman_environment.json`
4. Select the imported environment from the dropdown (top right)

### 3. Start the Server

Make sure your API server is running:

```bash
cd /path/to/Ecommerce_API's
npm start
```

The server should be running on `http://localhost:5000`

## 📋 Testing Flow

### Complete Authentication Flow

1. **Send OTP** - `POST /api/auth/send-otp`
2. **Verify OTP** - `POST /api/auth/verify-otp`
3. **Get Profile** - `GET /api/auth/profile` (protected)
4. **Update Profile** - `PUT /api/auth/profile` (protected)
5. **Logout** - `POST /api/auth/logout` (protected)

## 🔧 Collection Structure

```
Patel E-commerce API/
├── Authentication/
│   ├── 1. Send OTP
│   ├── 2. Verify OTP & Login
│   ├── 3. Get User Profile
│   ├── 4. Update User Profile
│   └── 5. Logout
├── Health Check/
│   └── Server Health
└── Error Testing/
    ├── Invalid Mobile Number
    ├── Missing OTP
    ├── Wrong OTP
    └── Access Protected Route Without Token
```

## 📝 Step-by-Step Testing

### Step 1: Send OTP
- **Endpoint**: `POST {{baseUrl}}/api/auth/send-otp`
- **Body**:
  ```json
  {
    "mobile": "{{testMobile}}"
  }
  ```
- **Expected Response** (200):
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "otp": "0000",
    "expiresIn": 1
  }
  ```

### Step 2: Verify OTP & Login
- **Endpoint**: `POST {{baseUrl}}/api/auth/verify-otp`
- **Body**:
  ```json
  {
    "mobile": "{{testMobile}}",
    "otp": "{{testOTP}}"
  }
  ```
- **Expected Response** (200):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": "...",
        "mobile": "9876543210",
        "name": null,
        "email": null,
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```

### Step 3: Get User Profile (Protected)
- **Endpoint**: `GET {{baseUrl}}/api/auth/profile`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "...",
        "mobile": "9876543210",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```

### Step 4: Update User Profile (Protected)
- **Endpoint**: `PUT {{baseUrl}}/api/auth/profile`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
  ```

### Step 5: Logout (Protected)
- **Endpoint**: `POST {{baseUrl}}/api/auth/logout`
- **Headers**: `Authorization: Bearer {{authToken}}`

## 🧪 Error Testing

The collection includes tests for various error scenarios:

### Invalid Mobile Number
Tests mobile number validation (must be 10 digits, start with 6-9)

### Missing OTP
Tests when OTP field is missing in request

### Wrong OTP
Tests with incorrect OTP value

### Unauthorized Access
Tests accessing protected routes without valid token

## 🔐 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API server base URL | `http://localhost:5000` |
| `authToken` | JWT token (auto-set after login) | (empty) |
| `testMobile` | Test mobile number | `9876543210` |
| `testOTP` | Test OTP value | `0000` |

## 🛠️ Customization

### Change Test Mobile Number
1. In Postman, go to **Environments**
2. Edit the `testMobile` variable value
3. Update the variable in the collection if needed

### Change Server URL
1. Edit the `baseUrl` environment variable
2. Update if your server runs on different port/host

## 📊 Response Handling

The collection includes test scripts that:
- ✅ Log success messages
- ❌ Log error details
- 🔄 Automatically store auth tokens
- 🧹 Clear tokens on logout

## 🚨 Common Issues

### "Server not responding"
- Ensure the API server is running (`npm start`)
- Check if server is accessible at `http://localhost:5000/health`

### "Unauthorized" errors
- Run **"2. Verify OTP & Login"** first to get a valid token
- Token is automatically stored in `authToken` variable

### "Invalid mobile number"
- Mobile must be exactly 10 digits
- Must start with 6, 7, 8, or 9 (Indian format)

## 🎯 Tips for Testing

1. **Run requests in order** - Start with "Send OTP" then "Verify OTP"
2. **Check Console** - Test scripts log detailed information
3. **Use Environment** - Variables are automatically managed
4. **Token Auto-management** - No need to manually copy tokens

## 📈 Advanced Usage

### Run Collection in Runner
1. Click **Runner** (top left in Postman)
2. Select the collection
3. Choose the environment
4. Click **Run** to execute all tests

### Generate Documentation
1. Select collection
2. Click **View** → **Generate Documentation**
3. Export as HTML/PDF

## 🔒 Security Notes

- Test OTP is **"0000"** only in development
- In production, real OTP would be sent via SMS
- JWT tokens should be stored securely (httpOnly cookies recommended)
- Rate limiting is active (5 auth requests per 15 minutes)

## 📞 Support

If you encounter issues:
1. Check server logs for error details
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check network connectivity to `localhost:5000`

---

**Happy Testing! 🚀**

The Postman collection provides a complete testing suite for the Patel E-commerce API authentication system. All endpoints are thoroughly tested with proper error handling and response validation.
