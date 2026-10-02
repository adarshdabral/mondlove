'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ImagePlus, Lock, MapPin, Plus, Star, Trash2, X } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { OCCASIONS } from '@/lib/constants'
import { useApi, useSession, useToast } from '@/lib/session'
import type { Memory } from '@/lib/types'
import { useCouple } from '@/components/AppShell'
import { Button, Card, Chip, Field, Pill, Sheet, VenueArt, inputCls } from '@/components/ui'
import { EmptyState, PageHeader, PageLoader } from '@/components/shared'

const TONES: [string, string][] = [['#F6C9A8', '#E8774A'], ['#ECE8F7', '#4B3B7A'], ['#DDEEE4', '#4F8A6A'], ['#FBEFD3', '#D9A23B']]
const monthYear = (d?: string) => (d ? new Date(d).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '')

/** Photo uploads go to /api/media and are only ever served to the two partners. */
async function uploadPhoto(file: File) {
  if (file.size > 3 * 1024 * 1024) throw new Error('Photos must be under 3 MB')
  const { url } = await api<{ url: string }>('/media?kind=memory', { raw: file })
  return url
}

export default function Memories() {
  const { user } = useSession()
  const toast = useToast()
  const { data: coupleData } = useCouple()
  const { data, loading, reload } = useApi<{ memories: Memory[] }>('/memories')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<Memory | null>(null)
  const [draft, setDraft] = useState({ title: '', venue: '', occasion: 'Just because', note: '', date: new Date().toISOString().slice(0, 10), photos: [] as string[] })
  const [uploading, setUploading] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  if (!coupleData || loading) return <PageLoader />
  const partner = coupleData.couple?.partner
  if (!partner) {
    return (
      <div>
        <PageHeader eyebrow="Mingleo Memories" title="Your story" />
        <EmptyState emoji="📖" title="Memories are shared between partners" body="After a first date where you both say yes, or once you link your partner, every date becomes a memory here." action={<Link href="/app/profile#partner" className="font-semibold text-plum">Link your partner</Link>} />
      </div>
    )
  }
  const memories = data?.memories ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Mingleo Memories"
        title={`${user!.name} & ${partner.name}`}
        sub={<span className="inline-flex items-center gap-1.5 text-sm"><Lock size={13} /> Private to the two of you</span>}
        action={<Button variant="dark" icon={<Plus size={16} />} onClick={() => setOpen(true)}>Add a memory</Button>}
      />
      <div className="mb-8 grid max-w-md grid-cols-3 gap-2">
        {[[memories.length, 'dates'], [new Set(memories.map((m) => m.venue).filter(Boolean)).size, 'places'], [memories.reduce((a, m) => a + m.photos.length, 0), 'photos']].map(([n, l]) => (
          <div key={l as string} className="rounded-2xl bg-white p-3 text-center shadow-card"><div className="font-display text-2xl">{n}</div><div className="text-[11px] text-muted">{l}</div></div>
        ))}
      </div>

      {memories.length === 0 ? (
        <EmptyState emoji="✨" title="Your first chapter" body="Add a date you loved, with a note, the venue and photos." />
      ) : (
        <div className="relative pl-7">
          <div className="absolute bottom-6 left-[11px] top-4 w-0.5 bg-gradient-to-b from-ember via-plum to-line" />
          <div className="stagger grid gap-5 md:grid-cols-2">
            {memories.map((m) => (
              <div key={m.id} className="relative">
                <span className="absolute -left-7 top-5 h-6 w-6 rounded-full border-4 border-cream bg-ember md:hidden" />
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{monthYear(m.date)}</div>
                <Card onClick={() => setSel(m)} className="overflow-hidden">
                  {m.photos.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photos[0]} alt="" className="h-44 w-full object-cover" />
                  ) : (
                    <VenueArt emoji={m.emoji ?? '✨'} tone={m.tone ?? TONES[0]} className="h-32" size="lg" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-display text-xl">{m.title}</div>
                        {m.venue && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {m.venue}</div>}
                      </div>
                      {m.occasion && <Pill tone="plum">{m.occasion}</Pill>}
                    </div>
                    {m.note && <p className="mt-3 line-clamp-2 text-[13px] italic text-ink-soft">“{m.note}”</p>}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New memory">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {draft.photos.map((p) => (
              <div key={p} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button aria-label="Remove photo" onClick={() => setDraft({ ...draft, photos: draft.photos.filter((x) => x !== p) })} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white cursor-pointer"><X size={12} /></button>
              </div>
            ))}
            <button onClick={() => file.current?.click()} disabled={uploading} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-line bg-white text-muted cursor-pointer">
              {uploading ? '…' : <ImagePlus size={22} />}
            </button>
          </div>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 6)
              e.target.value = ''
              setUploading(true)
              try {
                const urls: string[] = []
                for (const f of files) urls.push(await uploadPhoto(f))
                setDraft((d) => ({ ...d, photos: [...d.photos, ...urls] }))
              } catch (err) {
                toast(errorMessage(err), 'warn')
              } finally {
                setUploading(false)
              }
            }}
          />
          <Field label="Title"><input className={inputCls} placeholder="Sunset at Skyline Terrace" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Venue"><input className={inputCls} placeholder="Skyline Terrace" value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} /></Field>
            <Field label="Date"><input className={inputCls} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
          </div>
          <div className="flex flex-wrap gap-2">{OCCASIONS.map((o) => <Chip key={o.id} size="sm" tone="plum" active={draft.occasion === o.label} onClick={() => setDraft({ ...draft, occasion: o.label })}>{o.emoji} {o.label}</Chip>)}</div>
          <Field label="Note"><textarea className={`${inputCls} h-20`} maxLength={1000} placeholder="What do you want to remember?" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
          <Button
            full
            disabled={!draft.title || uploading}
            onClick={async () => {
              try {
                await api('/memories', {
                  body: { title: draft.title, venue: draft.venue || undefined, occasion: draft.occasion, note: draft.note || undefined, date: draft.date, photos: draft.photos, emoji: OCCASIONS.find((o) => o.label === draft.occasion)?.emoji, tone: TONES[memories.length % TONES.length] },
                })
                setDraft({ title: '', venue: '', occasion: 'Just because', note: '', date: new Date().toISOString().slice(0, 10), photos: [] })
                setOpen(false)
                toast('Memory saved 💛', 'success')
                await reload()
              } catch (e) {
                toast(errorMessage(e), 'warn')
              }
            }}
          >
            Save memory
          </Button>
        </div>
      </Sheet>

      <Sheet open={!!sel} onClose={() => setSel(null)}>
        {sel && (
          <div>
            {sel.photos.length ? (
              <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {sel.photos.map((p) => <img key={p} src={p} alt="" className="h-40 w-full object-cover" />)}
              </div>
            ) : (
              <VenueArt emoji={sel.emoji ?? '✨'} tone={sel.tone ?? TONES[0]} className="h-40 rounded-3xl" size="lg" />
            )}
            <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{monthYear(sel.date)}{sel.occasion && ` · ${sel.occasion}`}</div>
            <h3 className="mt-1 font-display text-[28px] leading-tight">{sel.title}</h3>
            {sel.venue && <div className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin size={14} /> {sel.venue}</div>}
            {sel.rating && <div className="mt-2 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className={i < sel.rating! ? 'fill-gold text-gold' : 'text-line'} />)}</div>}
            {sel.note && <p className="mt-4 font-display text-[18px] italic leading-snug text-ink-soft">“{sel.note}”</p>}
            <Button
              variant="danger"
              size="sm"
              className="mt-6"
              icon={<Trash2 size={14} />}
              onClick={async () => {
                await api(`/memories/${sel.id}`, { method: 'DELETE' })
                setSel(null)
                toast('Memory deleted')
                await reload()
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
