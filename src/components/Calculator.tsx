import { useCallback, useState, useContext } from 'react'
import { Button } from 'react-daisyui'

import { useCalculator } from '../hooks/useCalculator'

/**
 * The calculator component. Handles the math input and eval
 * TODO: Add instructions into the margins
 */
export function Calculator (): React.ReactNode {
  const { calculator } = useCalculator()

  const [result, setResult] = useState('--')
  const { tree } = useContext(TreeContext)
  const addToTree = useCallback((inputValue: string) => {
    console.log('Adding to tree:', inputValue)
    // if (tree.roots.length === 0) {
    tree.addNewNode(inputValue)
    // }
  }, [tree])
  const submitEquation = useCallback(() => {
    // Placeholder for submission logic
    const inputValue = (document.getElementById('eqInput') as HTMLInputElement).value
    console.log('Input Value:', inputValue)
    // TODO: Send inputValue to backend and get result (@LittleSilver33)
    const outcome = calculator.evaluateNew(inputValue)
    /* if (outcome.ok)  */setResult(outcome.toString())
    /* else setResult('Error: ' + outcome.error) */
  }, [calculator])
  const appendSymbol = useCallback((symbol: string) => {
    const input = document.getElementById('eqInput') as HTMLInputElement
    input.value += symbol
    input.focus()
  }, [])
  const negate = useCallback(() => {
    const input = document.getElementById('eqInput') as HTMLInputElement
    if (input.value.startsWith('-')) {
      input.value = input.value.slice(1)
    } else {
      input.value = '-' + input.value
    }
    input.focus()
  }, [])
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Calculator</h1>
      <p>Creating a new Node</p>
      <form onSubmit={(e) => { e.preventDefault(); submitEquation() }} className='flex gap-2 flex-wrap mb-4'>
        {/* <Input id='eqInput' className='w-full max-w-xs' /> */}
        <math-field onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEquation() } }} id='eqInput' className='w-full max-w-xs border-2'>2 + 2</math-field>
        <Button type='submit' color='primary'>Evaluate</Button>
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
      <div className='mt-4'>
        <h2 className='text-xl font-semibold'>Result:</h2>
        <p>{result}</p>
      </div>
    </div>
  )
}
