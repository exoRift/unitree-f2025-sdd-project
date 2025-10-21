/**
 * For first implementation, equation type will be "unknown" until calculator backend is created
 */

import type { BoxedExpression } from '@cortex-js/compute-engine'

const A_CODE = 'A'.charCodeAt(0)

/**
 * Representation of a history tree of nodes with dependencies
 */
export class Tree extends EventTarget {
  private idLetterIterator = 0
  private readonly nodes = new Set<TreeNode>()
  idNumberIterators = new Map<string, number>()

  roots = new Set<TreeNode>()
  idLookup = new Map<string, TreeNode>()
  aliasLookup = new Map<string, TreeNode>()

  /**
   * Convert a number into a series of letters \
   * 0 -> A \
   * 25 -> Z \
   * 26 -> AA \
   * ... \
   * @param           number The number
   * @throws  {Error}        if number is negative
   * @returns                The letter series
   */
  private static numberToLetterSeries (number: number): string {
    if (number < 0) throw new Error('Input must be non-negative')

    let result = ''
    while (number >= 0) {
      const remainder = number % 26
      result = String.fromCharCode(A_CODE + remainder) + result
      number = Math.floor(number / 26) - 1
    }
    return result
  }

  /**
   * Generate a new incremented unique ID for a node
   * @modifies The ID iterator state
   * @param    letterConstraint A letter to constrain the ID to
   * @returns                   The ID
   */
  private generateID (letterConstraint?: string): string {
    const letter = letterConstraint ?? Tree.numberToLetterSeries(this.idLetterIterator)
    const number = (this.idNumberIterators.get(letter) ?? -1) + 1

    ++this.idLetterIterator
    this.idNumberIterators.set(letter, number)

    return `${letter}${number}`
  }

  /**
   * Create a new node (root, if no dependencies specified)
   * @param                 rawUserEquation The raw user input in string form
   * @param                 parsedEquation  The equation inputted by the user
   * @param   {...TreeNode} dependencies    The other nodes this node depends on, if any
   * @throws  {Error}                       if a dependency is given that is not present in the tree
   * @returns                               The created node
   */
  addNewNode (rawUserEquation: string, parsedEquation: BoxedExpression, ...dependencies: TreeNode[]): TreeNode {
    for (const dependency of dependencies) {
      if (!this.nodes.has(dependency)) throw new Error(`Dependency with ID "${dependency.id}" not present in tree`)
    }

    let node: TreeNode
    if (dependencies.length) {
      // If this is a descendant of more than one node, use a new letter
      const letterConstraint = dependencies.length > 1
        ? undefined
        : dependencies[0].id.match(/^\w+/)![0]

      const id = this.generateID(letterConstraint)
      node = new TreeNode(id, rawUserEquation, parsedEquation)
      dependencies.forEach((d) => this.addDependency(node, d))
    } else {
      const id = this.generateID()
      node = new TreeNode(id, rawUserEquation, parsedEquation)
      this.roots.add(node)
    }

    this.nodes.add(node)
    this.idLookup.set(node.id, node)
    this.dispatchEvent(new CustomEvent('mutate'))
    return node
  }

  /**
   * Establish a dependency relation between two nodes
   * @modifies The dependent and dependency sets of the nodes
   * @param          dependent  The dependent node
   * @param          dependency The node to depend on
   * @todo Prevent dependencies from earlier nodes to later nodes
   * @throws {Error}            if either node is not present in the tree
   */
  addDependency (dependent: TreeNode, dependency: TreeNode): void {
    if (!this.nodes.has(dependent)) throw new Error('Dependent node not present in tree')
    if (!this.nodes.has(dependency)) throw new Error('Dependency node not present in tree')

    dependent.dependencies.add(dependency)
    dependency.dependents.add(dependent)
    this.dispatchEvent(new CustomEvent('mutate'))
  }

  /**
   * Remove a dependency relation between two nodes
   * @modifies The dependent and dependency sets of the nodes
   * @param          dependent  The dependent node
   * @param          dependency The node to depend on
   * @throws {Error}            if either node is not present in the tree
   */
  removeDependency (dependent: TreeNode, dependency: TreeNode): void {
    if (!this.nodes.has(dependent)) throw new Error('Dependent node not present in tree')
    if (!this.nodes.has(dependency)) throw new Error('Dependency node not present in tree')

    dependent.dependencies.delete(dependency)
    dependency.dependents.delete(dependent)
    this.dispatchEvent(new CustomEvent('mutate'))
  }

  /**
   * Delete a node from a tree and all of its dependents
   * @param node The node to delete
   * @returns    true if successful, false is idempotent
   */
  deleteNode (node: TreeNode): boolean {
    if (!this.nodes.has(node)) return false

    for (const dependent of node.dependents) this.deleteNode(dependent)
    for (const dep of node.dependencies) dep.dependents.delete(node)

    this.nodes.delete(node)
    this.idLookup.delete(node.id)
    this.roots.delete(node)
    if (node.alias) this.aliasLookup.delete(node.alias)
    this.dispatchEvent(new CustomEvent('mutate'))
    return true
  }

  /**
   * Add an alias for a node
   * @param          node  The node
   * @param          alias The alias
   * @throws {Error}       if node is not present in the tree
   */
  setAlias (node: TreeNode, alias: string): void {
    if (!alias) return
    if (!this.nodes.has(node)) throw new Error('Node not present in tree')
    node.alias = alias
    this.aliasLookup.set(alias, node)
    this.dispatchEvent(new CustomEvent('mutate'))
  }
}

/**
 * Node representation. \
 * Represents a single equation in history
 */
class TreeNode {
  readonly id: string
  alias?: string
  dependencies = new Set<TreeNode>()
  dependents = new Set<TreeNode>()
  rawUserEquation: string
  parsedEquation: BoxedExpression
  /** An externally controllled amortized value */
  amortizedValue?: BoxedExpression
  note?: string

  /**
   * Construct a node
   * @param id              The ID of the node
   * @param rawUserEquation The raw user input in string form
   * @param parsedEquation  The node's equation contents
   */
  constructor (id: string, rawUserEquation: string, parsedEquation: BoxedExpression) {
    this.id = id
    this.rawUserEquation = rawUserEquation
    this.parsedEquation = parsedEquation
  }

  /**
   * Update the alias of the node
   * @param newAlias the new alias to be assigned to this node
   */
  setAlias (newAlias : string) : void {
    this.alias = newAlias
  }

  /**
   * Update the note of the node
   * @param newNote the new note to be assigned to this node
   */
  setNote (newNote : string) : void {
    this.note = newNote
  }
}

export type { TreeNode }
