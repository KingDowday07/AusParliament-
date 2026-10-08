/**
 * Common shape every source adapter follows: fetch raw bytes/text from the
 * authoritative source, normalize into our data-model shapes, then stage
 * (write to the DB staging area / seed file). Keeping fetch/normalize split
 * lets tests exercise normalize() against fixture text without network
 * access, and lets `packages/monitor` reuse normalize() for diffing.
 */
export interface IngestAdapter<TRaw, TNormalized> {
  name: string;
  sourceUrl: string;
  license?: string;
  fetchRaw(): Promise<TRaw>;
  normalize(raw: TRaw): TNormalized;
}
