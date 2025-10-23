import { useCallback, useState, type FormEvent } from 'react'
import { Button } from 'react-daisyui'

import { useCalculator } from '../hooks/useCalculator'
import type { MathfieldElement } from 'mathlive'
import { DynamicMathfield } from './HistoryTree/VisualNode'
import type { BoxedExpression } from '@cortex-js/compute-engine'

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
    input.insert('-', { insertionMode: 'insertBefore', focus: true })
  }, [])

  const updatePreview = useCallback((e: FormEvent<MathfieldElement>) => {
    const preview = document.getElementById('eqPreview') as MathfieldElement

    const [, outcome] = calculator.evaluateExpression(e.currentTarget.value)

    preview.setValue(e.currentTarget.value ? outcome.toLatex() : '')
  }, [calculator])

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Enter an equation below...</h1>
      <form onSubmit={submitEquation} className='mb-4'>
        <div className='flex gap-4 mb-4'>
          <math-field onInput={updatePreview} onKeyDown={(e) => e.key === 'Enter' && !e.defaultPrevented && e.currentTarget.closest('form')?.requestSubmit()} data-gramm='false' id='eqInput' className='w-2/3 grow border-2' />
          <span className='font-bold text-xl leading-none opacity-50 self-center'>=</span>
          <math-field id='eqPreview' read-only className='w-1/3 grow opacity-50 border text-xl' />
        </div>

        <div className='flex gap-4 justify-between'>
          <Button type='submit' color='primary'>Evaluate & Save</Button>

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
                  <DynamicMathfield className='text-base-content' node={tree.lastCreatedNode} />
                </p>
              )
              : null}
        </div>
      </form>

      <div id='container' className='grid grid-cols-4 gap-2 mt-4 aspect-square *:h-auto max-w-96 *:text-2xl'>
        <Button color='neutral' onClick={() => appendSymbol('7')}>7</Button>
        <Button color='neutral' onClick={() => appendSymbol('8')}>8</Button>
        <Button color='neutral' onClick={() => appendSymbol('9')}>9</Button>
        <Button color='neutral' onClick={() => appendSymbol('*')}>*</Button>
        <Button color='neutral' onClick={() => appendSymbol('4')}>4</Button>
        <Button color='neutral' onClick={() => appendSymbol('5')}>5</Button>
        <Button color='neutral' onClick={() => appendSymbol('6')}>6</Button>
        <Button color='neutral' onClick={() => appendSymbol('/')}>/</Button>
        <Button color='neutral' onClick={() => appendSymbol('1')}>1</Button>
        <Button color='neutral' onClick={() => appendSymbol('2')}>2</Button>
        <Button color='neutral' onClick={() => appendSymbol('3')}>3</Button>
        <Button color='neutral' onClick={() => appendSymbol('+')}>+</Button>
        <Button color='neutral' onClick={negate}>+/-</Button>
        <Button color='neutral' onClick={() => appendSymbol('0')}>0</Button>
        <Button color='neutral' onClick={() => appendSymbol('.')}>.</Button>
        <Button color='neutral' onClick={() => appendSymbol('-')}>-</Button>
      </div>
    </div>
  )
}
