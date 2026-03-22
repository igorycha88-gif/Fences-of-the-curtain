import bcrypt from 'bcryptjs';

export const DEFAULT_COST = 10;

export async function hash(password: string, cost: number = DEFAULT_COST): Promise<string> {
  return bcrypt.hash(password, cost);
}

export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function isHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}
