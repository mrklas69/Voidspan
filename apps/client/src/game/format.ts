// Scalar formatting — AXIOM (GLOSSARY → UI Layout → Scalar).
// 2 significant digits, SI prefixes µ/m/''/k/M/G/T, bucket [0.1, 1000) pro no-prefix.
//
// Rule:
//   - Zvol prefix, aby výsledná hodnota ležela v [0.1, 1000).
//   - Zaokrouhli na 2 sig digits; pokud zaokrouhlení zvýší hodnotu ≥ 1000, bump prefix nahoru.
//   - Zachovej trailing zeros v rámci 2 sig (1.0k ne 1k).
//
// Examples:
//   45µ, 2.3m, 0.15, 12, 450, 1.5k, 1.0M, 45M

const PREFIXES = [
  { exp: 12, sym: "T", min: 1e12 },
  { exp: 9, sym: "G", min: 1e9 },
  { exp: 6, sym: "M", min: 1e6 },
  { exp: 3, sym: "k", min: 1e3 },
  { exp: 0, sym: "", min: 0.1 },
  { exp: -3, sym: "m", min: 1e-4 },
  { exp: -6, sym: "µ", min: 1e-7 },
] as const;

// Zaokrouhlí na `digits` significant digits.
function roundSig(v: number, digits: number): number {
  if (v === 0) return 0;
  const factor = Math.pow(10, digits - Math.floor(Math.log10(Math.abs(v))) - 1);
  return Math.round(v * factor) / factor;
}

// Zformátuje zaokrouhlené číslo s trailing zeros podle sig digits.
function formatRounded(v: number, digits: number): string {
  if (v === 0) return "0";
  const intDigits = Math.floor(Math.log10(Math.abs(v))) + 1;
  const decimals = Math.max(0, digits - intDigits);
  return v.toFixed(decimals);
}

export function formatScalar(value: number, digits: number = 2): string {
  if (!isFinite(value)) return "∞";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  // Najdi bucket — největší prefix, jehož min je ≤ abs.
  let idx = PREFIXES.findIndex((p) => abs >= p.min);
  if (idx === -1) return sign + "0"; // pod µ práh → efektivní 0

  let scaled = abs / Math.pow(10, PREFIXES[idx].exp);
  let rounded = roundSig(scaled, digits);

  // Zaokrouhlení mohlo hodnotu přetlačit přes 1000 (např. 999 → 1000k = bump).
  while (rounded >= 1000 && idx > 0) {
    idx -= 1;
    scaled = abs / Math.pow(10, PREFIXES[idx].exp);
    rounded = roundSig(scaled, digits);
  }

  return sign + formatRounded(rounded, digits) + PREFIXES[idx].sym;
}

// Helper pro display „current/max X" — obě hodnoty přes formatScalar + jednotka.
export function formatResource(current: number, max: number, unit: string): string {
  return `${formatScalar(current)}/${formatScalar(max)} ${unit}`;
}

// ASCII progress bar pro task queue. `width` = celkový počet znaků.
// Příklad: renderBar(50, 10) → "█████░░░░░"
// Čistá funkce bez Phaser závislostí — testovatelná solo.
export function renderBar(pct: number, width: number): string {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
