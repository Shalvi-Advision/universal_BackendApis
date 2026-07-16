const https = require('https');
const { isValidCoordinate, haversineDistance } = require('./distanceCalculation');

const NOMINATIM_UA = 'PagariyaMart/1.0 (ecommerce-backend)';
const INDIA_BOUNDS = { minLat: 6, maxLat: 37, minLon: 68, maxLon: 97 };

const isWithinIndia = (lat, lon) => {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  return (
    Number.isFinite(la) && Number.isFinite(lo) &&
    la >= INDIA_BOUNDS.minLat && la <= INDIA_BOUNDS.maxLat &&
    lo >= INDIA_BOUNDS.minLon && lo <= INDIA_BOUNDS.maxLon &&
    !(la === 0 && lo === 0)
  );
};

const nominatimGet = (path) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: 'nominatim.openstreetmap.org',
        path,
        headers: { 'User-Agent': NOMINATIM_UA },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Nominatim timeout'));
    });
  });

const geocodeAddressText = async ({ line1, city, pincode }) => {
  const query = [line1, city, pincode, 'India'].filter(Boolean).join(', ');
  if (!query.trim()) return null;

  try {
    const data = await nominatimGet(
      `/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`
    );
    if (Array.isArray(data) && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        source: 'nominatim',
      };
    }
  } catch (e) {
    console.warn('[Geocoding] Text geocode failed:', e.message);
  }

  if (pincode) {
    try {
      const data = await nominatimGet(
        `/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`
      );
      if (Array.isArray(data) && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          source: 'pincode',
        };
      }
    } catch (e) {
      console.warn('[Geocoding] Pincode geocode failed:', e.message);
    }
  }

  return null;
};

/**
 * Resolve coordinates for an address: prefer client pin, else server geocode.
 */
const resolveAddressCoordinates = async ({
  latitude,
  longitude,
  delivery_addr_line_1,
  delivery_addr_city,
  delivery_addr_pincode,
}) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isWithinIndia(lat, lon)) {
    return {
      latitude: lat,
      longitude: lon,
      source: 'pin_drop',
    };
  }

  const geocoded = await geocodeAddressText({
    line1: delivery_addr_line_1,
    city: delivery_addr_city,
    pincode: delivery_addr_pincode,
  });

  if (geocoded && isWithinIndia(geocoded.latitude, geocoded.longitude)) {
    return geocoded;
  }

  return null;
};

/** Warn if pin is far from pincode centroid (>15 km). */
const validatePincodeDistance = async (lat, lon, pincode) => {
  if (!pincode) return { ok: true };
  const centroid = await geocodeAddressText({ line1: '', city: '', pincode });
  if (!centroid) return { ok: true };

  const km = haversineDistance(lat, lon, centroid.latitude, centroid.longitude);
  if (km > 15) {
    return {
      ok: false,
      warning: `Delivery pin is ${km.toFixed(1)} km from PIN ${pincode}. Please verify the map pin.`,
    };
  }
  return { ok: true };
};

module.exports = {
  isWithinIndia,
  resolveAddressCoordinates,
  validatePincodeDistance,
  geocodeAddressText,
};
