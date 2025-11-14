/**
 * For first implementation, equation type will be "unknown" until calculator backend is created
 */

import { ComputeEngine, type BoxedExpression, type Expression } from '@cortex-js/compute-engine'

export interface SerializedNode {
  id: string
  alias?: string
  dependencies: string[]
  rawUserEquation: string
  parsed: Expression
  note?: string
  lastModified: Date
}

export interface SerializedTree {
  idLetterIterator: number
  idNumberIterators: Record<string, number>
  nodes: SerializedNode[]
  roots: string[]
}

const A_CODE = 'a'.charCodeAt(0)

/**
 * Representation of a history tree of nodes with dependencies
 */
export class Tree extends EventTarget {
  private idLetterIterator = 0
  private readonly idNumberIterators = new Map<string, number>()
  private readonly nodes = new Set<TreeNode>()

  readonly roots = new Set<TreeNode>()
  readonly idLookup = new Map<string, TreeNode>()
  readonly aliasLookup = new Map<string, TreeNode>()

  lastCreatedNode?: TreeNode

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
   * Populate data from a serialized tree into this instance
   */
  private populateData (serialized: SerializedTree): void {
    const engine = new ComputeEngine()

    this.idLetterIterator = serialized.idLetterIterator
    for (const letter in serialized.idNumberIterators) {
      this.idNumberIterators.set(letter, serialized.idNumberIterators[letter]!)
    }

    for (const serializedNode of serialized.nodes) {
      const node = new TreeNode(serializedNode.id, serializedNode.rawUserEquation, engine.box(serializedNode.parsed))

      this.nodes.add(node)
      this.idLookup.set(node.id, node)
      if (serializedNode.alias) this.setAlias(node, serializedNode.alias)
      if (serializedNode.note) this.setNote(node, serializedNode.note)
      node.lastModified = new Date(serializedNode.lastModified)
    }

    for (const serializedNode of serialized.nodes) {
      if (!serializedNode.dependencies.length) continue

      const node = this.idLookup.get(serializedNode.id)!
      for (const dep of serializedNode.dependencies) {
        this.addDependency(node, this.idLookup.get(dep)!)
      }
    }

    for (const root of serialized.roots) {
      this.roots.add(this.idLookup.get(root)!)
    }
  }

  /**
   * Construct a tree from a serialized representation
   */
  constructor (serialized?: SerializedTree) {
    super()

    if (serialized) this.populateData(serialized)
  }

  /**
   * Load a serialized tree into this current tree
   */
  loadSerialized (serialized: SerializedTree): void {
    this.nodes.clear()
    this.roots.clear()
    this.aliasLookup.clear()
    this.idLookup.clear()
    this.idNumberIterators.clear()
    this.lastCreatedNode = undefined
    this.populateData(serialized)
    this.dispatchEvent(new CustomEvent('mutate'))
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
        : dependencies[0]!.id.match(/^[a-z]+/)![0]

      const id = this.generateID(letterConstraint)
      node = new TreeNode(id, rawUserEquation, parsedEquation)
      this.nodes.add(node)
      dependencies.forEach((d) => this.addDependency(node, d))
    } else {
      const id = this.generateID()
      node = new TreeNode(id, rawUserEquation, parsedEquation)
      this.nodes.add(node)
      this.roots.add(node)
    }

    this.idLookup.set(node.id, node)
    this.lastCreatedNode = node
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
    if (node === this.lastCreatedNode) this.lastCreatedNode = undefined
    this.dispatchEvent(new CustomEvent('mutate'))
    return true
  }

  /**
   * Add an alias for a node
   * @param          node  The node
   * @param          alias The alias
   * @throws {Error}       if node is not present in the tree
   */
  setAlias (node: TreeNode, alias: string | undefined): void {
    if (alias === '' || node.alias === alias) return
    if (!this.nodes.has(node)) throw new Error('Node not present in tree')
    if (alias && this.aliasLookup.has(alias)) throw new Error('Alias already taken')

    if (node.alias) this.aliasLookup.delete(node.alias)

    if (alias) this.aliasLookup.set(alias, node)
    node.alias = alias

    this.dispatchEvent(new CustomEvent('mutate'))
  }

  /**
   * Add a note for a node
   * @param          node The node
   * @param          note The note
   * @throws {Error}      if node is not present in the tree
   */
  setNote (node: TreeNode, note: string | undefined): void {
    if (note === '') return
    if (!this.nodes.has(node)) throw new Error('Node not present in tree')
    node.note = note
    this.dispatchEvent(new CustomEvent('mutate'))
  }

  /**
   * Serialize a tree structure into an object
   * @returns The object representation
   */
  serialize (): SerializedTree {
    const nodes = Array.from(this.nodes).map((n) => n.serialize())
    const roots = Array.from(this.roots).map((n) => n.id)

    return {
      idLetterIterator: this.idLetterIterator,
      idNumberIterators: Object.fromEntries(this.idNumberIterators.entries()),
      nodes,
      roots
    }
  }

  /**
   * Clears the tree and resets to initial state
   */
  clear (): void {
    this.lastCreatedNode = undefined
    this.roots.clear()
    this.nodes.clear()
    this.aliasLookup.clear()
    this.idLetterIterator = 0
    this.idNumberIterators.clear()
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
  lastModified: Date

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
    this.lastModified = new Date()
  }

  /**
   * Serialize a node into its object representation
   * @returns The object representation of the node
   */
  serialize (): SerializedNode {
    return {
      id: this.id,
      alias: this.alias,
      dependencies: Array.from(this.dependencies).map((d) => d.id),
      rawUserEquation: this.rawUserEquation,
      parsed: this.parsedEquation.toJSON(),
      note: this.note,
      lastModified: this.lastModified
    }
  }
}

export type { TreeNode }
