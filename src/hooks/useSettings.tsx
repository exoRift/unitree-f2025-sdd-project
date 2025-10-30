import { type } from 'arktype'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const SettingsSchema = type({
  orientation: type('"horizontal" | "vertical"').default('horizontal'),
  autoSnapToNew: type.boolean.default(false),
  theme: type('"light" | "dark" | "system"').default('system')
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
    Object.fromEntries(SettingsSchema.props.map((prop) => (value: unknown) => {
      const updated = SettingsSchema({
        ...settings,
        [prop.key]: value
      })

      if (updated instanceof type.errors) throw updated.toTraversalError()

      localStorage.setItem('settings', JSON.stringify(updated))
      setSettings(updated)
    }) as any) as Setters
  , [settings, setSettings])

  return { settings, setters }
}
