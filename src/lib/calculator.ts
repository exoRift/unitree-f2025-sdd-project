import nerdamer from 'nerdamer/all.min'

// Minimal ambient module so TS doesn't complain about missing nerdamer types.
declare module 'nerdamer/all.min' {
  export default nerdamer
}

export type Env = Record<string, number>

export type CalcResult<T> =
    | { ok: true, value: T }
    | { ok: false, error: string }

/**
 * Wraps a successful computation result into a CalcResult.
 * @template T - Type of the successful value.
 * @param   {T}             value - The computed value.
 * @returns {CalcResult<T>}       An object containing the value with ok=true.
 */
function ok<T> (value: T): CalcResult<T> {
  return { ok: true, value }
}

/**
 * Wraps an error message into a CalcResult.
 * @param   {string}            error - A description of the error that occurred.
 * @returns {CalcResult<never>}       An object containing the error with ok=false.
 */
function err (error: string): CalcResult<never> {
  return { ok: false, error }
}

/**
 * Attempts to parse and evaluate a numeric expression using nerdamer.
 * @param   {string}             src - The expression to evaluate (e.g. "2+3*4").
 * @param   {Env}                env - The evaluation environment.
 * @returns {CalcResult<number>}
 *                                   - ok=true and a finite numeric value if evaluation succeeds,
 *                                   - ok=false and an error message if evaluation fails or produces NaN/Infinity.
 */
export function evaluateNumeric (src: string, env: Env = {}): CalcResult<number> {
  try {
    // nerdamer(...).evaluate(env).text() -> string like "14" or "1.75"
    const textResult = nerdamer(src).evaluate(env).text()
    const num = Number(textResult)

    // Guard against NaN / Infinity
    if (!Number.isFinite(num)) {
      return err('Non-finite result')
    }
    return ok(num)
  } catch (e: any) {
    // Normalize any parse/eval error into a simple string
    return err(String(e?.message ?? e))
  }
}

/**
 * Evaluates a numeric expression and returns its value, throwing if evaluation fails.
 * @param   {string} src   - The expression to evaluate (e.g. "10/2").
 * @param   {Env}    [env] - An optional environment of variable bindings used in evaluation.
 * @throws  {Error}        If evaluation fails or produces a non-finite result.
 * @returns {number}       The evaluated numeric value.
 */
export function calculate (src: string, env?: Env): number {
  const res = evaluateNumeric(src, env ?? {})
  if (!res.ok) throw new Error(res.error)
  return res.value
}
