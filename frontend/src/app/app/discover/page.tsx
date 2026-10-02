'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { EyeOff, Info } from 'lucide-react'
import { useApi, useSession } from '@/lib/session'
import type { Person } from '@/lib/types'
import { EmptyState, ErrorState, PageHeader, PageLoader, PersonCard } from '@/components/shared'

const FILTERS = ['Top matches', 'Nearby', 'Verified', 'Long-term', 'Café hoppers', 'Momo lovers'] as const

export default function Discover() {
  const { user } = useSession()
  const { data, error, loading, reload } = useApi<{ people: Person[]; disclaimer: string }>('/users/discover')
  const [f, setF] = useState<(typeof FILTERS)[number]>('Top matches')

  const list = useMemo(() => {
    const l = [...(data?.people ?? [])]
    if (f === 'Nearby') return l.filter((p) => p.distanceKm != null).sort((a, b) => a.distanceKm! - b.distanceKm!)
    if (f === 'Verified') return l.filter((p) => p.verified)
    if (f === 'Long-term') return l.filter((p) => p.intention === 'Something long-term')
    if (f === 'Café hoppers') return l.filter((p) => p.interests.some((i) => i.label === 'Café hopping') || p.datePrefs.includes('Café hopping'))
    if (f === 'Momo lovers') return l.filter((p) => p.interests.some((i) => i.label === 'Momos') || p.food.includes('Momos & street food'))
    return l
  }, [data, f])

  if (user?.mode === 'couple') {
    return <EmptyState emoji="💞" title="Discover is for meeting someone new" body="You're in Couple Mode. Switch to “Both” in your profile if you'd like to meet people too." action={<Link href="/app/profile" className="font-semibold text-ember">Open profile</Link>} />
  }

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Know them before you see them." sub={<span className="inline-flex items-center gap-2 text-sm"><EyeOff size={15} className="text-plum" /> Photos stay hidden until you both agree to a date.</span>} />
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
        {FILTERS.map((x) => (
          <button key={x} onClick={() => setF(x)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${f === x ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft'}`}>{x}</button>
        ))}
      </div>
      {loading && <PageLoader label="Finding your people…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (list.length ? (
        <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((p) => <PersonCard key={p.id} p={p} />)}</div>
      ) : (
        <EmptyState emoji="🌙" title="No one here yet" body="Try another filter, or check back tomorrow for new people." />
      ))}
      {data && (
        <p className="mt-8 flex items-start gap-2 text-xs text-muted"><Info size={14} className="mt-0.5 shrink-0" /> {data.disclaimer}</p>
      )}
    </div>
  )
}
