import type { TreeNode, Tree } from './history'

import { type AngularUnit, type BoxedExpression, ComputeEngine } from '@cortex-js/compute-engine'

/**
 * The history calculator evaluation context class
 */
export class HistoryCalculator {
  readonly engine = new ComputeEngine()

  tree: Tree
  defaultAngularUnit: AngularUnit

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
    this.defaultAngularUnit = this.engine.angularUnit
  }

  /**
   * Evaluate an expression an return its value and dependencies
   * @param parsed      The parsed expression
   * @param angularUnit The unit to use for angle-based functions
   * @returns           [value, dependencies]
   */
  private evaluateParsedExpression (parsed: BoxedExpression, angularUnit: AngularUnit): [value: BoxedExpression, dependencies: Set<TreeNode>] {
    const dependencies = new Set<TreeNode>()

    const unknownSymbols: string[] = []
    const symbols = parsed.symbols
    for (const symbol of symbols) {
      if (symbol === 'ans' && this.tree.lastCreatedNode) {
        dependencies.add(this.tree.lastCreatedNode)
        continue
      }

      const depNode = this.tree.idLookup.get(symbol) ?? this.tree.aliasLookup.get(symbol)
      if (depNode) dependencies.add(depNode)
      else unknownSymbols.push(symbol)
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
    this.engine.angularUnit = angularUnit
    const subbed = parsed.subs(context)
    let result = subbed.evaluate()
    if (result.isSame(this.engine.parse('\\bot')) && unknownSymbols.length) {
      const variables: ['List', ...Array<['List', string, ['List', ...BoxedExpression[]]]>] = ['List']

      for (const symbol of unknownSymbols) {
        const solutions = subbed.solve([symbol])

        if (solutions) {
          const list: ['List', ...BoxedExpression[]] = ['List']
          for (const solution of solutions) list.push(solution)

          variables.push(['List', symbol, list])
        }
      }

      if (variables.length > 1) result = this.engine.box(variables)
    }

    return [result, dependencies]
  }

  /**
   * Evaluate a node
   * @modifies The node's amortized value
   * @param    node The node to evaluate
   * @returns       The evaluation result
   */
  refreshNode (node: TreeNode): BoxedExpression {
    const [value, dependencies] = this.evaluateParsedExpression(node.parsedEquation, node.angularUnit)
    node.amortizedValue = value

    const missingDeps = node.dependencies.difference(dependencies)
    for (const missingDep of missingDeps) this.tree.removeDependency(node, missingDep)

    const newDeps = dependencies.difference(node.dependencies)
    for (const newDep of newDeps) this.tree.addDependency(node, newDep)

    if (node.dependencies.size) this.tree.roots.delete(node)
    else this.tree.roots.add(node)

    // Update dependents, if any
    for (const dependent of node.dependents) this.refreshNode(dependent)
    return node.amortizedValue
  }

  /**
   * Evaluate an expression, returning its parsed expression, value, and dependencies
   * @param equation    The equation to evaluate
   * @param angularUnit The unit to use for angle-based functions
   * @returns           [parsed equation, value, dependencies]
   */
  evaluateExpression (equation: string, angularUnit = this.defaultAngularUnit): [parsed: BoxedExpression, value: BoxedExpression, dependencies: Set<TreeNode>] {
    const sanitized = HistoryCalculator.sanitize(equation)
    const parsed = this.engine.parse(sanitized)

    // if (this.tree.lastCreatedNode) {
    //   const numerical = (this.tree.lastCreatedNode.amortizedValue ?? this.refreshNode(this.tree.lastCreatedNode)).N()

    //   if (numerical.isNumberLiteral) {
    //     const replaced = parsed.map((e) => e.isNumberLiteral && e.isSame(numerical)
    //       ? this.engine.box(this.tree.lastCreatedNode!.id)
    //       : e)

    //     if (!replaced.isSame(parsed)) {
    //       parsed = replaced
    //       this.tree.dispatchEvent(new CustomEvent('implicit'))
    //     }
    //   }
    // }

    return [parsed, ...this.evaluateParsedExpression(parsed, angularUnit)]
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
        const replaced = equation.replaceAll(new RegExp(`(?<!\\d)${numerical.toLatex()}(?!\\d)`, 'g'), `\\$${this.tree.lastCreatedNode.id}`)

        if (replaced !== equation) {
          equation = replaced
          this.tree.dispatchEvent(new CustomEvent('implicit'))
        }
      }
    }

    const [parsed, value, dependencies] = this.evaluateExpression(equation)

    if (!value.errors.length) {
      const node = this.tree.addNewNode(equation, parsed, this.defaultAngularUnit, ...dependencies)
      node.amortizedValue = value
    }

    return [parsed, value, dependencies]
  }

  /**
   * Edit the equation of a node and refresh it and its dependencies
   * @param node           The node
   * @param equation       The new equation
   * @param newAngularUnit The new angular unit to use for the node
   * @returns              [parsed equation, value, dependencies]
   */
  editNode (node: TreeNode, equation: string, newAngularUnit?: AngularUnit): [parsed: BoxedExpression, value: BoxedExpression, dependencies: Set<TreeNode>] {
    const sanitized = HistoryCalculator.sanitize(equation)
    const parsed = this.engine.parse(sanitized)

    node.rawUserEquation = equation
    node.parsedEquation = parsed
    if (newAngularUnit) node.angularUnit = newAngularUnit
    node.lastModified = new Date()
    const value = this.refreshNode(node)
    this.tree.dispatchEvent(new CustomEvent('mutate'))
    return [parsed, value, node.dependencies]
  }
}
