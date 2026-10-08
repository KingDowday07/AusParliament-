/**
 * One-off generator: parses the APH Senate/House CSVs (by default the
 * checked-in snapshot under ../snapshots, for reproducibility; pass --live
 * to fetch fresh copies) and writes a parliament seed JSON consumed by
 * packages/db/seed loading. Also used as the template for the recurring
 * packages/monitor refresh-parliament job (which calls the same
 * aphAdapter.normalize() against freshly fetched CSVs and diffs the result).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { aphAdapter, type AphRaw } from "../src/sources/aph";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(__dirname, "..", "snapshots");
const OUT_PATH = path.join(__dirname, "..", "..", "db", "seed", "parliament.generated.json");

async function loadRaw(): Promise<AphRaw> {
  if (process.argv.includes("--live")) {
    console.error("Fetching live CSVs from aph.gov.au...");
    return aphAdapter.fetchRaw();
  }
  console.error(`Reading snapshot CSVs from ${SNAPSHOT_DIR}`);
  const [senatorsCsv, membersCsv] = await Promise.all([
    readFile(path.join(SNAPSHOT_DIR, "senators_2026-10-08.csv"), "utf-8"),
    readFile(path.join(SNAPSHOT_DIR, "members_2026-10-08.csv"), "utf-8"),
  ]);
  return { senatorsCsv, membersCsv, fetchedAt: "2026-10-08T00:00:00.000Z" };
}

async function main() {
  const raw = await loadRaw();
  const normalized = aphAdapter.normalize(raw);

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(normalized, null, 2) + "\n", "utf-8");

  console.error(
    `Wrote ${normalized.entities.length} entities, ${normalized.seats.length} seats, ` +
      `${normalized.persons.length} persons, ${normalized.terms.length} terms, ` +
      `${normalized.relationships.length} relationships -> ${OUT_PATH}`,
  );
  const ministers = normalized.entities.filter((e) => e.type === "executive_office");
  console.error(`\nExtracted ${ministers.length} ministerial offices:`);
  for (const m of ministers) console.error(`  - ${m.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
