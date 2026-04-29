import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export function id(): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId();
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d;
}

export function monthPeriod(monthsBack = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
