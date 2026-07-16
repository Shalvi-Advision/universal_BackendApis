require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/database');
const { getProjectModel } = require('../models/Project');

// Registers the known clients in the control DB. Idempotent (upserts by
// project_code) — safe to re-run. Onboard a new client by adding a row here
// or inserting directly via the admin panel later.
const PROJECTS = [
  {
    project_code: 'RET5677',
    client_name: 'Pagariya Mart',
    db_name: 'Pagariya_DB',
    status: 'active',
    config: {
      app_name: 'Pagariya Mart',
      currency: 'INR',
      primary_color: '#E53935',
      secondary_color: '#FDD835',
      min_app_version: '4.0.0',
      latest_app_version: '4.0.13',
      android_store_url: '',
      ios_store_url: '',
      force_update_message: 'A new version of the app is available. Please update to continue.',
    },
  },
  {
    project_code: 'RET9575',
    client_name: 'Grahak Peth',
    db_name: 'GrahakPeth_DB',
    status: 'active',
    config: {
      app_name: 'Grahak Peth',
      currency: 'INR',
      primary_color: '#2E7D32',
      secondary_color: '#FF8F00',
      min_app_version: '4.0.0',
      latest_app_version: '4.0.13',
      android_store_url: '',
      ios_store_url: '',
      force_update_message: 'A new version of the app is available. Please update to continue.',
    },
  },
  {
    project_code: 'RET6978',
    client_name: 'My Need Mart',
    db_name: 'MyNeedMart_DB',
    status: 'active',
    config: { app_name: 'My Need Mart', currency: 'INR' },
  },
  {
    project_code: 'RET6602',
    client_name: 'Sansar Pariwar',
    db_name: 'SansarPariwar_DB',
    status: 'active',
    config: { app_name: 'Sansar Pariwar', currency: 'INR' },
  },
];

const seed = async () => {
  await connectDB();
  const Project = getProjectModel();

  for (const project of PROJECTS) {
    const result = await Project.findOneAndUpdate(
      { project_code: project.project_code },
      { $set: project },
      { upsert: true, new: true }
    );
    console.log(`✔ ${result.project_code} → ${result.db_name} (${result.client_name})`);
  }

  const total = await Project.countDocuments();
  console.log(`\nProject registry now holds ${total} project(s).`);
  await disconnectDB();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
