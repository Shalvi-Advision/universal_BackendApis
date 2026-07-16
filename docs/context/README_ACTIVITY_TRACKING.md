# User Activity Tracking System

## Overview

The user activity tracking system monitors when users are actively using the mobile app, independent of login events. Since JWT tokens are valid for 25 days, this system tracks real app usage through session-based activity monitoring.

## How It Works

### Mobile App Integration

1. **On App Launch/Foreground**: Call `POST /api/auth/is-active` with JWT token
2. **Periodic Pings** (optional): Call every 60-120 seconds while app is active
3. **Session Management**: System tracks sessionId to maintain continuous sessions
4. **Device Information**: Tracks platform, deviceId, and app version

### API Endpoint

```
POST /api/auth/is-active
Authorization: Bearer <token>
```

**Request Body (optional):**
```json
{
  "sessionId": "optional_session_id_from_previous_call",
  "device": {
    "platform": "ios",      // or "android", "web"
    "deviceId": "device123",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "lastActiveAt": "2025-10-12T20:53:48.374Z",
    "session": {
      "sessionId": "1760302426291_bk00g49s",
      "startedAt": "2025-10-12T20:53:46.291Z",
      "lastSeenAt": "2025-10-12T20:53:48.374Z",
      "durationMs": 2083,
      "device": {
        "platform": "ios",
        "deviceId": "test-device-123",
        "appVersion": "1.0.0"
      }
    },
    "totalActiveMs": 2083,
    "activeWindowMs": 600000
  }
}
```

## User Schema Fields

### Activity Fields

- **`lastActiveAt`**: Timestamp of last activity (updated on every is-active call)
- **`totalActiveMs`**: Cumulative active time across all sessions (milliseconds)
- **`currentSession`**: Object containing current session information
  - `sessionId`: Unique identifier for the session
  - `startedAt`: When the session started
  - `lastSeenAt`: Last activity ping timestamp
  - `durationMs`: Duration of current session (milliseconds)
  - `device`: Device information (platform, deviceId, appVersion)

## Activity Logic

### Session Creation
- New session created on first call to is-active
- New session created if sessionId mismatches
- New session created if no existing session

### Duration Accumulation
- Gap between calls is accumulated into session duration
- Maximum gap capped at 5 minutes (prevents inflation from backgrounded apps)
- Total active time accumulates across all sessions

### Active Status
- User considered "active" if `lastActiveAt` is within 10 minutes
- `isActive` boolean returned in response
- `activeWindowMs` shows the threshold (600000ms = 10 minutes)

## Testing

### Using Test Script
```bash
node test_isactive.js
```

### Using Postman
1. Login via "2. Verify OTP & Login" to get token
2. Run "6. Check Active Status (IsActive)" request
3. Verify session is created and duration accumulates on subsequent calls

### Manual Testing with curl
```bash
# Get token first
TOKEN="your_jwt_token_here"

# First call - creates session
curl -X POST http://localhost:5001/api/auth/is-active \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device": {
      "platform": "ios",
      "deviceId": "test123",
      "appVersion": "1.0.0"
    }
  }'

# Wait 2 seconds, then call again with sessionId
curl -X POST http://localhost:5001/api/auth/is-active \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID_FROM_FIRST_CALL",
    "device": {
      "platform": "ios",
      "deviceId": "test123",
      "appVersion": "1.0.0"
    }
  }'
```

## Use Cases

### 1. Real-time User Activity Status
Check if user is currently active (within 10 minutes):
```javascript
if (user.lastActiveAt && user.isActiveWithin(10 * 60 * 1000)) {
  console.log('User is active now');
}
```

### 2. Session Analytics
Track how long users spend in the app:
```javascript
const sessionMinutes = user.currentSession.durationMs / (1000 * 60);
console.log(`Current session: ${sessionMinutes.toFixed(2)} minutes`);

const totalHours = user.totalActiveMs / (1000 * 60 * 60);
console.log(`Total active time: ${totalHours.toFixed(2)} hours`);
```

### 3. Device Analytics
Track which devices/platforms users are using:
```javascript
console.log('User device:', user.currentSession.device.platform);
console.log('App version:', user.currentSession.device.appVersion);
```

## Mobile App Implementation Example

```javascript
// React Native example
import AsyncStorage from '@react-native-async-storage/async-storage';

class ActivityTracker {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.sessionId = null;
    this.intervalId = null;
  }

  async startTracking() {
    // Load existing sessionId if available
    this.sessionId = await AsyncStorage.getItem('sessionId');

    // Call on app foreground
    await this.ping();

    // Setup periodic pings every 2 minutes
    this.intervalId = setInterval(() => {
      this.ping();
    }, 2 * 60 * 1000);
  }

  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async ping() {
    try {
      const response = await this.apiClient.post('/api/auth/is-active', {
        sessionId: this.sessionId,
        device: {
          platform: Platform.OS,
          deviceId: DeviceInfo.getUniqueId(),
          appVersion: DeviceInfo.getVersion()
        }
      });

      // Store new sessionId
      const newSessionId = response.data.data.session.sessionId;
      if (newSessionId !== this.sessionId) {
        this.sessionId = newSessionId;
        await AsyncStorage.setItem('sessionId', newSessionId);
      }

      return response.data.data;
    } catch (error) {
      console.error('Activity ping failed:', error);
    }
  }
}

// Usage in App.js
import { AppState } from 'react-native';

const activityTracker = new ActivityTracker(apiClient);

useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      activityTracker.startTracking();
    } else {
      activityTracker.stopTracking();
    }
  });

  // Start tracking on mount
  activityTracker.startTracking();

  return () => {
    subscription.remove();
    activityTracker.stopTracking();
  };
}, []);
```

## Important Notes

1. **5-Minute Cap**: Gaps between pings are capped at 5 minutes to prevent inflated durations when app is backgrounded
2. **Token Validity**: Tokens are valid for 25 days, so activity tracking works independently of login
3. **Session Persistence**: Sessions persist across API calls until app termination or new session creation
4. **Privacy**: Only tracks when app is actively used, not background location or other intrusive data
5. **Performance**: Lightweight implementation with minimal database writes

## Benefits

- ✅ Track real app usage independent of login events
- ✅ Understand user engagement patterns
- ✅ Identify active vs inactive users
- ✅ Device and platform analytics
- ✅ Session duration metrics
- ✅ Cumulative usage statistics

## Future Enhancements

Potential improvements for future versions:

1. **Session History**: Store historical sessions for analytics
2. **Activity Heatmap**: Track when users are most active
3. **Feature Usage**: Track which app features are used most
4. **Offline Support**: Queue activity updates when offline
5. **Analytics Dashboard**: Admin dashboard showing user activity metrics
