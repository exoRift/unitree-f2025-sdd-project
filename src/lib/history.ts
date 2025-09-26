/**
 * For first implementation, equation type will be "unknown" until calculator backend is created
 */

const A_CODE = 'A'.charCodeAt(0)
const Z_CODE = 'Z'.charCodeAt(0)

/**
 * Representation of a history tree of nodes with dependencies
 */
export class Tree {
  private idLetterIterator = 'A'
  private readonly nodes = new Set<Node>()
  idNumberIterators = new Map<string, number>()

  roots: Node[] = []
  idLookup = new Map<string, Node>()
  aliasLookup = new Map<string, Node>()

  /**
   * Generate a new incremented unique ID for a node
   * @mutates The ID iterator state
   * @param   letterConstraint A letter to constrain the ID to
   * @returns                  The ID
   */
  private generateID (letterConstraint?: string): string {
    const letter = letterConstraint ?? this.idLetterIterator
    const number = (this.idNumberIterators.get(letter) ?? -1) + 1

    this.idLetterIterator = String.fromCharCode((this.idLetterIterator.charCodeAt(0) % Z_CODE) + A_CODE)
    this.idNumberIterators.set(letter, number)

    return `${letter}${number}`
  }

  /**
   * Create a new node (root, if no dependencies specified)
   * @param             equation     The equation inputted by the user
   * @param   {...Node} dependencies The other nodes this node depends on, if any
   * @throws  {Error}                if a dependency is given that is not present in the tree
   * @returns                        The created node
   */
  newNode (equation: unknown, ...dependencies: Node[]): Node {
    for (const dependency of dependencies) {
      if (!this.nodes.has(dependency)) throw new Error(`Dependency with ID "${dependency.id}" not present in tree`)
    }

    let node: Node
    if (dependencies.length) {
      // If this is a descendant of more than one node, use a new letter
      const letterConstraint = dependencies.length > 1
        ? undefined
        : dependencies[0].id.match(/^\w+/)![0]

      const id = this.generateID(letterConstraint)
      node = new Node(id, equation)
      dependencies.forEach((d) => this.addDependency(node, d))
    } else {
      const id = this.generateID()
      node = new Node(id, equation)
      this.roots.push(node)
    }

    this.nodes.add(node)
    this.idLookup.set(node.id, node)
    return node
  }

  /**
   * Establish a dependency relation between two nodes
   * @mutates The dependent and dependency sets of the nodes
   * @param          dependent  The dependent node
   * @param          dependency The node to depend on
   * @throws {Error}            if either node is not present in the tree
   */
  addDependency (dependent: Node, dependency: Node): void {
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
  deleteNode (node: Node): boolean {
    if (!this.nodes.has(node)) return false

    for (const dependent of node.dependents) this.deleteNode(dependent)
    for (const dep of node.dependencies) dep.dependents.delete(node)

    this.nodes.delete(node)
    this.idLookup.delete(node.id)
    if (node.alias) this.aliasLookup.delete(node.alias)
    return true
  }

  /**
   * Add an alias for a node
   * @param node  The node
   * @param alias The alias
   */
  setAlias (node: Node, alias: string): void {
    if (!alias) return
    node.alias = alias
    this.aliasLookup.set(alias, node)
  }
}

/**
 * Node representation. \
 * Represents a single equation in history
 */
export class Node {
  readonly id: string
  alias?: string
  dependencies = new Set<Node>()
  dependents = new Set<Node>()
  equation: unknown

  /**
   * Construct a node
   * @param id       The ID of the node
   * @param equation The node's equation contents
   */
  constructor (id: string, equation: unknown) {
    this.id = id
    this.equation = equation
  }
}
