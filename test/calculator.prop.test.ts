import { describe, test } from 'bun:test'
import { HistoryCalculator } from '../src/lib/calculator'
import { Tree } from '../src/lib/history'
import * as fc from 'fast-check'
import type { BoxedExpression } from '@cortex-js/compute-engine'

const num = (e: BoxedExpression): number => {
  const hasN = typeof (e as any).N === 'function'
  const n = hasN ? (e as any).N() : e
  const v = n.valueOf()
  if (typeof v === 'number') return v
  const s = n.toString?.()
  const parsed = typeof s === 'string' ? Number(s) : NaN
  if (!Number.isNaN(parsed)) return parsed
  throw new TypeError('Could not coerce BoxedExpression to a number')
}

const close = (a: number, b: number, eps = 1e-9): boolean =>
  Math.abs(a - b) <= eps

const finiteNum: fc.Arbitrary<number> = fc.double({
  noNaN: true,
  noDefaultInfinity: true,
  min: -1e6,
  max: 1e6
})

describe('HistoryCalculator – algebraic properties', () => {
  const mk = (): HistoryCalculator => new HistoryCalculator(new Tree())

  test('addition is commutative: x + y == y + x', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, finiteNum, (x: number, y: number) => {
        const [, v1] = calc.evaluateExpression(`${x}+${y}`)
        const [, v2] = calc.evaluateExpression(`${y}+${x}`)
        return close(num(v1), num(v2))
      })
    )
  })

  test('multiplication is commutative: x * y == y * x', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, finiteNum, (x: number, y: number) => {
        const [, v1] = calc.evaluateExpression(`${x}*${y}`)
        const [, v2] = calc.evaluateExpression(`${y}*${x}`)
        return close(num(v1), num(v2))
      })
    )
  })

  test('addition identity: x + 0 == x', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, (x: number) => {
        const [, v] = calc.evaluateExpression(`${x}+0`)
        return close(num(v), x)
      })
    )
  })

  test('multiplication identity: x * 1 == x', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, (x: number) => {
        const [, v] = calc.evaluateExpression(`${x}*1`)
        return close(num(v), x)
      })
    )
  })

  test('associativity of addition: (x+y)+z == x+(y+z)', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, finiteNum, finiteNum, (x: number, y: number, z: number) => {
        const [, v1] = calc.evaluateExpression(`(${x}+${y})+${z}`)
        const [, v2] = calc.evaluateExpression(`${x}+(${y}+${z})`)
        return close(num(v1), num(v2))
      })
    )
  })

  test('left distributive: x*(y+z) == x*y + x*z', () => {
    const calc = mk()
    fc.assert(
      fc.property(finiteNum, finiteNum, finiteNum, (x: number, y: number, z: number) => {
        const [, v1] = calc.evaluateExpression(`${x}*(${y}+${z})`)
        const [, v2] = calc.evaluateExpression(`${x}*${y} + ${x}*${z}`)
        return close(num(v1), num(v2), 1e-8)
      })
    )
  })
})
