// Source of truth for the Digital Cart offer-group visuals. The public
// website renders whatever this returns — tile color, banner label, the
// two big text lines, the ribbon tag and an optional hero banner image.
// Admin overrides (DigitalCartSettings.group_styles, keyed by slug) win
// per field; empty/missing values fall back to these defaults.
const GROUP_DEFAULTS = {
  percent_off: { name: '% Off', color: '#e53935', label: 'BIG SAVINGS!', line1: '%', line2: 'OFF', ribbon: '' },
  buy_1_get_1: { name: 'Buy 1 Get 1', color: '#8e24aa', label: 'LIMITED TIME OFFER!', line1: 'BUY 1', line2: 'GET 1', ribbon: 'FREE' },
  buy_2_get_1: { name: 'Buy 2 Get 1', color: '#43a047', label: "DON'T MISS OUT!", line1: 'BUY 2', line2: 'GET 1', ribbon: 'FREE' },
  rs_off: { name: 'Rs. Off', color: '#00897b', label: 'SHOP MORE SAVE MORE', line1: '₹', line2: 'OFF', ribbon: '' },
  special_price: { name: 'Special Price', color: '#1e88e5', label: 'BEST PRICES!', line1: 'SPECIAL', line2: 'PRICES', ribbon: '' },
  other_offers: { name: 'Other Offers', color: '#fb8c00', label: 'SPECIAL OFFER', line1: 'MEGA', line2: 'OFFERS', ribbon: '' }
};

// Effective style per group: defaults + admin overrides
const mergeGroupStyles = (overrides) => {
  const safe = overrides && typeof overrides === 'object' ? overrides : {};
  const merged = {};
  for (const [slug, defaults] of Object.entries(GROUP_DEFAULTS)) {
    const over = safe[slug] && typeof safe[slug] === 'object' ? safe[slug] : {};
    merged[slug] = {
      name: defaults.name,
      color: over.color || defaults.color,
      label: over.label || defaults.label,
      line1: over.line1 || defaults.line1,
      line2: over.line2 || defaults.line2,
      ribbon: over.ribbon || defaults.ribbon,
      banner_image_url: over.banner_image_url || ''
    };
  }
  return merged;
};

module.exports = { GROUP_DEFAULTS, mergeGroupStyles };
