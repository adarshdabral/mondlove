'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '../lib/session'
import { PageLoader } from './shared'

/** Renders children only for the given role; everyone else is sent to their own home. */
export function RoleGate({ role, children }: { role: 'partner' | 'admin'; children: ReactNode }) {
  const { user, loading } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (!user) router.replace(role === 'partner' ? '/partners/login' : '/login')
    else if (user.role !== role) router.replace(user.role === 'partner' ? '/partner' : user.role === 'admin' ? '/admin' : '/app')
  }, [user, loading, role, router])
  if (loading || user?.role !== role) return <PageLoader />
  return <>{children}</>
}
