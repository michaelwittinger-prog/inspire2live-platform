'use client'

import { useEffect } from 'react'
import { useRoleLayers } from './role-layers-context'

export function SetCongressRoles({ roles }: { roles: string[] }) {
  const { setCongressRoles } = useRoleLayers()

  useEffect(() => {
    setCongressRoles(roles)
    return () => setCongressRoles([])
  }, [roles, setCongressRoles])

  return null
}
