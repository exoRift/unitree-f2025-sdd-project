import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'mathlive'

import Entrypoint from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Entrypoint />
  </StrictMode>
)
