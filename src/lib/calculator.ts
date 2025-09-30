import nerdamer from 'nerdamer'

export type Env = Record<string, number>

export type CalcResult<T> =
    | { ok: true, value: T }
    | { ok: false, error: string }

/**
 * Wraps a successful computation result into a CalcResult.
 * @template T - Type of the successful value.
 * @param    value - The computed value.
 * @returns        An object containing the value with ok=true.
 */
function ok<T> (value: T): CalcResult<T> {
  return { ok: true, value }
}

/**
 * Wraps an error message into a CalcResult.
 * @param error - A description of the error that occurred.
 * @returns     An object containing the error with ok=false.
 */
function err (error: string): CalcResult<never> {
  return { ok: false, error }
}

/**
 * Attempts to parse and evaluate a numeric expression using nerdamer.
 * @param   {string}             src - The expression to evaluate (e.g. "2+3*4").
 * @returns {CalcResult<number>}
 *                                   - ok=true and a finite numeric value if evaluation succeeds,
 *                                   - ok=false and an error message if evaluation fails or produces NaN/Infinity.
 */
export function evaluateNumeric (src: string): CalcResult<number> {
  try {
    // nerdamer(...).evaluate(env).text() -> string like "14" or "1.75"
    const textResult = nerdamer(src).evaluate().text()
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
 * @param           src - The expression to evaluate (e.g. "10/2").
 * @throws  {Error}     If evaluation fails or produces a non-finite result.
 * @returns             The evaluated numeric value.
 */
export function calculate (src: string): number {
  const res = evaluateNumeric(src)
  if (!res.ok) throw new Error(res.error)
  return res.value
}
