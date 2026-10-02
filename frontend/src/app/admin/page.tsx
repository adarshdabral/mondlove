'use client'

import { RoleGate } from '@/components/RoleGate'
import { AdminDashboard } from '@/components/dashboards/AdminDashboard'

export default function AdminPage() {
  return (
    <RoleGate role="admin">
      <AdminDashboard />
    </RoleGate>
  )
}
