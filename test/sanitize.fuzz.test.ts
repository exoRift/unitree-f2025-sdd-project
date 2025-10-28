import { test, expect, describe } from 'bun:test'
import * as fc from 'fast-check'
import { HistoryCalculator } from '../src/lib/Calculator'

/**
 * Characters allowed for a \w-style word (A–Z, a–z, 0–9, _)
 */
const WORD_CHARS: readonly string[] =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_'.split('')

/**
 * Arbitrary that generates words of length 1..10 from WORD_CHARS
 */
const word: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...WORD_CHARS), { minLength: 1, maxLength: 10 })
  .map((arr: readonly string[]): string => arr.join(''))

describe('HistoryCalculator.sanitize fuzz', () => {
  test('replaces \\$WORD with \\mathrm{word} and is idempotent on already-sanitized', () => {
    fc.assert(
      fc.property(word, word, (a: string, b: string) => {
        const raw = String.raw`\$${a}+ \$${b} - 2`
        const once = HistoryCalculator.sanitize(raw)
        expect(once).toMatch(new RegExp(String.raw`\\mathrm\{${a.toLowerCase()}\}`))
        expect(once).toMatch(new RegExp(String.raw`\\mathrm\{${b.toLowerCase()}\}`))

        const twice = HistoryCalculator.sanitize(once)
        expect(twice).toBe(once)
      })
    )
  })

  test('does not touch existing \\mathrm{}', () => {
    fc.assert(
      fc.property(word, (w: string) => {
        const raw = String.raw`\mathrm{${w}} + \$${w}`
        const out = HistoryCalculator.sanitize(raw)
        expect(out.includes(String.raw`\mathrm{${w}}`)).toBe(true)
        expect(out.includes(String.raw`\$${w}`)).toBe(false)
        expect(out.includes(String.raw`\mathrm{${w.toLowerCase()}}`)).toBe(true)
      })
    )
  })
})
