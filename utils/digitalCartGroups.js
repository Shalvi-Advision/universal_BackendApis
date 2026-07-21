// Offer groups are DYNAMIC: every distinct value of the sheet's Offer
// column becomes a group (tab/tile) on the website, in sheet order. For
// each group this module derives a sensible default look (color, banner
// label, the two big text lines, ribbon) from the offer wording, then
// merges the admin's per-group overrides (DigitalCartSettings.group_styles,
// keyed by the group's slug) on top. Nothing about a group's look is
// hardcoded client-side.
const { classifyOffer, offerGroupName } = require('./digitalCartCsv');

const PALETTE = ['#e53935', '#8e24aa', '#fb8c00', '#00897b', '#1e88e5', '#43a047', '#d81b60', '#5e35b1', '#f4511e', '#00acc1'];

// Category → default color/label/ribbon (category comes from classifyOffer
// so messy variants like "B1G1"/"BUY1GET1" style consistently)
const CATEGORY_STYLE = {
  'Buy 1 Get 1': { color: '#8e24aa', label: 'LIMITED TIME OFFER!', ribbon: 'FREE' },
  'Buy 2 Get 1': { color: '#43a047', label: "DON'T MISS OUT!", ribbon: 'FREE' },
  '% Off': { color: '#e53935', label: 'BIG SAVINGS!' },
  'Rs. Off': { color: '#00897b', label: 'SHOP MORE SAVE MORE' },
  'Special Price': { color: '#1e88e5', label: 'BEST PRICES!' },
  'Other Offers': { color: '#fb8c00', label: 'SPECIAL OFFER!' }
};

// Stable settings key for a group name ("ON MRP 20% OFF" -> "on_mrp_20_off")
const offerGroupKey = (name) => {
  const key = offerGroupName(name)
    .toLowerCase()
    .replace(/%/g, ' pct ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return key || 'other_offers';
};

// Big tile/hero text derived from the offer wording
const deriveLines = (name, category) => {
  if (category === 'Buy 1 Get 1') return { line1: 'BUY 1', line2: 'GET 1' };
  if (category === 'Buy 2 Get 1') return { line1: 'BUY 2', line2: 'GET 1' };

  const percent = name.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent && /OFF/.test(name)) return { line1: `${percent[1]}%`, line2: 'OFF' };

  if (category === 'Rs. Off') {
    const amount = name.match(/(\d+(?:\.\d+)?)\s*(?:RS\.?|\/-)?\s*OFF/);
    if (amount) return { line1: `₹${amount[1]}`, line2: 'OFF' };
  }

  const words = name.split(' ');
  if (words.length === 1) return { line1: words[0], line2: '' };
  const middle = Math.ceil(words.length / 2);
  return { line1: words.slice(0, middle).join(' '), line2: words.slice(middle).join(' ') };
};

const deriveGroupDefault = (name, index) => {
  const category = classifyOffer(name);
  const categoryStyle = CATEGORY_STYLE[category] || {};
  const lines = deriveLines(name, category);
  return {
    color: categoryStyle.color || PALETTE[index % PALETTE.length],
    label: categoryStyle.label || 'SPECIAL OFFER!',
    line1: lines.line1,
    line2: lines.line2,
    ribbon: categoryStyle.ribbon || ''
  };
};

// Groups present in the given items (sheet order, with counts), each with
// its effective style (derived default + admin override) and the default
// kept alongside so the admin panel can show it as placeholders.
const buildGroups = (items, overrides) => {
  const safe = overrides && typeof overrides === 'object' ? overrides : {};
  const order = [];
  const counts = {};
  for (const item of items) {
    const name = offerGroupName(item.offer_text);
    if (!(name in counts)) {
      counts[name] = 0;
      order.push(name);
    }
    counts[name] += 1;
  }

  return order.map((name, index) => {
    const key = offerGroupKey(name);
    const defaults = deriveGroupDefault(name, index);
    const over = safe[key] && typeof safe[key] === 'object' ? safe[key] : {};
    const line1 = over.line1 || defaults.line1;
    return {
      key,
      name,
      count: counts[name],
      color: over.color || defaults.color,
      label: over.label || defaults.label,
      line1,
      line2: over.line2 || defaults.line2,
      ribbon: over.ribbon || defaults.ribbon,
      banner_image_url: over.banner_image_url || '',
      // Giant-first-line rendering only suits short text ("50%", "₹81")
      numeric: line1.length > 0 && line1.length <= 4,
      defaults
    };
  });
};

module.exports = { buildGroups, offerGroupKey, deriveGroupDefault };
