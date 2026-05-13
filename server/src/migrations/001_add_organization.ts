/**
 * Migration 001 — Add Organization to all collections
 *
 * Phase 1 safety guarantee:
 *   - organization field is OPTIONAL on all models
 *   - This script backfills ALL existing documents with a single "legacy" org
 *   - It is idempotent: docs that already have organization are skipped
 *   - Run BEFORE Phase 2 enforcement
 *
 * Usage:
 *   npx ts-node -e "require('./src/migrations/001_add_organization').runMigration()"
 *   or via: npm run migrate:001
 *
 * Dry-run mode (no writes):
 *   DRY_RUN=true npx ts-node ...
 */

import mongoose from 'mongoose';

const DRY_RUN = process.env.DRY_RUN === 'true';

const LEGACY_ORG = {
  name:    'Demo Organization',
  slug:    'demo',
  plan:    'enterprise' as const,
  status:  'active' as const,
  maxUsers: 999,
  maxProjects: 99,
  storageLimitMb: 102400,
  settings: {},
  featureFlags: new Map<string, boolean>([
    ['dailyPlans', true], ['floorChecks', true], ['inventory', true],
    ['purchaseOrders', true], ['suppliers', true], ['batches', true],
    ['transfers', true], ['receiving', true], ['maintenance', true],
    ['clientRequests', true], ['fridgeChecks', true], ['correctiveActions', true],
    ['advancedReports', true], ['export', true], ['whiteLabel', false],
  ]),
};

const TIER_A_COLLECTIONS = [
  'users',
  'projects',
  'buildings',
  'floors',
  'items',
  'itemcategories',
  'suppliers',
  'batches',
  'inventorybalances',
  'stockmovements',
  'dailyplans',
  'floorChecks',
  'purchaseorders',
  'receivings',
  'transfers',
  'spoilages',
  'maintenancerequests',
  'clientrequests',
  'correctiveactions',
  'fridgechecks',
  'menus',
  'reports',
  'auditlogs',
  'approvalrecords',
  'attachments',
];

const TIER_B_COLLECTIONS = [
  { name: 'dailyplanlines', parentCollection: 'dailyplans', parentField: 'dailyPlan' },
  { name: 'floorchecklines', parentCollection: 'floorChecks', parentField: 'floorCheck' },
];

export async function runMigration(mongoUri?: string): Promise<void> {
  const uri = mongoUri || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  const shouldConnect = mongoose.connection.readyState === 0;
  if (shouldConnect) {
    await mongoose.connect(uri);
    console.log('[Migration 001] Connected to MongoDB');
  }

  const db = mongoose.connection.db!;
  const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

  console.log(`[Migration 001] DRY_RUN=${DRY_RUN}`);

  // ── Step 1: Ensure Organization document exists ─────────────────────────────
  let orgId: mongoose.Types.ObjectId;

  const existingOrg = await db.collection('organizations').findOne({ slug: LEGACY_ORG.slug });
  if (existingOrg) {
    orgId = existingOrg._id as mongoose.Types.ObjectId;
    console.log(`[Migration 001] Using existing org: ${orgId} (${existingOrg.name})`);
  } else {
    orgId = new mongoose.Types.ObjectId();
    const now = new Date();
    if (!DRY_RUN) {
      await db.collection('organizations').insertOne({
        _id:            orgId,
        ...LEGACY_ORG,
        featureFlags:   Object.fromEntries(LEGACY_ORG.featureFlags),
        createdAt:      now,
        updatedAt:      now,
      });
      console.log(`[Migration 001] Created legacy org: ${orgId}`);
    } else {
      console.log(`[Migration 001] [DRY] Would create legacy org: ${orgId}`);
    }
  }

  // ── Step 2: Backfill Tier A collections ─────────────────────────────────────
  let totalUpdated = 0;

  for (const collectionName of TIER_A_COLLECTIONS) {
    if (!existingCollections.includes(collectionName)) {
      console.log(`[Migration 001] Skipping ${collectionName} (collection does not exist)`);
      continue;
    }

    const collection = db.collection(collectionName);
    const missingCount = await collection.countDocuments({ organization: { $exists: false } });

    if (missingCount === 0) {
      console.log(`[Migration 001] ${collectionName}: already fully backfilled`);
      continue;
    }

    console.log(`[Migration 001] ${collectionName}: ${missingCount} docs to backfill`);

    if (!DRY_RUN) {
      const result = await collection.updateMany(
        { organization: { $exists: false } },
        { $set: { organization: orgId } }
      );
      console.log(`[Migration 001] ${collectionName}: updated ${result.modifiedCount} docs`);
      totalUpdated += result.modifiedCount;
    } else {
      console.log(`[Migration 001] [DRY] ${collectionName}: would update ${missingCount} docs`);
      totalUpdated += missingCount;
    }
  }

  // ── Step 3: Backfill Tier B collections (denormalized via parent join) ───────
  for (const tierB of TIER_B_COLLECTIONS) {
    if (!existingCollections.includes(tierB.name)) {
      console.log(`[Migration 001] Skipping ${tierB.name} (collection does not exist)`);
      continue;
    }

    const childCollection  = db.collection(tierB.name);
    const parentCollection = db.collection(tierB.parentCollection);

    const missingCount = await childCollection.countDocuments({ organization: { $exists: false } });
    if (missingCount === 0) {
      console.log(`[Migration 001] ${tierB.name}: already fully backfilled`);
      continue;
    }

    console.log(`[Migration 001] ${tierB.name}: ${missingCount} docs to backfill via parent join`);

    if (!DRY_RUN) {
      // Fetch all parents that have organization set
      const parents = await parentCollection
        .find({ organization: { $exists: true } }, { projection: { _id: 1, organization: 1 } })
        .toArray();

      let childUpdated = 0;
      for (const parent of parents) {
        const result = await childCollection.updateMany(
          { [tierB.parentField]: parent._id, organization: { $exists: false } },
          { $set: { organization: parent.organization } }
        );
        childUpdated += result.modifiedCount;
      }

      // Any remaining orphan children get the legacy org directly
      const orphanResult = await childCollection.updateMany(
        { organization: { $exists: false } },
        { $set: { organization: orgId } }
      );
      childUpdated += orphanResult.modifiedCount;

      console.log(`[Migration 001] ${tierB.name}: updated ${childUpdated} docs`);
      totalUpdated += childUpdated;
    } else {
      console.log(`[Migration 001] [DRY] ${tierB.name}: would update ${missingCount} docs`);
      totalUpdated += missingCount;
    }
  }

  // ── Step 4: Migrate SystemSettings → Organization.settings ──────────────────
  if (existingCollections.includes('systemsettings')) {
    const systemSettings = await db.collection('systemsettings').findOne({});
    if (systemSettings) {
      const orgSettings = {
        emailProvider:          systemSettings.emailProvider,
        resendApiKey:           systemSettings.resendApiKey    || '',
        resendFromEmail:        systemSettings.resendFromEmail || '',
        resendFromName:         systemSettings.resendFromName  || 'Mirsad',
        smtpHost:               systemSettings.smtpHost        || '',
        smtpPort:               systemSettings.smtpPort        || 587,
        smtpUser:               systemSettings.smtpUser        || '',
        smtpPass:               systemSettings.smtpPass        || '',
        smtpFromEmail:          systemSettings.smtpFromEmail   || '',
        smtpFromName:           systemSettings.smtpFromName    || 'Mirsad',
        smtpTls:                systemSettings.smtpTls         || false,
        notificationRecipients: systemSettings.notificationRecipients || [],
        emailAlerts:            systemSettings.emailAlerts     || {},
        logoUrl:                systemSettings.clientLogoUrl   || '',
        siteName:               systemSettings.clientSiteName  || '',
        department:             systemSettings.clientDepartment || '',
      };

      if (!DRY_RUN) {
        await db.collection('organizations').updateOne(
          { _id: orgId },
          { $set: { settings: orgSettings } }
        );
        console.log('[Migration 001] Migrated SystemSettings → Organization.settings');
      } else {
        console.log('[Migration 001] [DRY] Would migrate SystemSettings → Organization.settings');
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n[Migration 001] Complete. Total docs ${DRY_RUN ? 'would be updated' : 'updated'}: ${totalUpdated}`);
  console.log(`[Migration 001] Organization ID: ${orgId}`);

  if (shouldConnect) {
    await mongoose.disconnect();
  }
}

// Run directly: ts-node src/migrations/001_add_organization.ts
if (require.main === module) {
  import('dotenv').then(dotenv => {
    dotenv.config();
    runMigration().catch(err => {
      console.error('[Migration 001] FAILED:', err);
      process.exit(1);
    });
  });
}
