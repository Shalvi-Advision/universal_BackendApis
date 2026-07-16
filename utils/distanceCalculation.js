const https = require('https');
const http = require('http');

/**
 * Calculate Haversine distance between two coordinates.
 * Always available as the last-resort fallback.
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Get road distance from OSRM (Open Source Routing Machine).
 * Free, no API key required. Returns actual driving distance.
 * @returns {Promise<{distance: number, duration: number, isRoadDistance: boolean}>}
 */
const getOSRMDistance = (lat1, lon1, lat2, lon2, timeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    // OSRM expects lon,lat order
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 'Ok' && parsed.routes && parsed.routes.length > 0) {
            const route = parsed.routes[0];
            resolve({
              distance: route.distance / 1000, // meters to km
              duration: route.duration / 60,    // seconds to minutes
              isRoadDistance: true
            });
          } else {
            reject(new Error('No route found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSRM request timed out'));
    });
  });
};

/**
 * Calculate distance with three-tier fallback:
 * 1. OSRM road distance (accurate driving distance)
 * 2. Haversine straight-line distance (always works)
 *
 * @param {number} lat1 - Origin latitude
 * @param {number} lon1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {Promise<{distance: number, duration: number, isRoadDistance: boolean}>}
 */
const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  // Validate coordinates
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error('Invalid coordinates provided');
  }

  // Tier 1: Try OSRM road distance
  try {
    const result = await getOSRMDistance(lat1, lon1, lat2, lon2);
    console.log(`[Distance] OSRM road distance: ${result.distance.toFixed(2)} km`);
    return result;
  } catch (osrmError) {
    console.warn(`[Distance] OSRM failed: ${osrmError.message}, falling back to Haversine`);
  }

  // Tier 2: Haversine straight-line distance
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  const duration = (distance / 30) * 60; // Estimate: 30 km/h average city speed
  console.log(`[Distance] Haversine straight-line distance: ${distance.toFixed(2)} km`);

  return {
    distance,
    duration,
    isRoadDistance: false
  };
};

const isValidCoordinate = (lat, lon) => {
  return (
    typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90 &&
    typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180 &&
    !(lat === 0 && lon === 0)
  );
};

const normalizeSlabs = (slabs = []) => {
  if (!Array.isArray(slabs)) return [];

  return slabs
    .map((slab) => ({
      from_km: Math.max(0, Number(slab.from_km) || 0),
      to_km: slab.to_km == null || slab.to_km === '' ? null : Number(slab.to_km),
      per_km_charge: Math.max(0, Number(slab.per_km_charge) || 0),
    }))
    .filter((slab) => slab.per_km_charge >= 0)
    .sort((a, b) => a.from_km - b.from_km);
};

/**
 * Charge for distance beyond base_distance using slab rates.
 * Slab from_km/to_km are measured from the start of chargeable (extra) distance.
 */
const calculateSlabDistanceCharge = (extraKm, slabs, fallbackPerKm) => {
  if (extraKm <= 0) return 0;

  const normalized = normalizeSlabs(slabs);
  if (!normalized.length) {
    return extraKm * fallbackPerKm;
  }

  let total = 0;
  let coveredUntil = 0;

  for (const slab of normalized) {
    if (coveredUntil >= extraKm) break;

    if (slab.from_km > coveredUntil) {
      const gapEnd = Math.min(slab.from_km, extraKm);
      total += (gapEnd - coveredUntil) * fallbackPerKm;
      coveredUntil = gapEnd;
    }

    const slabEnd = slab.to_km == null ? extraKm : Math.min(slab.to_km, extraKm);
    const slabStart = Math.max(slab.from_km, coveredUntil);
    if (slabEnd > slabStart) {
      total += (slabEnd - slabStart) * slab.per_km_charge;
      coveredUntil = slabEnd;
    }
  }

  if (coveredUntil < extraKm) {
    total += (extraKm - coveredUntil) * fallbackPerKm;
  }

  return total;
};

const buildStoreDeliveryConfig = (store = {}) => ({
  free_delivery_threshold: store.free_delivery_threshold ?? 6000,
  free_delivery_radius_km: store.free_delivery_radius_km ?? 0,
  max_delivery_radius_km: store.max_delivery_radius_km ?? 50,
  base_charge: store.delivery_base_charge ?? 30,
  per_km_charge: store.delivery_per_km_charge ?? 5,
  base_distance_km: store.delivery_base_distance_km ?? 3,
  distance_slabs: normalizeSlabs(store.delivery_distance_slabs),
  handling_fee: store.handling_fee ?? 0,
  package_fee: store.package_fee ?? 0,
});

/**
 * Calculate delivery charges based on distance and order amount.
 * Supports flat per-km rate or distance slabs, plus handling & package fees.
 */
const calculateDeliveryCharge = (distanceKm, orderAmount, storeConfig = {}) => {
  const {
    free_delivery_threshold = 6000,
    free_delivery_radius_km = 0,
    max_delivery_radius_km = 50,
    base_charge = 30,
    per_km_charge = 5,
    base_distance_km = 3,
    distance_slabs = [],
    handling_fee = 0,
    package_fee = 0,
  } = storeConfig;

  const handlingFee = Math.max(0, Number(handling_fee) || 0);
  const packageFee = Math.max(0, Number(package_fee) || 0);

  if (distanceKm > max_delivery_radius_km) {
    return {
      deliveryCharge: -1,
      distanceCharge: 0,
      handlingFee,
      packageFee,
      totalCharges: 0,
      freeDeliveryEligible: false,
      reason: `Delivery not available beyond ${max_delivery_radius_km} km`,
    };
  }

  const orderQualifiesForFreeDelivery = orderAmount >= free_delivery_threshold;
  const withinFreeRadius = distanceKm <= free_delivery_radius_km;

  let distanceCharge = 0;
  let freeDeliveryEligible = false;
  let reason = '';

  if (orderQualifiesForFreeDelivery) {
    freeDeliveryEligible = true;
    reason = `Free delivery for orders above ₹${free_delivery_threshold}`;
  } else if (withinFreeRadius) {
    freeDeliveryEligible = true;
    reason = `Free delivery within ${free_delivery_radius_km} km`;
  } else {
    const extraDistance = Math.max(0, distanceKm - base_distance_km);
    const variableCharge = calculateSlabDistanceCharge(extraDistance, distance_slabs, per_km_charge);
    distanceCharge = Math.round(base_charge + variableCharge);

    if (distance_slabs.length > 0) {
      reason = `₹${base_charge} base + slab rates for ${extraDistance.toFixed(1)} km beyond ${base_distance_km} km`;
    } else {
      reason = `₹${base_charge} base + ₹${per_km_charge}/km for ${extraDistance.toFixed(1)} km extra`;
    }
  }

  const totalCharges = Math.round(distanceCharge + handlingFee + packageFee);

  return {
    deliveryCharge: totalCharges,
    distanceCharge,
    handlingFee,
    packageFee,
    totalCharges,
    freeDeliveryEligible,
    reason,
  };
};

module.exports = {
  calculateDistance,
  calculateDeliveryCharge,
  buildStoreDeliveryConfig,
  calculateSlabDistanceCharge,
  haversineDistance,
  isValidCoordinate,
};
