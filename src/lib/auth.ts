import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@prisma/client';
import { compare } from '@/lib/password';
import { checkRateLimit, resetRateLimit, maskEmail } from './rate-limit';
import logger from './logger';

const PLACEHOLDER_VALUES = [
  'your-super-secret-key-change-in-production',
  'change-in-production',
  'your-super-secret',
  'secret',
  'test',
  'dev',
  'replace_with_real_secret',
];

function validateNextAuthSecret() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is not defined. Generate one with: openssl rand -base64 32'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'NEXTAUTH_SECRET must be at least 32 characters long. ' +
        `Current length: ${secret.length}. Generate with: openssl rand -base64 32`
    );
  }

  for (const placeholder of PLACEHOLDER_VALUES) {
    if (secret.toLowerCase().includes(placeholder)) {
      throw new Error(
        `NEXTAUTH_SECRET contains placeholder "${placeholder}". ` +
          'Generate a real secret with: openssl rand -base64 32'
      );
    }
  }
}

function extractIP(req: any): string {
  if (!req) return 'unknown';

  const forwarded = req.headers?.get?.('x-forwarded-for') || req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers?.get?.('x-real-ip') || req.headers?.['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

let _authOptions: NextAuthOptions | null = null;

function getAuthOptions(): NextAuthOptions {
  if (!_authOptions) {
    validateNextAuthSecret();
    _authOptions = {
      providers: [
        CredentialsProvider({
          name: 'Credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          async authorize(credentials, req) {
            const authLogger = logger.withContext({ module: 'auth', operation: 'authorize' });

            if (!credentials?.email || !credentials?.password) {
              authLogger.warn('[AUTH] Missing credentials');
              return null;
            }

            const ip = extractIP(req);
            let allowed = true;
            try {
              allowed = await checkRateLimit(ip, credentials.email);
            } catch (rateLimitError) {
              authLogger.error('[AUTH] Rate limit check failed, allowing login attempt', {
                ip,
                email: maskEmail(credentials.email),
                error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error',
              });
              allowed = true;
            }

            if (!allowed) {
              authLogger.warn('[AUTH] Rate limit exceeded', {
                ip,
                email: maskEmail(credentials.email),
              });
              return null;
            }

            authLogger.info('[AUTH] Login attempt: user lookup', {
              ip,
              email: maskEmail(credentials.email),
            });

            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (!user || !user.active) {
              authLogger.warn('[AUTH] User not found or inactive', {
                ip,
                email: maskEmail(credentials.email),
              });
              return null;
            }

            const passwordMatch = await compare(credentials.password, user.password);

            authLogger.info('[AUTH] Password verification: completed');

            if (!passwordMatch) {
              authLogger.warn('[AUTH] Invalid password', {
                ip,
                email: maskEmail(credentials.email),
              });
              return null;
            }

            try {
              await resetRateLimit(ip, credentials.email);
            } catch (resetError) {
              authLogger.error('[AUTH] Failed to reset rate limit after successful login', {
                ip,
                email: maskEmail(credentials.email),
                error: resetError instanceof Error ? resetError.message : 'Unknown error',
              });
            }

            authLogger.info('[AUTH] User authorized: success', {
              ip,
              email: maskEmail(credentials.email),
              userId: user.id,
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          },
        }),
      ],
      callbacks: {
        async jwt({ token, user }: any) {
          if (user) {
            token.id = user.id;
            token.role = user.role;
            logger.info('[AUTH JWT] Token created', {
              module: 'auth',
              operation: 'jwt',
              role: user.role,
            });
          }
          return token;
        },
        async session({ session, token }: any) {
          if (session.user && token) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;
            logger.info('[AUTH SESSION] Session created', {
              module: 'auth',
              operation: 'session',
              role: session.user.role,
            });
          }
          return session;
        },
      },
      pages: {
        signIn: '/admin/login',
      },
      session: {
        strategy: 'jwt',
      },
      secret: process.env.NEXTAUTH_SECRET,
    };
  }
  return _authOptions;
}

export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get(_, prop) {
    return getAuthOptions()[prop as keyof NextAuthOptions];
  },
});
