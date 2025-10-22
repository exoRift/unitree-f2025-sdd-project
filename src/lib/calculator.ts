import type { TreeNode, Tree } from './history'

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine'

/**
 * The history calculator evaluation context class
 */
export class HistoryCalculator {
  private readonly engine = new ComputeEngine()

  readonly tree: Tree

  /**
   * Sanitize an incoming equation
   * @param equation The equation
   * @returns        The sanitized equation
   */
  static sanitize (equation: string): string {
    return equation.replaceAll(/\\\$(\w+)(?=\W|$)/g, (_, g) => `\\mathrm{${g}}`)
  }

  /**
   * Construct an evaluation context
   */
  constructor (tree: Tree) {
    this.tree = tree
  }

  // private injectReferences (expression: BoxedExpression): void {
  //   // TODO(@exoRift): Investigate collisions
  //   const symbols = expression.symbols
  //   for (const id of this.tree.idLookup.keys()) {
  //     if (symbols.includes(id)) {
  //       const node = this.tree.idLookup.get(id)!
  //       const value = this.evaluateNode(node)

  //       expression.subs(['Symbol', id], value)
  //     }
  //   }

  //   for (const alias of this.tree.aliasLookup.keys()) {

  //   }
  // }

  /**
   * Evaluate an expression an return its value and dependencies
   * @param parsed The parsed expression
   * @returns      [value, dependencies]
   */
  private evaluateExpression (parsed: BoxedExpression): [value: BoxedExpression, dependencies: Set<TreeNode>] {
    const dependencies = new Set<TreeNode>()

    const symbols = parsed.symbols
    for (const symbol of symbols) {
      const depNode = this.tree.idLookup.get(symbol) ?? this.tree.aliasLookup.get(symbol)
      if (depNode) dependencies.add(depNode)
    }

    const context: Record<string, BoxedExpression> = {}
    for (const dependency of dependencies) {
      let value = dependency.amortizedValue
      if (!value) value = this.refreshNode(dependency)

      context[dependency.id] = value
      if (dependency.alias) context[dependency.alias] = value
    }

    // TODO: Prevent assignment
    return [parsed.evaluate({ withArguments: context }), dependencies]
  }

  /**
   * Evaluate a node
   * @modifies The node's amortized value
   * @param    node The node to evaluate
   * @returns       The evaluation result
   */
  private refreshNode (node: TreeNode): BoxedExpression {
    const [value, dependencies] = this.evaluateExpression(node.parsedEquation)
    node.amortizedValue = value

    const missingDeps = node.dependencies.difference(dependencies)
    for (const missingDep of missingDeps) this.tree.removeDependency(node, missingDep)

    const newDeps = dependencies.difference(node.dependencies)
    for (const newDep of newDeps) this.tree.addDependency(node, newDep)

    // Update dependents, if any
    for (const dependent of node.dependents) this.refreshNode(dependent)
    return node.amortizedValue
  }

  /**
   * Evaluate a new equation, generating a new history entry
   * @param equation The equation to evaluate
   * @returns        The result
   */
  evaluateNewExpression (equation: string): BoxedExpression {
    const sanitized = HistoryCalculator.sanitize(equation)
    const parsed = this.engine.parse(sanitized)
    console.debug('santized:', JSON.stringify(sanitized))
    console.debug('parsed:', parsed.json)

    const [value, dependencies] = this.evaluateExpression(parsed)
    const node = this.tree.addNewNode(equation, parsed, ...dependencies)
    node.amortizedValue = value

    return node.amortizedValue
  }
}
