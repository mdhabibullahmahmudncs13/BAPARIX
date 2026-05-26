import { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth.js configuration for VentureOS UI
 * Supports email/password, Google OAuth, and phone OTP authentication
 * 
 * Requirements:
 * - 11.1: Display authentication options for email, Google, and phone OTP
 * - 11.2: Authenticate and redirect to Dashboard within 1 second
 * - 11.7: Preserve intended destination on session expiry
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Email/Password provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Call backend API for authentication
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid credentials');
          }

          const data = await response.json();
          
          // Return user object that will be stored in JWT
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
            businessInfo: data.user.businessInfo,
            preferences: data.user.preferences,
            onboardingCompleted: data.user.onboardingCompleted,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),

    // Phone OTP provider (using credentials provider)
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error('Phone number and OTP are required');
        }

        try {
          // Call backend API for OTP verification
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: credentials.phone,
                otp: credentials.otp,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid OTP');
          }

          const data = await response.json();
          
          // Return user object that will be stored in JWT
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
            businessInfo: data.user.businessInfo,
            preferences: data.user.preferences,
            onboardingCompleted: data.user.onboardingCompleted,
          };
        } catch (error) {
          console.error('OTP verification error:', error);
          throw error;
        }
      },
    }),
  ],

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - store user data in token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.phone = user.phone;
        token.businessInfo = user.businessInfo;
        token.preferences = user.preferences;
        token.onboardingCompleted = user.onboardingCompleted;
      }

      // OAuth sign in - store access token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // Handle session updates (e.g., profile changes)
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      // Populate session with user data from token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.phone = token.phone as string | undefined;
        session.user.businessInfo = token.businessInfo as any;
        session.user.preferences = token.preferences as any;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean | undefined;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle callbackUrl parameter for preserving intended destination (Requirement 11.7)
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },

    async signIn({ user, account, profile }) {
      // Allow sign in for all providers
      // Additional validation can be added here if needed
      return true;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};
