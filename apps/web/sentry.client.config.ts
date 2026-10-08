// Runs in the browser. Safe to load with no DSN set — the SDK no-ops
// locally rather than erroring, so this is harmless until a real Sentry
// project exists (see NEXT_PUBLIC_SENTRY_DSN in .env.example).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
