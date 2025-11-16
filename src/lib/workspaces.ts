import type { Session, SessionManager } from './session'

export interface Workspace {
  name: string
  data: Session
  createdAt: Date
}

/**
 * Manage saved workspaces
 */
export class WorkspaceManager {
  private readonly sessionManager: SessionManager
  readonly workspaces = new Map<string, Workspace>()

  /**
   * Construct a WorkspaceManager
   * @param sessionManager The application session manager
   */
  constructor (sessionManager: SessionManager) {
    this.sessionManager = sessionManager
  }

  /**
   * Serialize workspaces and save in browser storage
   */
  private saveWorkspaces (): void {
    const arr = Array.from(this.workspaces.values())

    localStorage.setItem('workspaces:saved', JSON.stringify(arr))
  }

  /**
   * Save the current state as a named workspace
   * @param          name      The name for the workspace
   * @param          overwrite Overwrite an existing workspace if the name is taken
   * @throws {Error}           If the name provided is already taken
   */
  saveWorkspace (name: string, overwrite?: boolean): void {
    if (this.workspaces.has(name) && !overwrite) throw Error('A workspace already exists with that name')

    this.workspaces.set(name, {
      name,
      data: this.sessionManager.serialize(),
      createdAt: new Date()
    })

    this.saveWorkspaces()
  }

  /**
   * Delete a workspace with a given name
   * @param name The name of the workspace to delete
   */
  deleteWorkspace (name: string): void {
    this.workspaces.delete(name)
    this.saveWorkspaces()
  }

  /**
   * Load workspaces from storage into memory
   */
  loadFromStorage (): void {
    this.workspaces.clear()
    const saved = localStorage.getItem('workspaces:saved')
    if (saved === null) return

    const arr: Workspace[] = JSON.parse(saved)
    for (const workspace of arr) {
      this.workspaces.set(workspace.name, {
        name: workspace.name,
        data: workspace.data,
        createdAt: new Date(workspace.createdAt)
      })
    }
  }

  /**
   * Mount a workspace into the active session
   */
  recall (workspace: Workspace): void {
    this.sessionManager.loadSession(workspace.data)
  }
}
