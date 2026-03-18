import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@prisma/client';
import { compare } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        console.log('[AUTH] Looking up user:', credentials.email);

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) {
          console.log('[AUTH] User not found or inactive');
          return null;
        }

        const passwordMatch = await compare(credentials.password, user.password);

        console.log('[AUTH] Password match:', passwordMatch);

        if (!passwordMatch) {
          console.log('[AUTH] Invalid password');
          return null;
        }

        console.log('[AUTH] User authorized:', user.email);

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
        console.log('[AUTH JWT] Token created for user:', user.email, 'with role:', user.role);
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        console.log('[AUTH SESSION] Session created for user:', session.user.email, 'with role:', session.user.role);
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
};
