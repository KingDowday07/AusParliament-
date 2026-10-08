import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@au-graph/data-model", "@au-graph/db"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Wrapping is safe with no Sentry project yet — source-map upload (the only
// part that needs org/project/authToken) only runs when SENTRY_AUTH_TOKEN
// is set, which it isn't until a real Sentry project exists.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: false,
});
