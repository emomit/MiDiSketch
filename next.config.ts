import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 開発優先のため、ビルド時のESLintエラーで失敗させない
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/UnUsed/**']
    };
    return config;
  },
  // キャッシュの安定性を向上
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
};

export default nextConfig;
