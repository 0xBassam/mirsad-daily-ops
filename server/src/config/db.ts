import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection attempt ${retries}/${maxRetries} failed:`, err);
      if (retries === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 2000 * retries));
    }
  }
}
