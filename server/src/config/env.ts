import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().default('mongodb+srv://username:password@cluster.mongodb.net/mirsad'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  // Optional SMTP — if unset, email sending is silently skipped
  SMTP_HOST:       z.string().optional(),
  SMTP_PORT:       z.string().optional(),
  SMTP_USER:       z.string().optional(),
  SMTP_PASS:       z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME:  z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
