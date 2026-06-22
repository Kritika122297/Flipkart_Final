// Centralized Recharts gradient defs for the chart-polish pass.
//
// Drop {ChartGradients()} (call it — see note below) inside any Recharts chart,
// then reference:
//   • Vertical bars:   fill={barFill("violet")}      // top solid → base muted
//   • Horizontal bars: fill={barFill("rose", "h")}   // left solid → right muted
//   • Area / line fill: fill={areaFill("cyan")}      // accent ~30% → transparent
//
// Duplicate ids across separate chart SVGs are harmless.

import { ACCENTS } from "./tokens.js";

const KEYS = Object.keys(ACCENTS); // violet, cyan, emerald, amber, rose

export function barFill(accent, dir = "v") {
  return `url(#bar-${dir}-${accent})`;
}
export function areaFill(accent) {
  return `url(#area-${accent})`;
}

// NOTE: render this via {ChartGradients()} (a function call) so the returned
// <defs> becomes a *direct* child element of the Recharts chart. Recharts does
// not render custom component children (<ChartGradients />) inside its SVG, which
// would leave url(#…) fills pointing at missing gradients → invisible charts.
export default function ChartGradients() {
  return (
    <defs>
      {KEYS.flatMap((k) => {
        const c = ACCENTS[k].main;
        return [
          // vertical bar: solid top → muted base
          <linearGradient key={`bv-${k}`} id={`bar-v-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={1} />
            <stop offset="100%" stopColor={c} stopOpacity={0.5} />
          </linearGradient>,
          // horizontal bar: solid left → muted right
          <linearGradient key={`bh-${k}`} id={`bar-h-${k}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c} stopOpacity={1} />
            <stop offset="100%" stopColor={c} stopOpacity={0.45} />
          </linearGradient>,
          // area/line fill: accent ~32% → transparent
          <linearGradient key={`ar-${k}`} id={`area-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.32} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </linearGradient>,
        ];
      })}
    </defs>
  );
}
