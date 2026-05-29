import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable modern image formats for smaller file sizes
    formats: ['image/avif', 'image/webp'],
    // Define allowed remote image domains for next/image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.alibaba.com',
      },
      {
        protocol: 'https',
        hostname: '**.dhgate.com',
      },
      {
        protocol: 'https',
        hostname: '**.aliexpress.com',
      },
    ],
    // Device sizes for responsive srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for layout-specific srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withNextIntl(nextConfig);
