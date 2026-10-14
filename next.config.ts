import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // the old site's research page was the Melody Diffuser write-up
    return [{ source: "/research", destination: "/melody-diffuser/write-up", permanent: true }];
  },
};

export default nextConfig;
