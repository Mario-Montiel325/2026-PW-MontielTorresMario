const MINI_SERVIDOR_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:4000';

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.20.16'],
  async rewrites() {
    return [
      { source: '/mini/:path*', destination: `${MINI_SERVIDOR_URL}/:path*` },
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
    ];
  },
};
