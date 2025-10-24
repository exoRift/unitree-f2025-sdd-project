import React, { createContext, useContext, useEffect, useState } from 'react'

interface SettingsContentContext {
  horizontalOn: boolean
  setHorizontalOn: (val: boolean) => void
  darkModeOn: boolean
  setDarkModeOn: (val: boolean) => void
}

const SettingsContext = createContext<SettingsContentContext | null>(null)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [horizontalOn, setHorizontalOn] = useState<boolean>(() => {
    const storedLocally = localStorage.getItem('horizontalOn')
    return storedLocally ? JSON.parse(storedLocally) : false
  })
  const [darkModeOn, setDarkModeOn] = useState<boolean>(() => {
    const storedLocally = localStorage.getItem('darkModeOn')
    return storedLocally ? JSON.parse(storedLocally) : false
  })

  useEffect(() => {
    localStorage.setItem('horizontalOn', JSON.stringify(horizontalOn))
  }, [horizontalOn])
  useEffect(() => {
    localStorage.setItem('darkModeOn', JSON.stringify(darkModeOn))
  }, [darkModeOn])

  return (
    <SettingsContext.Provider value={{ horizontalOn, setHorizontalOn, darkModeOn, setDarkModeOn }}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * horizontalOn, setHorizontalOn, darkModeOn, and setDarkModeOn boolean
 * values are passed via SettingsContext via context
 * @returns Defined context
 */
export function useSettings () {
  const context = useContext(SettingsContext)

  return context
}
