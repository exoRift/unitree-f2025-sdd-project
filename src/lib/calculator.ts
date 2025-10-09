import type { Tree, TreeNode } from './history'

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine'

/**
 * The history calculator evaluation context class
 */
export class HistoryCalculator {
  private readonly engine = new ComputeEngine()

  readonly tree: Tree

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
   * Evaluate a node
   * @modifies The node's amortized value
   * @todo Support aliases
   * @todo Support implicit dependencies
   * @todo Decide on $ invocation
   * @param    node The node to evaluate
   * @returns       The evaluation result
   */
  private evaluateNode (node: TreeNode): BoxedExpression {
    if (node.amortizedValue) return node.amortizedValue

    const symbols = node.parsedEquation.symbols
    for (const dependency of node.dependencies) {
      if (!symbols.includes(dependency.id)) this.tree.removeDependency(node, dependency)
    }
    for (const symbol of symbols) {
      const depNode = this.tree.idLookup.get(symbol)
      if (depNode && !node.dependencies.has(depNode)) {
        this.tree.addDependency(node, depNode)
      }
    }

    const context: Record<string, BoxedExpression> = {}
    for (const dependency of node.dependencies) {
      let value = dependency.amortizedValue
      if (!value) value = this.evaluateNode(dependency)
      context[dependency.id] = value
    }

    node.amortizedValue = node.parsedEquation.evaluate({ withArguments: context })
    // Update dependents, if any
    for (const dependent of node.dependents) {
      this.evaluateNode(dependent)
    }
    return node.amortizedValue
  }

  /**
   * Evaluate a new equation, generating a new history entry
   * @param equation The equation to evaluate
   * @returns        The result
   */
  evaluateNew (equation: string): BoxedExpression {
    const parsed = this.engine.parse(equation)
    const node = this.tree.addNewNode(equation, parsed)

    return this.evaluateNode(node)
  }
}
