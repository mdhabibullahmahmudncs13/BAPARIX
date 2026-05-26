import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

/**
 * NextAuth.js API route handler
 * Handles all authentication requests: /api/auth/*
 */
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
