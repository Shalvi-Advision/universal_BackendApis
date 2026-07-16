# Store API Documentation

## Overview
The Store API provides an endpoint to find stores available for a specific pincode. The data is stored in the `pincodestoremasters` collection in MongoDB.

## Base URL
```
http://localhost:5001/api/stores
```

---

## Endpoint

### Get Stores by Pincode (POST)
Get all stores available for a specific pincode.

**Endpoint:** `POST /api/stores/by-pincode`

**Request Body:**
```json
{
  "pincode": "421002"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5001/api/stores/by-pincode \
  -H "Content-Type: application/json" \
  -d '{"pincode": "421002"}'
```

**Example Response (Stores Found):**
```json
{
  "success": true,
  "count": 1,
  "message": "Found 1 store(s) for pincode 421002",
  "pincode": "421002",
  "data": [
    {
      "id": "68a8a1db4169ced4c49f93f4",
      "pincode": "421002",
      "store_name": "Ulhasnagar No.2",
      "store_code": "ULN",
      "address": "Mukund Bldg., Opp. Kailash Complex, Aman Takies Road, Ulhasnagar-",
      "min_order_amount": 500,
      "store_open_time": "9 am to 10 pm",
      "delivery_time": "Day + 1 day",
      "offer": "Upto 50% Off ",
      "location": {
        "latitude": "19.23388970015527",
        "longitude": "73.1596099650062"
      },
      "delivery_options": {
        "home_delivery": true,
        "self_pickup": false
      },
      "contact": {
        "phone": "9356941549",
        "email": "support@patelrpl.net",
        "whatsapp": "9356941549"
      },
      "message": "We are not accepting any Online Order, sorry for inconvenience",
      "is_enabled": "Enabled"
    }
  ]
}
```

**Example Response (No Stores Found):**
```json
{
  "success": true,
  "count": 0,
  "message": "No stores found for this pincode",
  "pincode": "123456",
  "data": []
}
```

**Error Response (Invalid Pincode Format):**
```json
{
  "success": false,
  "error": "Please provide a valid 6-digit pincode"
}
```

**Error Response (Missing Pincode):**
```json
{
  "success": false,
  "error": "Please provide a pincode"
}
```

---

## Data Model

### Store Schema
```javascript
{
  pincode: String (6 digits, required),
  mobile_outlet_name: String (store name, required),
  store_code: String (required),
  is_enabled: String (enum: ['Enabled', 'Disabled']),
  store_address: String (required),
  min_order_amount: Number (default: 500),
  store_open_time: String,
  store_delivery_time: String,
  store_offer_name: String,
  latitude: String,
  longitude: String,
  home_delivery: String (enum: ['yes', 'no']),
  self_pickup: String (enum: ['yes', 'no']),
  store_message: String,
  contact_number: String (required),
  email: String (required),
  whatsappnumber: String,
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Store unique identifier |
| `pincode` | String | 6-digit pincode |
| `store_name` | String | Store outlet name |
| `store_code` | String | Store code (e.g., ULN, DOW) |
| `address` | String | Complete store address |
| `min_order_amount` | Number | Minimum order amount in ₹ |
| `store_open_time` | String | Store operating hours |
| `delivery_time` | String | Expected delivery time |
| `offer` | String | Current store offer |
| `location` | Object | Store coordinates |
| `location.latitude` | String | GPS latitude |
| `location.longitude` | String | GPS longitude |
| `delivery_options` | Object | Available delivery methods |
| `delivery_options.home_delivery` | Boolean | Home delivery available |
| `delivery_options.self_pickup` | Boolean | Self pickup available |
| `contact` | Object | Store contact information |
| `contact.phone` | String | Contact phone number |
| `contact.email` | String | Contact email |
| `contact.whatsapp` | String | WhatsApp number |
| `message` | String | Store message/status |
| `is_enabled` | String | Store status (Enabled/Disabled) |

---

## Use Cases

### 1. Store Locator on Checkout
```javascript
const findStores = async (pincode) => {
  try {
    const response = await fetch('http://localhost:5001/api/stores/by-pincode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pincode })
    });
    
    const data = await response.json();
    
    if (data.count > 0) {
      console.log(`Found ${data.count} store(s)`);
      // Display stores to user
      data.data.forEach(store => {
        console.log(`${store.store_name} - ${store.address}`);
        console.log(`Min Order: ₹${store.min_order_amount}`);
        console.log(`Delivery: ${store.delivery_time}`);
      });
    } else {
      console.log('No stores available for your pincode');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example usage
findStores('421002');
```

### 2. Show Store on Map
```javascript
const showStoreOnMap = async (pincode) => {
  const response = await fetch('http://localhost:5001/api/stores/by-pincode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pincode })
  });
  
  const data = await response.json();
  
  if (data.count > 0) {
    data.data.forEach(store => {
      if (store.location.latitude && store.location.longitude) {
        // Add marker to map
        addMapMarker({
          lat: parseFloat(store.location.latitude),
          lng: parseFloat(store.location.longitude),
          title: store.store_name,
          description: store.address
        });
      }
    });
  }
};
```

### 3. Select Nearest Store
```javascript
const selectStore = async (pincode) => {
  const response = await fetch('http://localhost:5001/api/stores/by-pincode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pincode })
  });
  
  const data = await response.json();
  
  if (data.count > 0) {
    // Let user select from available stores
    const storeOptions = data.data.map(store => ({
      value: store.id,
      label: `${store.store_name} - ${store.delivery_time}`,
      minOrder: store.min_order_amount,
      hasHomeDelivery: store.delivery_options.home_delivery
    }));
    
    // Populate dropdown
    return storeOptions;
  }
  
  return [];
};
```

---

## Features

✅ **Pincode Validation** - Validates 6-digit pincode format  
✅ **Enabled Stores Only** - Returns only active/enabled stores  
✅ **Detailed Information** - Complete store details including:
  - Store name and code
  - Full address
  - Operating hours
  - Delivery time
  - Minimum order amount
  - Current offers
  - GPS coordinates
  - Delivery options (home delivery/self pickup)
  - Contact details (phone, email, WhatsApp)
  - Store messages/status
  
✅ **Formatted Response** - Clean, structured JSON response  
✅ **Error Handling** - Proper validation and error messages

---

## Testing with Postman

1. **Import Collection**: Import the updated `Patel_Ecommerce_API.postman_collection.json`
2. **Navigate to**: Stores → Get Stores by Pincode
3. **Modify Body**: Change the pincode value to test different pincodes
4. **Send Request**: Click Send
5. **View Response**: Check console for formatted store details

### Test Pincodes from Database:
- `421002` - Ulhasnagar No.2
- `421004` - Venus Chowk, Ulhasnagar No.4
- `421103` - Nr.Railway Stn.Shahad
- `421202` - Multiple stores in Dombivli (W)
- `421301` - Multiple stores in Kalyan
- `421503` - Multiple stores in Badlapur
- `421201` - Multiple stores in Dombivli (E)

---

## Integration Flow

```
User enters pincode on checkout
        ↓
POST /api/stores/by-pincode
        ↓
Returns list of stores
        ↓
User selects preferred store
        ↓
Display store details:
  - Delivery time
  - Minimum order amount
  - Contact information
  - Location on map
        ↓
Proceed with order
```

---

## Notes

- Only **enabled stores** are returned in the response
- Stores are sorted by store name alphabetically
- The API returns empty array if no stores found (not an error)
- Pincode must be exactly 6 digits
- All stores have minimum order amount (typically ₹500)
- GPS coordinates are provided for map integration
- Store messages may contain important information (e.g., temporary closures)

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success (even if no stores found) |
| 400 | Bad Request (invalid/missing pincode) |
| 500 | Server Error |

---

## Example API Responses

### Multiple Stores for Same Pincode
```json
{
  "success": true,
  "count": 3,
  "message": "Found 3 store(s) for pincode 421301",
  "pincode": "421301",
  "data": [
    {
      "store_name": "Khadkpada, Kalyan (W)",
      "store_code": "KLK",
      "delivery_time": "+1 Day",
      ...
    },
    {
      "store_name": "Rambaug Kalyan (W)",
      "store_code": "KLW",
      "delivery_time": "Day + 1 day",
      ...
    },
    {
      "store_name": "Tilak Chowk, Kalyan (W)",
      "store_code": "KLT",
      "delivery_time": "Day + 1 day",
      ...
    }
  ]
}
```

This allows users to choose their preferred store based on location, delivery time, or other preferences!

