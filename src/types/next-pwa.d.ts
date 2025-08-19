declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    cleanupOutdatedCaches?: boolean;
    clientsClaim?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp;
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        cacheableResponse?: {
          statuses?: number[];
        };
      };
    }>;
  }
  
  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export = withPWA;
}
