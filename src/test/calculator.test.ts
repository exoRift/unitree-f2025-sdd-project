import { test, expect } from "bun:test";
import { evaluateNumeric } from "../lib/calculator";

test("adds two positive numbers", () => {
  const res = evaluateNumeric("2+3");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(5);
});

test("handles subtraction with negatives", () => {
  const res = evaluateNumeric("-7-3");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(-10);
});

test("handles multiplication", () => {
  const res = evaluateNumeric("4*5");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(20);
});

test("handles division", () => {
  const res = evaluateNumeric("20/4");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(5);
});

test("respects PEMDAS order of operations", () => {
  const res = evaluateNumeric("2 + 3 * 4");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(14); // 2 + (3*4)
});

test("handles parentheses overriding precedence", () => {
  const res = evaluateNumeric("(2 + 3) * 4");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(20);
});

test("handles nested parentheses", () => {
  const res = evaluateNumeric("((1 + 2) * (3 + 4))");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBe(21);
});

test("handles decimal numbers", () => {
  const res = evaluateNumeric("0.5 + 1.25");
  expect(res.ok).toBe(true);
  if (res.ok) expect(res.value).toBeCloseTo(1.75);
});
