import { BRANCH_COLOR } from "@/lib/entity-icon-map";

/** One radial gradient per branch color (lighter center → branch color
 * edge), referenced by nodes as `url(#node-grad-${branch})` for a subtle
 * glossy/3D look instead of flat fills. Shared <defs> so each node doesn't
 * redeclare its own gradient. */
export function NodeGradientDefs() {
  return (
    <defs>
      {Object.entries(BRANCH_COLOR).map(([branch, color]) => (
        <radialGradient key={branch} id={`node-grad-${branch}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={lighten(color)} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      ))}
    </defs>
  );
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 70);
  const g = Math.min(255, ((n >> 8) & 0xff) + 70);
  const b = Math.min(255, (n & 0xff) + 70);
  return `rgb(${r}, ${g}, ${b})`;
}

export function nodeGradientUrl(branch: string): string {
  return `url(#node-grad-${branch})`;
}
