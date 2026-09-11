import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Prevent `next dev` from appending its own agent-rules block to CLAUDE.md.
  agentRules: false,
};

export default nextConfig;
