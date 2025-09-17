module.exports = {
  // Prevent aggressive cleaning
  generateBuildId: () => 'build-id',

  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Add runtime configuration check
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Supabase-Configured',
            value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'true' : 'false'
          }
        ]
      }
    ]
  }
}
