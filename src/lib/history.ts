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
    }

    this.roots.add(node)
    this.nodes.add(node)
    this.idLookup.set(node.id, node)
    this.reorganizeWholeTree()
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
    this.reorganizeWholeTree()
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
    this.reorganizeWholeTree()
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
    this.reorganizeWholeTree()
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

  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* --------Information only for rendering properly as a tree--------- */
  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */

  /**
   * This contains a key of '{treeNumber}_{RowNumber}' and a value of an array
   * of TreeNodes that are in that tree and that rowNumber. Both values start at
   * 0 and increment by 1 per iteration
   */
  organizedTree: Record<string, [TreeNode]> = {}
  /**
   * Used to know what TreeNodes were placed inside of organizedTree.
   * If it was, then its never placed in there again to avoid duplicates
   */
  allOrganizedNodes = new Set<TreeNode>()

  /**
   * Calling this function recalculates all information needed to display
   * the nodes in a tree like pattern. Call this when a node is removed or
   * added. Or a new dependency is added/removed
   */
  private reorganizeWholeTree (): void {
    this.organizedTree = {}
    this.allOrganizedNodes = new Set<TreeNode>()
    let currentTreeNumber = 0
    this.roots.forEach((root) => {
      // only grab root nodes
      if (root.dependents.size === 0) {
        this.updateCurrentNodeStatus(root, currentTreeNumber, 0)
        currentTreeNumber++
      }
    })
  }

  /**
   * Adds a treenode to a specific part of the tree so it can be rendered properly under the right
   * tree and row.
   * @param node       TreeNode you want to add so it can be displayed when the tree is rendered
   * @param treeNumber The tree number (0-X) where the node will be rendered under
   * @param rowNumber  The row number (0-X) where the node will be rendered under
   */
  private updateCurrentNodeStatus (node: TreeNode, treeNumber : number, rowNumber : number): void {
    const keyToLookFor = String(treeNumber) + '_' + String(rowNumber)
    if (!this.allOrganizedNodes.has(node)) {
      if (!Object.hasOwn(this.organizedTree, keyToLookFor)) {
        this.organizedTree[keyToLookFor] = [node]
      } else {
        this.organizedTree[keyToLookFor].push(node)
      }
      this.allOrganizedNodes.add(node)
    }
    node.dependencies.forEach((child) => {
      this.updateCurrentNodeStatus(child, treeNumber, rowNumber + 1)
    })
    console.log(this.organizedTree)
  }

  /**
   * A function to do as the title suggests
   * @returns Number of trees the user created (aka number of root nodes)
   */
  public getTotalNumberTrees (): number {
    let toReturn = 0
    while (Object.hasOwn(this.organizedTree, String(toReturn) + '_0')) toReturn++
    return toReturn
  }

  /**
   * Given a tree number, it gets the height of the tree in number of nodes
   * @param treeNumber the tree number you want to get info to (0-X)
   * @returns          Number of rows (aka height) in the tree in number of nodes
   */
  public getNumberOfRowsInTree (treeNumber : number): number {
    let toReturn = 0
    while (Object.hasOwn(this.organizedTree, String(treeNumber) + '_' + String(toReturn))) toReturn++
    return toReturn
  }

  /**
   * Given a tree number and row number of a tree, you get all the Nodes that need to be
   * displayed in that tree's row number.
   * @param treeNumber the tree number you want to get info to (0-X)
   * @param rowNumber  the row number (aka height away from the tree) you want to get info to (0-X)
   * @returns          All TreeNodes in that tree and row number
   */
  public getAllNodesInTreeAndRow (treeNumber : number, rowNumber : number): TreeNode[] {
    const keyToLookFor = String(treeNumber) + '_' + String(rowNumber)
    if (!Object.hasOwn(this.organizedTree, keyToLookFor)) return []
    return this.organizedTree[keyToLookFor]
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
