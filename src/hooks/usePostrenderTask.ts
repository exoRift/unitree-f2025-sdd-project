import { useCallback, useEffect, useRef } from 'react'

/**
 * Schedule a task to run after render is complete
 * @returns pushTask(task) which takes a callback that will run after render
 */
export function usePostrenderTask (): (task: () => void) => void {
  const tasks = useRef<Array<() => void>>([])

  const pushTask = useCallback((task: () => void) => {
    tasks.current.push(task)
  }, [])

  useEffect(() => {
    for (const task of tasks.current) task()
    tasks.current = []
  })

  return pushTask
}
