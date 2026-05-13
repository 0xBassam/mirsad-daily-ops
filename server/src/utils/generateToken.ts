import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function generateToken(payload: { userId: string; role: string; email: string; organizationId: string | null; plan: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}
