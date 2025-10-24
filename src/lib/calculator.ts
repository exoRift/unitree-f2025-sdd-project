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
    return equation.replaceAll(/\\\$(\w+)(?=\W|$)/g, (_, g) => `\\mathrm{${g.toLowerCase()}}`)
  }

  /**
   * Construct an evaluation context
   */
  constructor (tree: Tree) {
    this.tree = tree
  }

  /**
   * Evaluate a node
   * @modifies The node's amortized value
   * @param    node The node to evaluate
   * @returns       The evaluation result
   */
  private refreshNode (node: TreeNode): BoxedExpression {
    const [value, dependencies] = this.evaluateParsedExpression(node.parsedEquation)
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
   * Evaluate an expression an return its value and dependencies
   * @param parsed The parsed expression
   * @returns      [value, dependencies]
   */
  private evaluateParsedExpression (parsed: BoxedExpression): [value: BoxedExpression, dependencies: Set<TreeNode>] {
    const dependencies = new Set<TreeNode>()

    const symbols = parsed.symbols
    for (const symbol of symbols) {
      if (symbol === 'ans' && this.tree.lastCreatedNode) dependencies.add(this.tree.lastCreatedNode)

      const depNode = this.tree.idLookup.get(symbol) ?? this.tree.aliasLookup.get(symbol)
      if (depNode) dependencies.add(depNode)
    }

    const context: Record<string, BoxedExpression> = {}

    if (this.tree.lastCreatedNode) {
      const value = this.tree.lastCreatedNode.amortizedValue ?? this.refreshNode(this.tree.lastCreatedNode)
      context.ans = value
    }

    for (const dependency of dependencies) {
      let value = dependency.amortizedValue
      if (!value) value = this.refreshNode(dependency)

      context[dependency.id] = value
      if (dependency.alias) context[dependency.alias] = value
    }

    // TODO: Prevent assignment
    return [parsed.subs(context).evaluate(), dependencies]
  }

  /**
   * Evaluate an expression, returning its parsed expression, value, and dependencies
   * @param equation The equation to evaluate
   * @returns        [parsed equation, value, dependencies]
   */
  evaluateExpression (equation: string): [parsed: BoxedExpression, value: BoxedExpression, dependencies: Set<TreeNode>] {
    const sanitized = HistoryCalculator.sanitize(equation)
    const parsed = this.engine.parse(sanitized)

    return [parsed, ...this.evaluateParsedExpression(parsed)]
  }

  /**
   * Evaluate an expression and save it in history
   * @param equation The equation to evaluate
   * @returns        [parsed equation, value, dependencies]
   */
  saveNewExpression (equation: string): [parsed: BoxedExpression, value: BoxedExpression, dependencies: Set<TreeNode>] {
    if (this.tree.lastCreatedNode) {
      const numerical = (this.tree.lastCreatedNode.amortizedValue ?? this.refreshNode(this.tree.lastCreatedNode)).N()

      if (numerical.isNumberLiteral) {
        const replaced = equation.replaceAll(numerical.toLatex(), `\\$${this.tree.lastCreatedNode.id}`)

        if (replaced !== equation) {
          equation = replaced
          this.tree.dispatchEvent(new CustomEvent('implicit'))
        }
      }
    }

    const [parsed, value, dependencies] = this.evaluateExpression(equation)

    if (!value.errors.length) {
      const node = this.tree.addNewNode(equation, parsed, ...dependencies)
      node.amortizedValue = value
    }

    return [parsed, value, dependencies]
  }

  /**
   * Edit the equation of a node and refresh it and its dependencies
   * @param node     The node
   * @param equation The new equation
   * @returns        [parsed equation, value, dependencies]
   */
  editNode (node: TreeNode, equation: string): [parsed: BoxedExpression, value: BoxedExpression, dependencies: Set<TreeNode>] {
    const sanitized = HistoryCalculator.sanitize(equation)
    const parsed = this.engine.parse(sanitized)

    node.rawUserEquation = equation
    node.parsedEquation = parsed
    const value = this.refreshNode(node)
    return [parsed, value, node.dependencies]
  }
}
