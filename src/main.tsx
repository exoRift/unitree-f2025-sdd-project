import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'mathlive'

import Session from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Session />
  </StrictMode>
)
