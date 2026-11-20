import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this project so it doesn't get
  // confused by lockfiles further up the filesystem.
  turbopack: {
    root: path.resolve(),
  },
  experimental: {
    serverActions: {
      // A Goodreads export of a few hundred books with reviews runs past the
      // 1MB a server action takes by default, and the reader gets a crash
      // instead of their library. The import form refuses anything larger
      // than this before it is sent.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
