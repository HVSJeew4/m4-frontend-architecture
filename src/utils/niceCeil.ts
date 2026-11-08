/** Rounds an axis maximum up to 1, 2, 2.5 or 5 × a power of ten, so the ticks are round numbers. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => value / magnitude <= s) ?? 10;
  return step * magnitude;
}
