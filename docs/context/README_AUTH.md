# Patel E-commerce API - Authentication System

## Overview

The authentication system uses OTP (One-Time Password) based authentication with mobile numbers. Users don't need to register - they simply request an OTP and verify it to get authenticated.

## Authentication Flow

1. **Send OTP**: User sends mobile number → Receives OTP (currently "0000" for testing)
2. **Verify OTP**: User sends mobile + OTP → Gets JWT token for authenticated requests

## API Endpoints

### Authentication Routes

#### 1. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "0000", // Only in development mode
  "expiresIn": 5
}
```

#### 2. Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "0000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "mobile": "9876543210",
      "name": null,
      "email": null,
      "role": "user",
      "isVerified": true,
      "addresses": [],
      "favorites": []
    }
  }
}
```

#### 3. Get User Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
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
      "isVerified": true,
      "addresses": [...],
      "favorites": [...]
    }
  }
}
```

#### 4. Update User Profile (Protected)
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### 5. Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## User Model

The User collection stores:
- `mobile`: Unique mobile number (required)
- `otp`: Current OTP (temporary)
- `otpExpiresAt`: OTP expiration time
- `isVerified`: Whether user has verified their mobile
- `name`: User's name (optional)
- `email`: User's email (optional)
- `role`: 'user' or 'admin' (default: 'user')
- `addresses`: Array of address IDs
- `favorites`: Array of product IDs
- `createdAt`, `updatedAt`: Timestamps
- `lastLoginAt`: Last login timestamp

## Features

### Automatic User Creation
- Users are created automatically when they first request an OTP
- No separate registration process required

### OTP Management
- OTP expires in 5 minutes
- OTP is cleared after successful verification
- Rate limiting prevents OTP spam (5 requests per 15 minutes)

### JWT Token
- Token expires in 30 days (configurable)
- Contains user ID for authentication
- Used for protecting subsequent API routes

### Security Features
- Rate limiting on authentication endpoints
- Input validation for mobile numbers and OTP
- CORS protection
- Helmet security headers

## Testing the API

### 1. Start the Server
```bash
npm start
```

### 2. Test Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'
```

### 3. Test Verify OTP (Use "0000" as OTP)
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "0000"}'
```

### 4. Use the Token for Protected Routes
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not found
- `429`: Too many requests (rate limited)
- `500`: Server error

## Mobile Number Validation

- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9 (Indian mobile numbers)
- Examples: `9876543210`, `9123456789`

## Production Considerations

1. **OTP Delivery**: Implement actual SMS service (Twilio, AWS SNS, etc.)
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Rate Limiting**: Adjust limits based on your needs
4. **OTP Expiration**: Consider shorter expiration times
5. **Logging**: Implement proper logging for security events
6. **Monitoring**: Monitor authentication failures and suspicious activities

## Integration Example

```javascript
// Frontend integration example
class AuthService {
  async sendOtp(mobile) {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile }),
    });

    return response.json();
  }

  async verifyOtp(mobile, otp) {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage or secure cookie
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async getProfile() {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
}
```

## Security Best Practices

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
2. **Token Refresh**: Implement token refresh mechanism for better security
3. **OTP Security**: Never log or expose OTPs in production
4. **Rate Limiting**: Monitor and adjust rate limits based on usage patterns
5. **Input Sanitization**: All inputs are validated and sanitized
6. **CORS**: Properly configured CORS settings for your frontend domain

## Troubleshooting

### Common Issues

1. **"Mobile number is required"**
   - Ensure mobile field is provided in request body

2. **"Invalid mobile number"**
   - Check mobile number format (10 digits, starts with 6-9)

3. **"User not found"**
   - Request OTP first before trying to verify

4. **"Invalid OTP"**
   - Use "0000" for testing (only in development)

5. **"Token is not valid"**
   - Check if token is expired or malformed
   - Ensure user is verified (isVerified: true)

### Debug Mode

Set `NODE_ENV=development` to see:
- Actual OTP values in responses
- Detailed error stack traces
- Request logging

## Next Steps

After testing the authentication system, you can:

1. **Product APIs**: Implement product listing, search, and filtering
2. **Order Management**: Add order placement and tracking
3. **Payment Integration**: Integrate payment gateways
4. **Admin Panel**: Create admin routes for managing products/users
5. **Push Notifications**: Add notification system for orders/updates

The authentication system is now ready and all protected routes will require the JWT token obtained from the OTP verification process.
