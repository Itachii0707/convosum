import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the multi-stage Docker image (copies only what's needed)
  output: "standalone",

  // Allow images from HuggingFace & other common ML CDNs if needed later
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "huggingface.co",
      },
    ],
  },
};

export default nextConfig;
