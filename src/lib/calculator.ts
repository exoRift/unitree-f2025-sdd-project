// src/lib/calculator.ts

// Minimal ambient module so TS doesn't complain about missing nerdamer types.
declare module 'nerdamer/all.min' {
    const nerdamer: any;
    export default nerdamer;
  }
  
  import nerdamer from 'nerdamer/all.min';
  
  export type Env = Record<string, number>;
  
  export type CalcResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };
  
  function ok<T>(value: T): CalcResult<T> {
    return { ok: true, value };
  }
  function err(error: string): CalcResult<never> {
    return { ok: false, error };
  }
  
  /**
   * Evaluate a numeric arithmetic expression with an optional variable map.
   * Returns { ok: true, value } on success; { ok: false, error } on failure.
   */
  export function evaluateNumeric(src: string, env: Env = {}): CalcResult<number> {
    try {
      // nerdamer(...).evaluate(env).text() -> string like "14" or "1.75"
      const textResult = nerdamer(src).evaluate(env).text();
      const num = Number(textResult);
  
      // Guard against NaN / Infinity
      if (!Number.isFinite(num)) {
        return err('Non-finite result');
      }
      return ok(num);
    } catch (e: any) {
      // Normalize any parse/eval error into a simple string
      return err(String(e?.message ?? e));
    }
  }
  
  /**
   * "Calculator" convenience that throws on error (nice for callers that prefer exceptions).
   * Same semantics as evaluateNumeric, but returns a number or throws.
   */
  export function calculate(src: string, env?: Env): number {
    const res = evaluateNumeric(src, env ?? {});
    if (!res.ok) throw new Error(res.error);
    return res.value;
  }
  