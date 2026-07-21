/**
 * Parser for Digital Cart offer sheets (CSV export from Excel).
 * Sheets typically have blank padding columns/rows and a header row like:
 *   ,,P-Code,Product Name,MRP,Offer Price,Offer
 * Values may be non-numeric ("ALL MRP", "All Code", "NEW") — kept as raw text.
 */

// Minimal RFC-4180-ish CSV parser (handles quoted fields, escaped quotes, CRLF)
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

// Group the free-text Offer column into customer-facing tabs. The sheets are
// inconsistent ("BUY1GET1", "B1G1", "BUY 1 GET 1", "0N MRP 20 RS OFF"...), so
// classify on a normalized string with everything but letters/digits/% removed.
const classifyOffer = (offerText) => {
  const normalized = String(offerText || '').toUpperCase().replace(/[^A-Z0-9%]/g, '');
  if (!normalized) return 'Other Offers';
  if (/BUY2GET1/.test(normalized)) return 'Buy 2 Get 1';
  if (/BUY1GET1|B1G1/.test(normalized)) return 'Buy 1 Get 1';
  if (/%OFF/.test(normalized)) return '% Off';
  if (/MRP.*OFF|RSOFF/.test(normalized)) return 'Rs. Off';
  if (/ONLY|NET|PLP/.test(normalized)) return 'Special Price';
  return 'Other Offers';
};

// The customer-facing offer group IS the sheet's Offer column value,
// normalized for display (trimmed, single-spaced, uppercased). Every
// distinct value becomes its own tab/tile on the website.
const offerGroupName = (offerText) => {
  const name = String(offerText || '').trim().replace(/\s+/g, ' ').toUpperCase();
  return name || 'OTHER OFFERS';
};

const toNumber = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

/**
 * Parse a Digital Cart CSV buffer/string into item objects.
 * Returns { items } or { error } with a human-readable message.
 */
const parseDigitalCartCsv = (csvText) => {
  const rows = parseCsv(String(csvText));

  // Locate the header row and map column indexes by header name
  let headerIndex = -1;
  const columns = { p_code: -1, product_name: -1, mrp: -1, offer_price: -1, offer_text: -1, image_url: -1 };

  for (let i = 0; i < rows.length; i += 1) {
    const cells = rows[i].map((c) => c.trim().toLowerCase());
    const pCodeCol = cells.findIndex((c) => /^p[\s._-]?code$/.test(c));
    const nameCol = cells.findIndex((c) => c.includes('product') && c.includes('name'));

    if (pCodeCol !== -1 && nameCol !== -1) {
      headerIndex = i;
      columns.p_code = pCodeCol;
      columns.product_name = nameCol;
      columns.mrp = cells.findIndex((c) => c === 'mrp');
      columns.offer_price = cells.findIndex((c) => c.includes('offer') && c.includes('price'));
      columns.offer_text = cells.findIndex((c, idx) => c === 'offer' && idx !== columns.offer_price);
      columns.image_url = cells.findIndex((c) => /image|img|photo/.test(c));
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      error: 'Could not find a header row. The CSV must contain columns "P-Code" and "Product Name" (MRP, Offer Price and Offer are also expected).'
    };
  }

  const cell = (row, idx) => (idx >= 0 && idx < row.length ? String(row[idx]).trim() : '');

  const items = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const productName = cell(row, columns.product_name);
    if (!productName) continue; // padding / blank rows

    const mrp = cell(row, columns.mrp);
    const offerPrice = cell(row, columns.offer_price);
    const offerText = cell(row, columns.offer_text);
    const imageUrl = cell(row, columns.image_url);

    items.push({
      p_code: cell(row, columns.p_code),
      product_name: productName,
      mrp,
      offer_price: offerPrice,
      mrp_value: toNumber(mrp),
      offer_price_value: toNumber(offerPrice),
      offer_text: offerText,
      offer_group: offerGroupName(offerText),
      image_url: /^https?:\/\//i.test(imageUrl) ? imageUrl : '',
      position: items.length,
      is_active: true
    });
  }

  if (items.length === 0) {
    return { error: 'No product rows found below the header row.' };
  }

  return { items };
};

module.exports = { parseDigitalCartCsv, parseCsv, classifyOffer, offerGroupName };
