module.exports = {
  // Prevent aggressive cleaning
  generateBuildId: () => 'build-id',

  // Disable ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during builds (speeds up build significantly)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // API route configuration
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size to prevent DoS attacks
    },
  },

  // Security and CORS headers
  async headers() {
    return [
      // API CORS configuration
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      // General security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-Supabase-Configured',
            value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'true' : 'false'
          }
        ]
      }
    ]
  },

  // Redirect old broken URLs to correct paths
  async redirects() {
    return [
      {
        source: '/account-settings',
        destination: '/account/settings',
        permanent: true
      },
      // ARCHIVED ADMIN ROUTES - Redirect to homepage (consulting services disabled for SMB SaaS launch)
      // To restore: Remove these redirects and move archived-admin/* back to original locations
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false // Non-permanent to easily restore later
      }
    ]
  }
}
