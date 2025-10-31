import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { BoxedExpression } from '@cortex-js/compute-engine'

import { useCalculator } from '../hooks/useCalculator'

import type { MathfieldElement } from 'mathlive'
import { DynamicMathfield } from './HistoryTree/VisualNode'
import { Button, Modal } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

/**
 * A component that displays a modal the first time an implicit dependency is formed
 */
function ImplicitNotifier (): React.ReactNode {
  const { tree } = useCalculator()
  const { Dialog, handleShow, handleHide } = Modal.useDialog()

  const dismiss = useCallback(() => {
    handleHide()
    localStorage.setItem('tips:implicit', 'true')
  }, [handleHide])

  useEffect(() => {
    const dismissed = localStorage.getItem('tips:implicit')
    if (dismissed === 'true') return

    const aborter = new AbortController()

    tree.addEventListener('implicit', () => {
      setTimeout(handleShow, 500)
      aborter.abort()
    }, { signal: aborter.signal })

    return () => aborter.abort()
  }, [tree, handleShow])

  return (
    <Dialog>
      <Modal.Header>
        <h1>Implicit Dependency</h1>
      </Modal.Header>

      <Modal.Body>
        <p>
          You've created an implicit dependency! This happens if you use the immediate last value
          you computed in another equation. If you want to undo this, you can edit the node you created.
          <br />
          <br />
          If you want to avoid this behavior altogether, change it in the settings.
        </p>
      </Modal.Body>

      <Modal.Actions>
        <Button color='primary' onClick={dismiss}>Okay, don't show this again</Button>
      </Modal.Actions>
    </Dialog>
  )
}

/**
 * The calculator component. Handles the math input and eval
 * TODO: Add instructions into the margins
 */
export function Calculator (): React.ReactNode {
  const { tree, calculator } = useCalculator()

  const [errors, setErrors] = useState<readonly BoxedExpression[]>()

  const submitEquation = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const input = document.getElementById('eqInput') as MathfieldElement
    if (!input.value) return
    const [, outcome] = calculator.saveNewExpression(input.value)

    if (outcome.isValid) {
      setErrors(undefined)
      input.setValue('')
    } else setErrors(outcome.errors)
  }, [calculator])

  const appendSymbol = useCallback((symbol: string) => {
    const input = document.getElementById('eqInput') as MathfieldElement
    input.insert(symbol, { focus: true })
  }, [])

  const negate = useCallback(() => {
    const input = document.getElementById('eqInput') as MathfieldElement
    let value = input.value
    let position = input.selection.ranges[0]?.[0] ?? 1
    do {
      --position
    } while (position >= 0 && value[position].match(/[0-9.]/))

    if (value[Math.max(0, position)] === '-') value = value.slice(0, position) + value.slice(position + 1, value.length)
    else value = value.slice(0, position + 1) + '-' + value.slice(position + 1, value.length)

    input.setValue(value)
    input.focus()
  }, [])

  const updatePreview = useCallback((e: FormEvent<MathfieldElement>) => {
    const preview = document.getElementById('eqPreview') as MathfieldElement
    if (!e.currentTarget.value) {
      preview.setValue('')
      return
    }

    const [, outcome] = calculator.evaluateExpression(e.currentTarget.value)

    preview.setValue(e.currentTarget.value ? outcome.N().toLatex() : '')
  }, [calculator])

  return (
    <div className='p-4'>
      <ImplicitNotifier />

      <h1 className='text-2xl font-semibold mb-4'>Enter an equation below...</h1>
      <form onSubmit={submitEquation} className='mb-4'>
        <div className='flex gap-4 mb-4'>
          <math-field onInput={updatePreview} onKeyDown={(e) => e.key === 'Enter' && !e.defaultPrevented && e.currentTarget.closest('form')?.requestSubmit()} data-gramm='false' id='eqInput' className='w-2/3 grow border-2' />
          <span className='font-bold text-xl leading-none opacity-50 self-center'>=</span>
          <math-field id='eqPreview' read-only className='w-1/3 grow opacity-50 border text-xl' />
        </div>

        <div className='flex gap-4 justify-between'>
          <Button type='submit' color='primary' className='pl-3'>
            <div className='symbol'>subdirectory_arrow_left</div>
            <span>Evaluate & Save</span>
          </Button>

          {errors
            ? (
              <p className='text-error' key='result'>
                {errors.map((e, i) => (
                  <span key={i} className='not-last:after:content-["_|_"] after:text-base-content/50 after:font-bold'>{e.toString()}</span>
                ))}
              </p>
            )
            : tree.lastCreatedNode
              ? (
                <p className='opacity-60 inline-flex items-start' key='result'>
                  <math-field read-only>{'\\text{Last equation: }'}</math-field>
                  <DynamicMathfield className='text-base-content' node={tree.lastCreatedNode} showNumeric />
                </p>
              )
              : null}
        </div>
      </form>
      <div className='flex max-lg:flex-col max-lg:items-center justify-center gap-4'>
        <div id='container' className='grid grid-cols-4 gap-1 place-items-center'>
          {[
            { label: 'cos', symbol: '\\cos{\\placeholder{}}', italic: true },
            { label: 'sin', symbol: '\\sin{\\placeholder{}}', italic: true },
            { label: 'tan', symbol: '\\tan{\\placeholder{}}', italic: true },
            { label: 'θ', symbol: '\\theta', italic: true },
            { label: 'e', symbol: 'e' },
            { label: '\\ln', symbol: '\\ln{\\placeholder{}}' },
            { label: '\\log', symbol: '\\log{\\placeholder{}}' },
            { label: '\\pi', symbol: '\\pi' },
            { label: '\\sqrt{\\placeholder{}}', symbol: '\\sqrt{\\placeholder{}}' },
            { label: 'x^\\placeholder{}', symbol: 'x^{\\placeholder{}}' },
            { label: '{\\placeholder{}}^2', symbol: '{\\placeholder{}}^2' },
            { label: '\\tiny{\\frac{\\placeholder{}}{{\\placeholder{}}}}', symbol: '\\frac{\\placeholder{}}{{\\placeholder{}}}', inflate: true },
            { label: '\\frac{d}{dx}', symbol: '(\\Box)\\prime' },
            { label: '∫', symbol: '\\int{\\placeholder{}}dx' },
            { label: '\\int_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}', symbol: '\\int_{\\placeholder{}}^{\\placeholder{}}\\placeholder{} dx' },
            { label: '{\\placeholder{}}!', symbol: '{\\placeholder{}}!' }
          ].map((btn, i) => (
            <Button
              key={i}
              color='neutral'
              className={twMerge('w-20 h-20 text-2xl', btn.italic && 'italic', btn.inflate && 'text-4xl')}
              onClick={() => appendSymbol(btn.symbol)}
            >
              <math-field read-only className='bg-transparent text-white pointer-events-none'>
                {btn.label}
              </math-field>
            </Button>
          ))}
        </div>
        <div id='container' className='grid grid-cols-4 gap-1 place-items-center'>
          {[
            '4', '5', '6', '/', '7', '8', '9', '*', '1', '2', '3', '+', '+/-', '0', '.', '-'
          ].map((label, i) => (
            <Button
              key={i}
              color='neutral'
              className={twMerge('w-20 h-20 text-2xl', ['*', '/', '+', '-'].includes(label) && 'brightness-150')}
              onClick={() => {
                if (label === '+/-') negate()
                else appendSymbol(label)
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
