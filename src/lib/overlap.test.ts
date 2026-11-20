import { describe, it, expect } from "vitest";
import { answerOverlap, isUsed } from "./overlap";
describe("overlap", () => {
  it("scores shared vocabulary against the smaller set", () => {
    expect(answerOverlap("checkout fails because stripe webhook timeout", "stripe webhook timeout config")).toBe(0.75);
  });
  it("returns null without an answer", () => { expect(answerOverlap("", "x content")).toBeNull(); });
  it("marks used at 0.2 and above", () => { expect(isUsed(0.2)).toBe(true); expect(isUsed(0.19)).toBe(false); });
});
