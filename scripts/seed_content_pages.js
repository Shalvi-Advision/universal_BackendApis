require('dotenv').config();

const { connectDB, disconnectDB, getTenantDb } = require('../config/database');
const { getProjectModel } = require('../models/Project');
// Registers the ContentPage schema so getTenantDb() compiles it per tenant DB.
require('../models/ContentPage');

// Default pages seeded per tenant. Idempotent: only inserts missing slugs,
// never overwrites content that was already edited for a client.
const buildDefaultPages = (clientName) => [
  {
    slug: 'about-us',
    title: 'About Us',
    html: `<h2>About ${clientName}</h2><p>${clientName} brings your neighbourhood store online — fresh groceries and daily essentials delivered to your doorstep.</p>`,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    html: `<h2>Privacy Policy</h2><p>${clientName} collects only the information needed to process your orders: your mobile number, delivery addresses, and order history. We never sell your personal data to third parties. Payment processing is handled securely by Razorpay; we do not store card details. For any privacy questions or data deletion requests, contact us through the Support section of the app.</p>`,
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    html: `<h2>Terms &amp; Conditions</h2><p>By using the ${clientName} app you agree to provide accurate delivery information and to pay for orders placed through your account. Prices and product availability are confirmed at checkout and may vary by store. Orders can be cancelled from the Orders screen while they are still being confirmed.</p>`,
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    html: `<h2>Refund Policy</h2><p>If an item arrives damaged, expired, or is missing from your order, contact support within 48 hours of delivery and we will refund or replace it. Refunds for online payments are returned to the original payment method within 5–7 working days.</p>`,
  },
  {
    slug: 'faq',
    title: 'FAQ',
    html: `<h2>Frequently Asked Questions</h2><p><strong>How do I place an order?</strong><br/>Select your pincode, choose a store, add items to your cart and check out.</p><p><strong>What payment methods are accepted?</strong><br/>Cash on delivery and online payment via Razorpay (UPI, cards, netbanking).</p><p><strong>How do I cancel an order?</strong><br/>Open the order in the Orders screen and tap Cancel while the order is still being confirmed.</p>`,
  },
];

const seed = async () => {
  await connectDB();
  const projects = await getProjectModel().find({ status: 'active' }).lean();

  for (const project of projects) {
    const db = getTenantDb(project.db_name);
    const ContentPage = db.models.ContentPage;
    let inserted = 0;

    for (const page of buildDefaultPages(project.client_name)) {
      const result = await ContentPage.updateOne(
        { slug: page.slug },
        { $setOnInsert: page },
        { upsert: true }
      );
      if (result.upsertedCount) inserted += 1;
    }

    const total = await ContentPage.countDocuments();
    console.log(`✔ ${project.project_code} (${project.db_name}): +${inserted} inserted, ${total} total content page(s)`);
  }

  await disconnectDB();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
