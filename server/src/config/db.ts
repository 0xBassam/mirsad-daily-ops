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
    const userCount = await mongoose.connection.db!.collection('users').countDocuments();
    if (userCount === 0) {
      console.log('Empty database detected — running auto-seed...');
      const { seedLive } = await import('../db/seedLive');
      await seedLive();
    }
  }

  await ensureSuperAdmin();
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
    { $set: { fullName: 'Super Admin', email, password, role: 'superadmin', status: 'active', updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  console.log(`Super admin created: ${email}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
