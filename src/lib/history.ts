/**
 * For first implementation, equation type will be "unknown" until calculator backend is created
 */

const A_CODE = 'A'.charCodeAt(0)

/**
 * Representation of a history tree of nodes with dependencies
 */
export class Tree {
  private idLetterIterator = 0
  private readonly nodes = new Set<TreeNode>()
  idNumberIterators = new Map<string, number>()

  roots: TreeNode[] = []
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
   * @param                 equation     The equation inputted by the user
   * @param   {...TreeNode} dependencies The other nodes this node depends on, if any
   * @throws  {Error}                    if a dependency is given that is not present in the tree
   * @returns                            The created node
   */
  addNewNode (equation: string, ...dependencies: TreeNode[]): TreeNode {
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
      node = new TreeNode(id, equation)
      dependencies.forEach((d) => this.addDependency(node, d))
    } else {
      const id = this.generateID()
      node = new TreeNode(id, equation)
      this.roots.push(node)
    }

    this.nodes.add(node)
    this.idLookup.set(node.id, node)
    return node
  }

  /**
   * Establish a dependency relation between two nodes
   * @modifies The dependent and dependency sets of the nodes
   * @param          dependent  The dependent node
   * @param          dependency The node to depend on
   * @throws {Error}            if either node is not present in the tree
   */
  addDependency (dependent: TreeNode, dependency: TreeNode): void {
    if (!this.nodes.has(dependent)) throw new Error('Dependent node not present in tree')
    if (!this.nodes.has(dependency)) throw new Error('Dependency node not present in tree')

    dependent.dependencies.add(dependency)
    dependency.dependents.add(dependent)
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
    for (let i = 0; i < this.roots.length; i++) {
      if (this.roots[i].id === node.id) {
        this.roots.splice(i, 1)
        break
      }
    }
    if (node.alias) this.aliasLookup.delete(node.alias)
    return true
  }

  /**
   * Add an alias for a node
   * @param node  The node
   * @param alias The alias
   */
  setAlias (node: TreeNode, alias: string): void {
    if (!alias) return
    node.alias = alias
    this.aliasLookup.set(alias, node)
  }
}

/**
 * Node representation. \
 * Represents a single equation in history
 */
export class TreeNode {
  readonly id: string
  alias?: string
  dependencies = new Set<TreeNode>()
  dependents = new Set<TreeNode>()
  equation: string
  note?: string

  /**
   * Construct a node
   * @param id       The ID of the node
   * @param equation The node's equation contents
   */
  constructor (id: string, equation: string) {
    this.id = id
    this.equation = equation
  }
}
