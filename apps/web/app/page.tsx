import { loadSeed } from "@au-graph/db";
import { PowerMapApp } from "@/components/PowerMapApp";

export default async function Home() {
  const data = await loadSeed();
  return <PowerMapApp data={data} />;
}
