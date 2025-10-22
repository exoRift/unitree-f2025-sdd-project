import { HistoryCalculator } from '../src/lib/Calculator'
import type { BoxedExpression } from '@cortex-js/compute-engine'
import type { Tree, TreeNode } from '../src/lib/history'
import { test, expect } from 'bun:test'

/**
 * A minimal subset of {@link Tree} required by {@link HistoryCalculator}.
 * We only include members actually used by the calculator:
 * - idLookup
 * - aliasLookup
 * - addNewNode
 * - addDependency
 * - removeDependency
 */
type MinimalTree = Pick<
  Tree,
  'idLookup' | 'aliasLookup' | 'addNewNode' | 'addDependency' | 'removeDependency'
>

/**
 * Minimal stub for unit tests that exercises only evaluation.
 * Intentionally does not include the full {@link Tree} interface.
 */
class StubTree implements MinimalTree {
  /** Lookup table for nodes by identifier. */
  readonly idLookup = new Map<string, TreeNode>()

  /** Lookup table for aliases mapped to nodes. */
  readonly aliasLookup = new Map<string, TreeNode>()

  /**
   * Create and register a minimal {@link TreeNode}.
   * @param   {string}          _equation      - Raw equation text.
   * @param   {BoxedExpression} parsedEquation - Compute Engine parsed form.
   * @returns {TreeNode}                       A node suitable for evaluation by the calculator.
   */
  addNewNode (_equation: string, parsedEquation: BoxedExpression): TreeNode {
    const node: TreeNode = {
      id: '0',
      parsedEquation,
      amortizedValue: undefined,
      dependencies: new Set<TreeNode>(),
      dependents: new Set<TreeNode>()
    } as TreeNode // cast keeps TS happy if there are more fields in real TreeNode
    this.idLookup.set(node.id, node)
    return node
  }

  /**
   * No-op: present to satisfy the minimal surface used by the calculator.
   * @param   {TreeNode} _node       - Dependent node.
   * @param   {TreeNode} _dependency - Dependency node.
   * @returns {void}
   */
  addDependency (_node: TreeNode, _dependency: TreeNode): void {
    // Intentionally empty for unit tests
  }

  /**
   * No-op: present to satisfy the minimal surface used by the calculator.
   * @param   {TreeNode} _node       - Dependent node.
   * @param   {TreeNode} _dependency - Dependency node.
   * @returns {void}
   */
  removeDependency (_node: TreeNode, _dependency: TreeNode): void {
    // Intentionally empty for unit tests
  }
}

/**
 * Convert a Compute Engine {@link BoxedExpression} to a number for assertions.
 * @param   {BoxedExpression} expr - The result expression.
 * @returns {number}               Numeric value of the expression.
 * @throws  {TypeError}            If coercion fails.
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
 * Factory for a calculator bound to a minimal tree stub.
 * We cast the stub to {@link Tree} at the boundary to satisfy the constructor
 * while keeping the stub lean.
 * @returns {HistoryCalculator} Calculator ready for evaluateNew().
 */
function calc (): HistoryCalculator {
  const tree = new StubTree() as unknown as Tree
  return new HistoryCalculator(tree)
}

test('Adds two positive numbers', () => {
  expect(num(calc().evaluateNew('2+3'))).toBe(5)
})

test('Handles subtraction with negatives', () => {
  expect(num(calc().evaluateNew('-7-3'))).toBe(-10)
})

test('Handles multiplication', () => {
  expect(num(calc().evaluateNew('4*5'))).toBe(20)
})

test('Handles division', () => {
  expect(num(calc().evaluateNew('20/4'))).toBe(5)
})

test('Respects PEMDAS', () => {
  expect(num(calc().evaluateNew('2 + 3 * 4'))).toBe(14)
})

test('Handles parentheses', () => {
  expect(num(calc().evaluateNew('(2 + 3) * 4'))).toBe(20)
})

test('Handles nested parentheses', () => {
  expect(num(calc().evaluateNew('((1 + 2) * (3 + 4))'))).toBe(21)
})

test('Handles decimals', () => {
  expect(num(calc().evaluateNew('0.5 + 1.25'))).toBeCloseTo(1.75)
})
