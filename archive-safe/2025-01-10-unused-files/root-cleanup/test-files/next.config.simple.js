/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for debugging build issues
  compress: false,
  poweredByHeader: false,
  
  // Disable experimental optimizations
  experimental: {},
  
  // Basic webpack config
  webpack: (config, { dev }) => {
    // Disable problematic optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true
          }
        }
      };
    }
    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig;