import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

/**
 * NextAuth.js v5 API route handler
 * Handles all authentication requests: /api/auth/*
 */
const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
