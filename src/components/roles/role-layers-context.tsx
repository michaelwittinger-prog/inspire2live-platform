'use client'

import { createContext, useContext, useMemo, useState } from 'react'

type RoleLayersContextValue = {
  platformRole: string
  congressRoles: string[]
  setCongressRoles: (roles: string[]) => void
}

const RoleLayersContext = createContext<RoleLayersContextValue | null>(null)

export function RoleLayersProvider({
  platformRole,
  children,
}: {
  platformRole: string
  children: React.ReactNode
}) {
  const [congressRoles, setCongressRoles] = useState<string[]>([])

  const value = useMemo<RoleLayersContextValue>(
    () => ({ platformRole, congressRoles, setCongressRoles }),
    [platformRole, congressRoles]
  )

  return <RoleLayersContext.Provider value={value}>{children}</RoleLayersContext.Provider>
}

export function useRoleLayers(): RoleLayersContextValue {
  const ctx = useContext(RoleLayersContext)
  if (!ctx) throw new Error('useRoleLayers must be used within RoleLayersProvider')
  return ctx
}
