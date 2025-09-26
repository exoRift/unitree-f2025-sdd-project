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
  idNumberIterators = new Map<string, number>()

  roots: Node[] = []
  idLookup = new Map<string, Node>()
  aliasLookup = new Map<string, Node>()

  /**
   * Generate a new incremented unique ID for a node
   * @param letterConstraint A letter to constrain the ID to
   * @mutates
   * @returns                The ID
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
   * @returns                        The created node
   */
  newNode (equation: unknown, ...dependencies: Node[]): Node {
    if (dependencies.length) {
      // If this is a descendant of more than one node, use a new letter
      const letterConstraint = dependencies.length > 1
        ? undefined
        : dependencies[0].id.match(/^\w+/)![0]

      const id = this.generateID(letterConstraint)
      const node = new Node(id, equation)
      dependencies.forEach((d) => node.addDependency(d))

      return node
    } else {
      const id = this.generateID()
      const node = new Node(id, equation)
      this.roots.push(node)

      return node
    }
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

  /**
   * Establish another node as a dependency of this node.
   * @mutates This dependency set and the dependency's dependent set
   * @param   dependency The node to depend on
   */
  addDependency (dependency: Node): void {
    this.dependencies.add(dependency)
    dependency.dependents.add(this)
  }
}
