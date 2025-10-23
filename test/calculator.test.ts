import { HistoryCalculator } from '../src/lib/Calculator'
import type { BoxedExpression } from '@cortex-js/compute-engine'
import type { Tree, TreeNode } from '../src/lib/history'
import { test, expect } from 'bun:test'

type MinimalTree = Pick<
  Tree,
  'idLookup' | 'aliasLookup' | 'addNewNode' | 'addDependency' | 'removeDependency'
>

/**
 * Minimal stub for unit tests that exercises only evaluation.
 * Intentionally does not include the full {@link Tree} interface.
 */
class StubTree implements MinimalTree {
  readonly idLookup = new Map<string, TreeNode>()

  readonly aliasLookup = new Map<string, TreeNode>()

  /**
   * Create and register a minimal {@link TreeNode}
   * @param   {string}          _equation      - Raw user equation text (ignored by stub)
   * @param   {BoxedExpression} parsedEquation - Compute Engine parsed form
   * @returns {TreeNode}                       Node suitable for calculator evaluation
   */
  addNewNode (_equation: string, parsedEquation: BoxedExpression): TreeNode {
    const node: TreeNode = {
      id: '0',
      parsedEquation,
      amortizedValue: undefined,
      dependencies: new Set<TreeNode>(),
      dependents: new Set<TreeNode>()
    } as TreeNode
    this.idLookup.set(node.id, node)
    return node
  }

  /**
   * Add dependency stub — no-op used to satisfy the calculator surface
   * @param   {TreeNode} _node       - The dependent node (ignored)
   * @param   {TreeNode} _dependency - The dependency node (ignored)
   * @returns {void}
   */
  addDependency (_node: TreeNode, _dependency: TreeNode): void {
    // no-op
  }

  /**
   * Remove dependency stub — no-op used to satisfy the calculator surface
   * @param   {TreeNode} _node       - The dependent node (ignored)
   * @param   {TreeNode} _dependency - The dependency node (ignored)
   * @returns {void}
   */
  removeDependency (_node: TreeNode, _dependency: TreeNode): void {
    // no-op
  }
}

/**
 * Convert a Compute Engine {@link BoxedExpression} to a primitive number for assertions.
 *
 * Tries `N()` if available, then falls back to `valueOf()` and finally a numeric parse
 * of `toString()`. This mirrors the loose numeric semantics in tests.
 * @param   {BoxedExpression} expr - The expression to coerce
 * @returns {number}               The numeric value of the expression
 * @throws  {TypeError}            If the expression cannot be coerced to a number
 */
function num (expr: BoxedExpression): number {
  const hasN = typeof (expr as any).N === 'function'
  const n = hasN ? (expr as any).N() : expr
  const v = n.valueOf()
  if (typeof v === 'number') return v
  const s = n.toString?.()
  const parsed = typeof s === 'string' ? Number(s) : NaN
  if (!Number.isNaN(parsed)) return parsed
  throw new TypeError('Could not coerce BoxedExpression to a number')
}

/**
 * Factory for a {@link HistoryCalculator} bound to a minimal Tree stub.
 * @returns {HistoryCalculator} A calculator instance backed by a stubbed tree
 */
function calc (): HistoryCalculator {
  const tree = new StubTree() as unknown as Tree
  return new HistoryCalculator(tree)
}

test('Adds two positive numbers', () => {
  const [, v] = calc().evaluateExpression('2+3')
  expect(num(v)).toBe(5)
})

test('Handles subtraction with negatives', () => {
  const [, v] = calc().evaluateExpression('-7-3')
  expect(num(v)).toBe(-10)
})

test('Handles multiplication', () => {
  const [, v] = calc().evaluateExpression('4*5')
  expect(num(v)).toBe(20)
})

test('Handles division', () => {
  const [, v] = calc().evaluateExpression('20/4')
  expect(num(v)).toBe(5)
})

test('Respects PEMDAS', () => {
  const [, v] = calc().evaluateExpression('2 + 3 * 4')
  expect(num(v)).toBe(14)
})

test('Handles parentheses', () => {
  const [, v] = calc().evaluateExpression('(2 + 3) * 4')
  expect(num(v)).toBe(20)
})

test('Handles nested parentheses', () => {
  const [, v] = calc().evaluateExpression('((1 + 2) * (3 + 4))')
  expect(num(v)).toBe(21)
})

test('Handles decimals', () => {
  const [, v] = calc().evaluateExpression('0.5 + 1.25')
  expect(num(v)).toBeCloseTo(1.75)
})
