import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './env';

export async function connectDB(): Promise<void> {
  let uri = env.MONGODB_URI;

  const isPlaceholder = !uri || uri.includes('username:password@cluster');

  if (isPlaceholder) {
    const { startEmbeddedMongo } = await import('../db/embeddedMongo');
    uri = await startEmbeddedMongo();
    console.log('Using embedded in-memory MongoDB (demo mode)');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB connected');

  if (isPlaceholder) {
    const { seedDemo } = await import('../db/seedDemo');
    await seedDemo();
  } else {
    console.log('Production mode — skipping demo seed. Use /auth/signup to create organizations.');
  }

  await ensureSuperAdmin();
  await disableOldDemoData();
}

async function ensureSuperAdmin(): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL;
  const pass  = env.SUPER_ADMIN_PASS;
  if (!email || !pass) return;

  const db = mongoose.connection.db!;
  const existing = await db.collection('users').findOne({ email, role: 'superadmin' });
  if (existing) return;

  const password = await bcrypt.hash(pass, 12);
  await db.collection('users').updateOne(
    { email },
    { $set: { fullName: 'Super Admin', email, password, role: 'superadmin', status: 'active', emailVerified: true, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  console.log(`Super admin created: ${email}`);
}

async function disableOldDemoData(): Promise<void> {
  const OLD_EMAILS = [
    'admin@mirsad.com', 'manager@mirsad.com', 'supervisor@mirsad.com',
    'assistant@mirsad.com', 'client@mirsad.com',
  ];
  const db = mongoose.connection.db!;
  const result = await db.collection('users').updateMany(
    { email: { $in: OLD_EMAILS } },
    { $set: { status: 'inactive', emailVerified: false, updatedAt: new Date() } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[startup] Disabled ${result.modifiedCount} old demo user(s)`);
  }
  // Suspend demo org if not already suspended
  await db.collection('organizations').updateMany(
    { slug: 'demo', status: { $ne: 'suspended' } },
    { $set: { status: 'suspended', suspendedAt: new Date(), suspendedReason: 'Legacy demo org — production SaaS launch', updatedAt: new Date() } }
  );
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
