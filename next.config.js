/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimization settings
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },

  // Environment variable validation
  env: {
    // Only include environment variables that actually exist
    ...(process.env.CUSTOM_KEY && { CUSTOM_KEY: process.env.CUSTOM_KEY }),
  },

  // Build optimization
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
  },

  // Webpack configuration for production
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      }

      // Bundle analyzer in production builds
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-analyzer-report.html',
          })
        )
      }
    }

    return config
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/status',
        destination: '/api/status',
      },
    ]
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://triangleintelligence.com/:path*',
          permanent: true,
        },
      ]
    }
    return []
  },

  // TypeScript configuration
  typescript: {
    // Type checking happens in CI/CD pipeline
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint runs in CI/CD pipeline - ignore during builds for now
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig