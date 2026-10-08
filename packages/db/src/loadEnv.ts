import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolved relative to this file rather than cwd, so it works the same
// whether a script is run via `npm run --workspace=packages/db ...` from
// the repo root or directly from inside the package directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..", "..");

config({ path: path.join(REPO_ROOT, ".env.local") });
config({ path: path.join(REPO_ROOT, ".env") });
