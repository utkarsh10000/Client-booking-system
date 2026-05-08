/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  serverExternalPackages: [],
  async headers() {
    return [];
  },
};

// Increase body size limit for API routes
process.env.NEXT_BODY_SIZE_LIMIT = '52428800'; // 50MB in bytes

export default nextConfig;
