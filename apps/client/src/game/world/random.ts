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
