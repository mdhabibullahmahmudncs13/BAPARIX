import 'next-auth';
import 'next-auth/jwt';

/**
 * Extended NextAuth types for VentureOS UI
 * Adds custom user properties to session and JWT
 */
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    businessInfo?: {
      name: string;
      type: 'reseller' | 'importer' | 'sme' | 'manufacturer';
      location: string;
    };
    preferences?: {
      locale: 'bn' | 'en';
      currency: 'BDT' | 'USD' | 'CNY';
    };
    onboardingCompleted?: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    accessToken?: string;
    provider?: string;
  }
}
