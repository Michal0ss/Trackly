import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [{ source: "/nowa", destination: "/", permanent: true }];
  },
};

export default nextConfig;
