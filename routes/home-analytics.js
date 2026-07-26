const express = require('express');
const router = express.Router();
const HomeSectionEvent = require('../models/HomeSectionEvent');

const MAX_BATCH = 100;

const startOfDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

// @route   POST /api/home/events
// @desc    Record home-section impressions and taps
// @access  Public
//
// Batched and fire-and-forget from the app's point of view: it always answers
// 200 so a reporting failure can never degrade the shopping session. Counters
// are upserted per section per day, so a retried batch inflates numbers rather
// than losing them — the acceptable trade for never blocking the client.
router.post('/events', async (req, res) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, MAX_BATCH) : [];
    const storeCode = String(req.body?.store_code || '').trim();

    if (events.length === 0) {
      return res.status(200).json({ success: true, recorded: 0 });
    }

    const operations = [];

    events.forEach((event) => {
      const sectionId = String(event?.section_id || '').trim();
      if (!sectionId) return;

      const impressions = Number(event.impressions) || 0;
      const clicks = Number(event.clicks) || 0;
      if (impressions <= 0 && clicks <= 0) return;

      operations.push({
        updateOne: {
          filter: {
            section_id: sectionId,
            day: startOfDay(event.day ? new Date(event.day) : new Date()),
            store_code: storeCode,
          },
          update: {
            $inc: { impressions, clicks },
            $setOnInsert: { section_type: String(event.section_type || '') },
          },
          upsert: true,
        },
      });
    });

    if (operations.length > 0) {
      await HomeSectionEvent.bulkWrite(operations, { ordered: false });
    }

    res.status(200).json({ success: true, recorded: operations.length });
  } catch (error) {
    // Deliberately not surfaced: analytics must never fail a shopping session.
    console.error('Home analytics error:', error);
    res.status(200).json({ success: true, recorded: 0 });
  }
});

module.exports = router;
