import mongoose from 'mongoose';
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
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
