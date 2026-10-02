'use client'

import { useApi } from '@/lib/session'
import { RoleGate } from '@/components/RoleGate'
import { ErrorState, PageLoader } from '@/components/shared'
import { PartnerDashboard, type PartnerLive } from '@/components/dashboards/PartnerDashboard'

function Partner() {
  const { data, error, reload } = useApi<PartnerLive>('/partner/dashboard')
  if (error) return <div className="p-10"><ErrorState message={error} onRetry={reload} /></div>
  if (!data) return <PageLoader label="Loading your venue…" />
  return <PartnerDashboard initial={data} />
}

export default function PartnerPage() {
  return (
    <RoleGate role="partner">
      <Partner />
    </RoleGate>
  )
}
