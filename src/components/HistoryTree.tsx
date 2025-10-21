import { Fragment, useEffect } from 'react'

import { useCalculator } from '../hooks/useCalculator'
import type { TreeNode } from '../lib/history'

import { Card } from 'react-daisyui'
import Xarrow from 'react-xarrows'

/**
 * Determine if a dependency is the primary dependency of a dependent
 * @param dependency The dependency
 * @param dependent  The dependent
 * @returns          true if primary
 */
function isPrimaryDependency (dependency: TreeNode, dependent: TreeNode): boolean {
  let mostRecent: TreeNode | undefined

  for (const dep of dependent.dependencies) {
    if (!mostRecent) {
      mostRecent = dep
      continue
    }

    if (dep.lastModified > mostRecent.lastModified) mostRecent = dep
  }

  return dependency === mostRecent
}

/**
 * A TreeNode
 * @param props
 * @param props.node The node
 */
function VisualNode ({ node }: { node: TreeNode }): React.ReactNode {
  return (
    <div className='flex flex-col items-center gap-24'>
      <Card id={`node_${node.id}`} className='relative bg-neutral text-neutral-content w-48 shrink-0 h-28 p-2'>
        <Card.Title>
          <dt className='font-bold'>{node.id}</dt>
        </Card.Title>
        <math-field readonly className='bg-transparent text-neutral-content'>{node.rawUserEquation}</math-field>
      </Card>

      <div className='flex gap-12 empty:hidden'>
        {Array.from(node.dependents).map((n) => {
          const isPrimary = isPrimaryDependency(node, n)

          return (
            <Fragment key={n.id}>
              <Xarrow divContainerStyle={{ zIndex: -1 }} start={`node_${node.id}`} end={`node_${n.id}`} startAnchor='bottom' endAnchor='top' headSize={3} color={isPrimary ? 'var(--color-secondary)' : 'var(--color-accent)'} />

              {isPrimary && <VisualNode node={n} />}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The history tree component. Handles the history
 */
export function HistoryTree (): React.ReactNode {
  const { tree, calculator } = useCalculator()

  useEffect(() => {
    if (window.foo) return
    window.foo = true
    const a = tree.addNewNode('1', calculator.engine.parse('1'))
    const b = tree.addNewNode('2', calculator.engine.parse('2'), a)
    const c = tree.addNewNode('3', calculator.engine.parse('3'), a)

    const v = tree.addNewNode('A', calculator.engine.parse('3'), b)
    const w = tree.addNewNode('B', calculator.engine.parse('3'), b, a)
    const x = tree.addNewNode('C', calculator.engine.parse('3'), b)
    const y = tree.addNewNode('D', calculator.engine.parse('3'), c)
    const z = tree.addNewNode('E', calculator.engine.parse('3'), b)

    const d = tree.addNewNode('4', calculator.engine.parse('4'))
    const e = tree.addNewNode('5', calculator.engine.parse('5'), d)
    const f = tree.addNewNode('6', calculator.engine.parse('6'), e)
    const g = tree.addNewNode('7', calculator.engine.parse('7'), e)
  }, [])

  return (
    <div className='h-full flex flex-col'>
      <div className='relative h-0 grow overflow-auto flex gap-12 p-8'>
        {Array.from(tree.roots).map((n) => (
          <VisualNode key={n.id} node={n} />
        ))}
      </div>
    </div>
  )
}
