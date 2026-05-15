/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["exceljs", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
