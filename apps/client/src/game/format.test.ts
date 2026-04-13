// Testy pro formatScalar axiom — ověřují pravidla z GLOSSARY.

import { describe, it, expect } from "vitest";
import { formatScalar, formatResource } from "./format";

describe("formatScalar", () => {
  it("zero → '0'", () => {
    expect(formatScalar(0)).toBe("0");
  });

  it("bez prefixu v [0.1, 1000)", () => {
    expect(formatScalar(0.15)).toBe("0.15");
    expect(formatScalar(12)).toBe("12");
    expect(formatScalar(450)).toBe("450");
    expect(formatScalar(999)).not.toBe("999"); // 999 → rounded to 1000 → bump na 1.0k
  });

  it("k prefix pro tisíce", () => {
    expect(formatScalar(1500)).toBe("1.5k");
    expect(formatScalar(12_000)).toBe("12k");
  });

  it("M prefix — bump při round-up přes 1000", () => {
    expect(formatScalar(999_999)).toBe("1.0M");
    expect(formatScalar(45_000_000)).toBe("45M");
  });

  it("m prefix pro < 0.1", () => {
    expect(formatScalar(0.0023)).toBe("2.3m");
    expect(formatScalar(0.05)).toBe("50m");
  });

  it("µ prefix pro < 1e-4", () => {
    expect(formatScalar(0.000045)).toBe("45µ");
  });

  it("záporná čísla se znaménkem", () => {
    expect(formatScalar(-1500)).toBe("-1.5k");
    expect(formatScalar(-0.0023)).toBe("-2.3m");
  });

  it("G/T prefix vysoký rozsah", () => {
    expect(formatScalar(5_000_000_000)).toBe("5.0G");
    expect(formatScalar(1_500_000_000_000)).toBe("1.5T");
  });
});

describe("formatResource", () => {
  it("'current/max unit' format", () => {
    expect(formatResource(0.15, 12, "E")).toBe("0.15/12 E");
    expect(formatResource(18, 32, "W")).toBe("18/32 W");
    expect(formatResource(45, 100, "S")).toBe("45/100 S");
  });
});
