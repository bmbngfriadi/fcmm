import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  basePath: '/fcmm',
  turbopack: {},
  output: 'standalone',
  productionBrowserSourceMaps: false,
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // always generate SW, even in dev, just to test (but can be disabled if needed)
  workboxOptions: {
    disableDevLogs: true,
  }
})(nextConfig);
