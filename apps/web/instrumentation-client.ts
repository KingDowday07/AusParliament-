// Next.js's instrumentation-client.ts convention — sentry.client.config.ts
// is deprecated and does not work at all under Turbopack (confirmed via
// node_modules/@sentry/nextjs's own deprecation warning + file matcher).
// Safe to load with no DSN set — the SDK no-ops locally rather than
// erroring (see NEXT_PUBLIC_SENTRY_DSN in .env.example).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
