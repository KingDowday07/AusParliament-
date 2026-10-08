/**
 * Enriches Person records with real photoUrl values by querying Wikipedia's
 * REST summary API by name. Run after generate-parliament-seed.ts (operates
 * on its output) and directly patches core-government.json's small
 * hand-authored person list. Idempotent — safe to re-run; skips persons
 * that already have a photoUrl so re-runs are fast and don't hammer the API.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Person } from "@au-graph/data-model";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_SEED_DIR = path.join(__dirname, "..", "..", "db", "seed");

const USER_AGENT =
  "au-parliament-graph/0.1 (https://github.com/KingDowday07/AusParliament-; personal research project)";

async function fetchSummary(title: string): Promise<{ thumbnail?: { source?: string }; type?: string } | null> {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ thumbnail?: { source?: string }; type?: string }>;
}

/** Resolves a name to its most likely "Australian politician" Wikipedia
 * page title via full-text search — used when the direct title hits a
 * disambiguation page (common for ordinary names like "James Paterson"). */
async function searchForTitle(name: string): Promise<string | null> {
  const query = encodeURIComponent(`${name} Australian politician`);
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&srlimit=1`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { query?: { search?: { title: string }[] } };
  return json.query?.search?.[0]?.title ?? null;
}

async function lookupPhoto(name: string): Promise<string | null> {
  const direct = await fetchSummary(name.replace(/ /g, "_"));
  if (direct && direct.type !== "disambiguation" && direct.thumbnail?.source) {
    return direct.thumbnail.source;
  }

  // Direct title missed, hit a disambiguation page, or had no infobox image
  // — try resolving via search before giving up (genuinely no free photo
  // exists for some backbenchers/justices, which is a real Wikipedia gap,
  // not a bug here).
  const resolvedTitle = await searchForTitle(name);
  if (!resolvedTitle) return null;
  const resolved = await fetchSummary(resolvedTitle);
  if (resolved && resolved.type !== "disambiguation" && resolved.thumbnail?.source) {
    return resolved.thumbnail.source;
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichPersons(persons: Person[], label: string): Promise<{ persons: Person[]; found: number }> {
  let found = 0;
  const CONCURRENCY = 6;
  const queue = [...persons];
  const results: Person[] = [];

  async function worker() {
    while (queue.length) {
      const person = queue.shift();
      if (!person) break;
      if (person.photoUrl) {
        results.push(person);
        continue;
      }
      try {
        const photoUrl = await lookupPhoto(person.name);
        if (photoUrl) {
          found++;
          results.push({ ...person, photoUrl });
        } else {
          results.push(person);
        }
      } catch {
        results.push(person);
      }
      await sleep(80);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.error(`${label}: found photos for ${found}/${persons.length}`);
  // Restore original order (workers complete out of order).
  const byId = new Map(results.map((p) => [p.id, p]));
  return { persons: persons.map((p) => byId.get(p.id)!), found };
}

async function main() {
  const parliamentPath = path.join(DB_SEED_DIR, "parliament.generated.json");
  const corePath = path.join(DB_SEED_DIR, "core-government.json");

  const parliament = JSON.parse(await readFile(parliamentPath, "utf-8"));
  const core = JSON.parse(await readFile(corePath, "utf-8"));

  const { persons: enrichedParliament } = await enrichPersons(parliament.persons, "parliament.generated.json");
  parliament.persons = enrichedParliament;
  await writeFile(parliamentPath, JSON.stringify(parliament, null, 2) + "\n", "utf-8");

  const { persons: enrichedCore } = await enrichPersons(core.persons, "core-government.json");
  core.persons = enrichedCore;
  await writeFile(corePath, JSON.stringify(core, null, 2) + "\n", "utf-8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
