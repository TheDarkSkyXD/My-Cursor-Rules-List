import createNextIntlPlugin from "next-intl/plugin";

const isProd = process.env.NODE_ENV === "production";

const withNextIntl = createNextIntlPlugin();

const internalHost = process.env.TAURI_DEV_HOST || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable middleware
  // output: "export",
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default withNextIntl(nextConfig);
