// Random helpery (interní k world/). Math.random; deterministický seed je P2+.

export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  // inkluzivní min i max
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// Poisson rozdělení (Knuthův algoritmus). Modeluje počet náhodných událostí
// za jednotku času (např. průměrně 3 asteroid captures za hodinu, konkrétně
// 0–5 ks). `lam` = lambda (střední hodnota za jednotku). `maxYield` = clamp
// horní hranice (brání extreme outliers).
//
// Port z PocketStory (backend/sim/engine.py). Jednoduchý algoritmus přes
// součin náhodných čísel — žádná tabulka, žádný externí PRNG.
export function poisson(lam: number, maxYield: number): number {
  if (lam <= 0) return 0;
  const L = Math.exp(-lam); // práh = e^(-lambda)
  let k = 0;
  let p = 1.0;
  while (p > L) {
    k += 1;
    p *= Math.random();
  }
  return Math.min(k - 1, maxYield);
}
