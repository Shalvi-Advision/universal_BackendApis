require('dotenv').config();

const mongoose = require('mongoose');

const { connectDB, disconnectDB, getTenantDb, DEFAULT_DB_NAME } = require('../config/database');
const { getProjectModel } = require('../models/Project');

// Registers the User schema in the tenant schema registry so compileModels()
// can build it on each tenant connection. Without this require the sweep finds
// no User model on any DB.
require('../models/User');

// Bulk-set the admin-panel password for every account with role 'admin'.
//
// Admin identities live in the default (admin home) DB, but historically some
// were created inside individual tenant DBs, so this sweeps the default DB plus
// every DB named in the control registry.
//
// Idempotent: re-running just re-hashes the same password. Assignment goes
// through doc.save() so the User pre-save hook does the bcrypt hashing — never
// write a plaintext password with updateOne().
//
//   node scripts/set_admin_passwords.js
//   node scripts/set_admin_passwords.js 'SomeOther@Pass1'
//   node scripts/set_admin_passwords.js 'SomeOther@Pass1' --only-missing
//   node scripts/set_admin_passwords.js --dry-run
//   node scripts/set_admin_passwords.js --scan-all   # ignore registry, sweep every DB

const DEFAULT_PASSWORD = 'Qwerty@1234';

// DBs that never hold tenant users.
const SYSTEM_DBS = new Set(['admin', 'local', 'config']);

// Every DB on the cluster that has a users collection. Used when the control
// registry is empty (or --scan-all is passed) — admin accounts predate the
// registry in several deployments, so registry-only sweeps miss them.
const discoverDbsWithUsers = async () => {
  const client = mongoose.connection.getClient();
  const found = [];

  let databases;
  try {
    ({ databases } = await client.db().admin().listDatabases());
  } catch (error) {
    // A least-privilege deployment user often cannot list databases. Not fatal:
    // the caller still has the registry, the default DB and --dbs.
    console.warn(
      `Cannot enumerate databases (${error.message}). ` +
      'Pass --dbs=name1,name2 to sweep specific databases.'
    );
    return found;
  }

  for (const { name } of databases) {
    if (SYSTEM_DBS.has(name)) continue;
    try {
      const collections = await client.db(name).listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        found.push(name);
      }
    } catch (error) {
      console.warn(`Skipping ${name}: ${error.message}`);
    }
  }

  return found;
};

const run = async () => {
  const password = process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : DEFAULT_PASSWORD;
  const onlyMissing = process.argv.includes('--only-missing');
  const dryRun = process.argv.includes('--dry-run');
  const scanAll = process.argv.includes('--scan-all');

  // --dbs=Foo_DB,Bar_DB — explicit list, for clusters where the app user
  // cannot enumerate databases.
  const dbsArg = process.argv.find((a) => a.startsWith('--dbs='));
  const explicitDbs = dbsArg
    ? dbsArg.slice('--dbs='.length).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  await connectDB();

  // Collect the DBs to sweep: the admin home DB + every registered tenant DB.
  const dbNames = new Set([DEFAULT_DB_NAME, ...explicitDbs]);
  let registryCount = 0;

  if (!scanAll) {
    try {
      const Project = getProjectModel();
      const projects = await Project.find({}).select('project_code db_name').lean();
      registryCount = projects.length;
      projects.forEach((p) => p.db_name && dbNames.add(p.db_name));
      console.log(`Registry lists ${projects.length} project(s).`);
    } catch (error) {
      console.warn(`Could not read project registry (${error.message}).`);
    }
  }

  if (scanAll || registryCount === 0) {
    const discovered = await discoverDbsWithUsers();
    discovered.forEach((name) => dbNames.add(name));
    console.log(
      scanAll
        ? `--scan-all: discovered ${discovered.length} DB(s) with a users collection.`
        : `Registry empty — falling back to scanning all ${discovered.length} DB(s) with a users collection.`
    );
  }

  console.log(`Password target: "${password}"${dryRun ? ' (DRY RUN — nothing will be written)' : ''}`);
  console.log(`Databases to sweep: ${[...dbNames].join(', ')}\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const dbName of dbNames) {
    let User;
    try {
      const connection = getTenantDb(dbName);
      User = connection.models.User;
    } catch (error) {
      console.warn(`[${dbName}] could not open: ${error.message}`);
      continue;
    }

    if (!User) {
      console.warn(`[${dbName}] User model not compiled — skipping.`);
      continue;
    }

    const admins = await User.find({ role: 'admin' }).select('+password');

    if (admins.length === 0) {
      console.log(`[${dbName}] no admin users.`);
      continue;
    }

    for (const admin of admins) {
      const label = `[${dbName}] ${admin.mobile || '(no mobile)'} (${admin.name || 'unnamed'})`;

      if (onlyMissing && admin.password) {
        totalSkipped += 1;
        console.log(`${label} — already has a password, skipped.`);
        continue;
      }

      if (dryRun) {
        totalUpdated += 1;
        console.log(`${label} — would set password.`);
        continue;
      }

      admin.password = password; // hashed by the pre-save hook
      if (!admin.isVerified) {
        admin.isVerified = true;
      }

      // A legacy admin doc can fail schema validation on unrelated fields
      // (e.g. a missing mobile). Report it and keep going rather than
      // aborting the sweep partway through.
      try {
        await admin.save();
        totalUpdated += 1;
        console.log(`${label} — password set.`);
      } catch (error) {
        totalFailed += 1;
        console.error(`${label} — FAILED: ${error.message}`);
      }
    }
  }

  console.log(
    `\nDone. ${totalUpdated} admin password(s) ${dryRun ? 'would be set' : 'set'}, ` +
    `${totalSkipped} skipped, ${totalFailed} failed.`
  );
  await disconnectDB();
};

run().catch((error) => {
  console.error('Failed to set admin passwords:', error);
  process.exit(1);
});
