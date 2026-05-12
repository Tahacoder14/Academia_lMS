/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security Headers Configuration
  async headers() {
    return[
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers:[
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        // Apply specific caching rules to API routes
        source: "/api/:path*",
        headers:[
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;