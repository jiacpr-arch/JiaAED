import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Scope file tracing to this project only (prevents crawling parent dirs)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
