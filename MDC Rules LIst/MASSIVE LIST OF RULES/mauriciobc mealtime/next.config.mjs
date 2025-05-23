/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,
  images: {
    domains: ['localhost', 'mealtime.local', 'zzvmyzyszsqptgyqwqwt.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    },
    serverSourceMaps: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.devtool = dev ? 'eval-source-map' : 'source-map';
      
      config.output = {
        ...config.output,
        devtoolModuleFilenameTemplate: (info) =>
          `webpack:///${info.resourcePath}?${info.loaders}`,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    }
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob: https://*.supabase.co https://accounts.google.com https://*.googleusercontent.com https://api.dicebear.com https://placekitten.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/profiles/cats/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Vary', value: 'Accept' }
        ],
      },
    ]
  },
}

export default nextConfig
