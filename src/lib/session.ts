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
   * Serialize the current state
   * @returns The state in serialized object form
   */
  serialize (): SerializedTree {
    return this.tree.serialize()
  }

  /**
   * Save the current tree state
   */
  save (): void {
    localStorage.setItem('workspaces:session', JSON.stringify(this.serialize()))
  }

  /**
   * Recall the tree state from storage
   */
  recall (): void {
    const stored = localStorage.getItem('workspaces:session')

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SerializedTree
        this.loadSession(parsed)
      } catch (err) {
        console.error('Stored session corrupted', err, stored)
        localStorage.removeItem('workspaces:session')
      }
    }
  }

  /**
   * Load a session from its serialized data
   * @param data The serialized data
   */
  loadSession (data: SerializedTree): void {
    this.tree.loadSerialized(data)
    for (const root of this.tree.roots) this.calculator.refreshNode(root)
  }

  /**
   * Start listening on mutations to auto save
   */
  startAutosaving (): void {
    this.tree.addEventListener('mutate', this.scheduleSave.bind(this), { passive: true })
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
