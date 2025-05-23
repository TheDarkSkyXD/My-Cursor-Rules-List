/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tldraw/tldraw"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    largePageDataBytes: 10 * 1024 * 1024,
  },
  // Temporarily disable image optimization during development
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
