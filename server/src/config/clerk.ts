import { verifyToken as clerkVerifyToken } from '@clerk/express';
import { env } from './env';

export async function verifyToken(token: string) {
  return clerkVerifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
}
