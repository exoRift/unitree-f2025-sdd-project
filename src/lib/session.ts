import { HistoryCalculator } from './calculator'
import { type SerializedTree, Tree } from './history'

/**
 * Manages the state of the application
 */
export class SessionManager extends EventTarget {
  private readonly saveIntervalMs: number
  private queued = false

  tree: Tree
  calculator: HistoryCalculator

  /**
   * Construct a session manager
   * @param saveDelayMs The delay between mutation and save
   */
  constructor (saveDelayMs = 500) {
    super()

    this.tree = new Tree()
    this.calculator = new HistoryCalculator(this.tree)
    this.saveIntervalMs = saveDelayMs
  }

  /**
   * Schedule a save event to take place
   */
  private scheduleSave (): void {
    if (this.queued) return
    this.dispatchEvent(new CustomEvent('saving'))
    this.queued = true

    setTimeout(() =>
      requestIdleCallback(() => {
        this.save()
        this.queued = false
        this.dispatchEvent(new CustomEvent('saved'))
      })
    , this.saveIntervalMs)
  }

  /**
   * Save the current tree state
   */
  save (): void {
    localStorage.setItem('session:state', JSON.stringify(this.tree.serialize()))
  }

  /**
   * Recall the tree state from storage
   */
  recall (): void {
    const old = localStorage.getItem('session:state')

    if (old) {
      const parsed = JSON.parse(old) as SerializedTree
      this.tree = new Tree(parsed)
      this.calculator.tree = this.tree
      for (const node of this.tree.roots) this.calculator.refreshNode(node)
    }
  }

  /**
   * Start listening on mutations to auto save
   */
  startAutosaving (): void {
    this.tree.addEventListener('mutate', this.scheduleSave.bind(this))
  }

  /**
   * Stop listening on mutations
   */
  stopAutosaving (): void {
    this.tree.removeEventListener('mutate', this.scheduleSave.bind(this))
  }

  /**
   * Clear the active session
   */
  clear (): void {
    this.tree.clear()
  }
}
