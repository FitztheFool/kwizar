/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: [],
  },
  async redirects() {
    return [
      {
        source: '/profil/:username',
        destination: '/user/:username',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
