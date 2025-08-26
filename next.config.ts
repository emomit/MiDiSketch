import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-static-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/image\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/data\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\/(?!_next\/).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-page-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
})({
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/UnUsed/**']
    };
    return config;
  },
  experimental: {
    optimizePackageImports: ['react', 'react-dom']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co" },
        ],
      },
    ];
  },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } as Partial<NextConfig> : {})
});

export default nextConfig;
