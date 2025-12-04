import { type } from 'arktype'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const SettingsSchema = type({
  orientation: type('"horizontal" | "vertical"').default(typeof window !== 'undefined' && window.innerWidth < 500 ? 'vertical' : 'horizontal'),
  autoSnapToNew: type.boolean.default(true),
  saveSession: type.boolean.default(true)
})

export type SettingsSchema = typeof SettingsSchema.infer

export const SettingsContext = createContext({
  settings: SettingsSchema({}) as SettingsSchema,
  setSettings: (_s: SettingsSchema) => {}
})

export type Setters = {
  [K in keyof SettingsSchema]: (value: SettingsSchema[K]) => void
}

/**
 * A context for providing settings to the application from localStorage
 */
export function SettingsProvider ({ children }: React.PropsWithChildren): React.ReactNode {
  const [settings, setSettings] = useState(SettingsSchema({}) as SettingsSchema)

  useEffect(() => {
    const readValue = localStorage.getItem('settings')
    const json = (readValue && JSON.parse(readValue)) || {}

    const parsed = SettingsSchema(json)

    if (parsed instanceof type.errors) {
      console.error(parsed.toTraversalError())
      return
    }

    setSettings(parsed)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * A hook to read and update settings (also update localStorage)
 * @returns The settings and setter functions
 */
export function useSettings (): { settings: SettingsSchema, setters: Setters } {
  const { settings, setSettings } = useContext(SettingsContext)

  const setters = useMemo(() =>
    Object.fromEntries(SettingsSchema.props.map((prop) => [
      prop.key,
      (value: unknown) => {
        const updated = {
          ...settings,
          [prop.key]: value
        }
        const validated = SettingsSchema(updated)

        if (validated instanceof type.errors) throw validated.toTraversalError()

        localStorage.setItem('settings', JSON.stringify(updated))
        setSettings(validated)
      }
    ]) as any) as Setters
  , [settings, setSettings])

  return { settings, setters }
}
