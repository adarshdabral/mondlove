'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, CircleAlert, ImagePlus, Plus, Star, Trash2 } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { prepareImage } from '@/lib/image'
import { inr } from '@/lib/constants'
import { useSession, useToast } from '@/lib/session'
import type { GoodToKnow, OpeningHours, Package, Treat, Venue, VenuePolicies } from '@/lib/types'
import { RoleGate } from '@/components/RoleGate'
import { Button, Chip, Field, Logo, Progress, inputCls } from '@/components/ui'
import { PageLoader } from '@/components/shared'
import { DietMark, VenueDetails } from '@/components/VenueDetails'

interface Listing {
  id: string
  status: 'draft' | 'pending' | 'verified' | 'suspended'
  kind: Venue['kind']
  name: string
  category: string
  area: string
  description: string
  address: string
  landmark: string
  mapsUrl: string
  phone: string
  priceForTwo: number | null
  ambience: string[]
  hours: OpeningHours | null
  slots: string[]
  photos: { url: string; caption?: string }[]
  treats: Treat[]
  goodToKnow: GoodToKnow
  policies: VenuePolicies
  licence: { fssai?: string; gst?: string }
}
type Options = Record<'food' | 'alcohol' | 'seating' | 'vibe' | 'payment' | 'parking' | 'accessibility' | 'amenities' | 'safety' | 'cancellation' | 'lateArrival' | 'days', string[]>
interface ListingRes {
  venue: Listing
  packages: Package[]
  missing: string[]
  options: Options
  limits: { minPhotos: number; minMenu: number; maxPhotos: number; maxMenu: number }
}

const STEPS = ['About & timings', 'Venue photos', 'Menu', 'Good to know', 'Package & submit']
const AMBIENCE_IDEAS = ['Cosy corners', 'Mountain view', 'Fairy lights', 'Book nook', 'Live music', 'Rooftop', 'Garden seating', 'Quiet', 'Lively', 'Photo-worthy', 'Bonfire', 'Pet friendly']
/** Half-hour times from 6:00 AM to 11:30 PM. */
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const m = 6 * 60 + i * 30
  const h = Math.floor(m / 60)
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
})
const toggle = (xs: string[] = [], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

function Setup() {
  const router = useRouter()
  const toast = useToast()
  const { logout } = useSession()
  const [data, setData] = useState<ListingRes | null>(null)
  const [l, setL] = useState<Listing | null>(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api<ListingRes>('/partner/venue')
      .then((d) => {
        setData(d)
        setL(d.venue)
      })
      .catch((e) => toast(errorMessage(e), 'warn'))
  }, [toast])

  if (!data || !l) return <PageLoader label="Loading your listing…" />
  const o = data.options
  const isFood = l.kind !== 'activity'
  const set = (p: Partial<Listing>) => setL((x) => (x ? { ...x, ...p } : x))
  const setG = (p: Partial<GoodToKnow>) => set({ goodToKnow: { ...l.goodToKnow, ...p } })
  const setP = (p: Partial<VenuePolicies>) => set({ policies: { ...l.policies, ...p } })

  /** Saves the fields that belong to the current step. */
  const save = async () => {
    const bodies: Record<number, object> = {
      0: {
        description: l.description, address: l.address, landmark: l.landmark, mapsUrl: l.mapsUrl, phone: l.phone, ambience: l.ambience,
        ...(l.priceForTwo ? { priceForTwo: l.priceForTwo } : {}), ...(l.hours?.days.length ? { hours: l.hours } : {}), ...(l.slots.length ? { slots: l.slots } : {}),
      },
      1: { photos: l.photos },
      2: { treats: l.treats.filter((t) => t.name.trim()).map((t) => ({ ...t, price: t.price || undefined })) },
      3: { goodToKnow: l.goodToKnow, policies: l.policies },
      4: { licence: { fssai: l.licence.fssai ?? '', gst: l.licence.gst ?? '' } },
    }
    const d = await api<ListingRes>('/partner/venue', { method: 'PATCH', body: bodies[step] })
    setData(d)
    return d
  }

  const next = async () => {
    setBusy(true)
    try {
      await save()
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0 })
    } catch (e) {
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    setBusy(true)
    try {
      await save()
      await api('/partner/venue/submit', { method: 'POST' })
      setDone(true)
    } catch (e) {
      // The API returns the list of missing items; reload so the checklist is current.
      const fresh = await api<ListingRes>('/partner/venue').catch(() => null)
      if (fresh) setData(fresh)
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
        <div className="max-w-md">
          <CheckCircle2 size={56} className="mx-auto text-sage" />
          <h1 className="mt-5 font-display text-[34px] leading-tight">Listing submitted 🎉</h1>
          <p className="mt-3 text-ink-soft">Our team will check your photos, menu and licence, usually within two working days. You can set up availability and more packages in the meantime.</p>
          <Button className="mt-8" onClick={() => router.replace('/partner')}>Go to your dashboard</Button>
        </div>
      </div>
    )
  }

  const live = l.status !== 'draft'

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-4 text-[13px]">
            {live && <Link href="/partner" className="font-semibold text-ember">Back to dashboard</Link>}
            <button onClick={async () => { await logout(); router.replace('/partners/login') }} className="text-muted hover:text-ink cursor-pointer">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-40 pt-8">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">{live ? 'Edit your listing' : 'Set up your listing'} · {l.name}</div>
        <h1 className="mt-2 font-display text-[32px] leading-tight">{STEPS[step]}</h1>
        {live && <p className="mt-1 text-sm text-ink-soft">{l.status === 'pending' ? 'Your listing is with our team. Changes save as you go.' : 'Your listing is live. Changes appear for guests as soon as you save.'}</p>}
        <div className="mt-5"><Progress step={step + 1} total={STEPS.length} /></div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button key={s} onClick={async () => { if (i === step) return; setBusy(true); try { await save(); setStep(i) } catch (e) { toast(errorMessage(e), 'warn') } finally { setBusy(false) } }} className={`rounded-full px-3 py-1 text-[12px] font-semibold cursor-pointer ${i === step ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div key={step} className="mt-8 animate-fade-up space-y-6">
          {step === 0 && <AboutStep l={l} set={set} />}
          {step === 1 && <PhotosStep l={l} set={set} limits={data.limits} />}
          {step === 2 && <MenuStep l={l} set={set} isFood={isFood} limits={data.limits} />}
          {step === 3 && <GoodToKnowStep l={l} o={o} setG={setG} setP={setP} isFood={isFood} />}
          {step === 4 && <PackageStep l={l} set={set} data={data} setData={setData} isFood={isFood} />}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Button variant="ghost" disabled={step === 0 || busy} icon={<ArrowLeft size={15} />} onClick={() => setStep(step - 1)}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={busy} onClick={next}>{busy ? 'Saving…' : <>Save &amp; continue <ArrowRight size={15} /></>}</Button>
          ) : l.status === 'draft' ? (
            <Button variant="dark" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit for verification'}</Button>
          ) : (
            <Button disabled={busy} onClick={async () => { setBusy(true); try { await save(); toast('Saved', 'success'); router.push('/partner') } catch (e) { toast(errorMessage(e), 'warn') } finally { setBusy(false) } }}>Save changes</Button>
          )}
        </div>
      </footer>
    </div>
  )
}

/* ---------------- Step 1: About & timings ---------------- */

function AboutStep({ l, set }: { l: Listing; set: (p: Partial<Listing>) => void }) {
  const [custom, setCustom] = useState('')
  const hours = l.hours ?? { days: [], open: '10:00 AM', close: '10:00 PM' }
  return (
    <>
      <Field label="Describe your venue for someone planning a date" hint={`${l.description.length}/600. What makes it good for a date? The vibe, the view, the best seats, what to order.`}>
        <textarea className={`${inputCls} h-32`} maxLength={600} value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="A two-floor café with a deck that looks at the Mussoorie hills. Quiet corners downstairs for long conversations…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full address"><input className={inputCls} value={l.address} onChange={(e) => set({ address: e.target.value })} placeholder="112 Rajpur Road, Dehradun 248001" /></Field>
        <Field label="Landmark" hint="Helps people find you on a first date."><input className={inputCls} value={l.landmark} onChange={(e) => set({ landmark: e.target.value })} placeholder="Opposite the Jakhan bus stop, first floor" /></Field>
        <Field label="Google Maps link (optional)"><input className={inputCls} value={l.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></Field>
        <Field label="Venue phone" hint="Shared with guests only once they have a booking."><input className={inputCls} inputMode="tel" value={l.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 135 274 1234" /></Field>
        <Field label="Average price for two (₹)" hint="Shown to the person booking, never on invitations."><input className={inputCls} type="number" min={50} value={l.priceForTwo ?? ''} onChange={(e) => set({ priceForTwo: e.target.value ? Number(e.target.value) : null })} placeholder="500" /></Field>
      </div>

      <Field label="Ambience (up to 8)" group>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...AMBIENCE_IDEAS, ...l.ambience])].map((a) => (
            <Chip key={a} size="sm" active={l.ambience.includes(a)} onClick={() => (l.ambience.includes(a) || l.ambience.length < 8) && set({ ambience: toggle(l.ambience, a) })}>{a}</Chip>
          ))}
        </div>
        <div className="mt-2 flex max-w-sm gap-2">
          <input className={inputCls} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own" maxLength={30} />
          <Button variant="soft" disabled={custom.trim().length < 2 || l.ambience.length >= 8} onClick={() => { set({ ambience: [...l.ambience, custom.trim()] }); setCustom('') }}><Plus size={16} /></Button>
        </div>
      </Field>

      <div className="rounded-3xl border border-line bg-white p-5">
        <div className="text-[14px] font-semibold">Opening hours</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <Chip key={d} size="sm" tone="ink" active={hours.days.includes(d)} onClick={() => set({ hours: { ...hours, days: toggle(hours.days, d) } })}>{d}</Chip>)}
        </div>
        <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
          <Field label="Opens"><select className={inputCls} value={hours.open} onChange={(e) => set({ hours: { ...hours, open: e.target.value } })}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Closes"><select className={inputCls} value={hours.close} onChange={(e) => set({ hours: { ...hours, close: e.target.value } })}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
      </div>

      <Field label="Date slots: when can couples book a table?" hint="Pick up to 8 start times. You can set seats per slot later under Availability." group>
        <div className="flex flex-wrap gap-1.5">
          {TIMES.map((t) => <Chip key={t} size="sm" active={l.slots.includes(t)} onClick={() => (l.slots.includes(t) || l.slots.length < 8) && set({ slots: toggle(l.slots, t) })}>{t}</Chip>)}
        </div>
      </Field>
    </>
  )
}

/* ---------------- Step 2: Photos ---------------- */

function Uploader({ kind, onUploaded, children, multiple = false, disabled }: { kind: 'venue' | 'menu'; onUploaded: (urls: string[]) => void; children: (busy: boolean) => React.ReactNode; multiple?: boolean; disabled?: boolean }) {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <button type="button" disabled={busy || disabled} onClick={() => input.current?.click()} aria-label={kind === 'menu' ? 'Upload a photo of this item' : 'Upload venue photos'} className="block shrink-0 rounded-2xl text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-ember disabled:cursor-not-allowed">{children(busy)}</button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          const urls: string[] = []
          try {
            for (const f of files) {
              const blob = await prepareImage(f)
              urls.push((await api<{ url: string }>(`/media?kind=${kind}`, { raw: blob })).url)
            }
          } catch (err) {
            toast(errorMessage(err), 'warn')
          } finally {
            if (urls.length) onUploaded(urls)
            setBusy(false)
          }
        }}
      />
    </>
  )
}

function PhotosStep({ l, set, limits }: { l: Listing; set: (p: Partial<Listing>) => void; limits: ListingRes['limits'] }) {
  const room = limits.maxPhotos - l.photos.length
  const move = (i: number, d: number) => {
    const p = [...l.photos]
    ;[p[i], p[i + d]] = [p[i + d], p[i]]
    set({ photos: p })
  }
  return (
    <>
      <div className="rounded-3xl bg-gold-soft/70 p-5 text-[14px]">
        <div className="font-semibold">What works best ({limits.minPhotos}–{limits.maxPhotos} photos)</div>
        <ul className="mt-2 grid gap-1 text-ink-soft sm:grid-cols-2">
          <li>✓ The entrance, so people recognise it</li>
          <li>✓ The table or corner couples will sit at</li>
          <li>✓ The space in daylight and in the evening</li>
          <li>✓ The view, deck or anything special</li>
        </ul>
        <p className="mt-2 text-[12px] text-muted">Use real photos of your venue: no stock images, no people’s faces without their consent. Food photos go in the next step.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {l.photos.map((p, i) => (
          <div key={p.url} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="relative aspect-[4/3] bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white"><Star size={10} className="fill-white" /> Cover</span>}
            </div>
            <div className="space-y-2 p-2">
              <input className="w-full rounded-lg border border-line px-2 py-1.5 text-[12px] outline-none focus:border-ember" maxLength={80} placeholder="Caption (e.g. Couple table)" value={p.caption ?? ''} onChange={(e) => set({ photos: l.photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} />
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="rounded-md px-2 py-1 hover:bg-sand disabled:opacity-30 cursor-pointer">←</button>
                  <button type="button" disabled={i === l.photos.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="rounded-md px-2 py-1 hover:bg-sand disabled:opacity-30 cursor-pointer">→</button>
                  {i > 0 && <button type="button" onClick={() => set({ photos: [p, ...l.photos.filter((_, j) => j !== i)] })} className="rounded-md px-2 py-1 font-semibold text-ember hover:bg-sand cursor-pointer">Make cover</button>}
                </div>
                <button type="button" aria-label="Remove photo" onClick={() => set({ photos: l.photos.filter((_, j) => j !== i) })} className="rounded-md p-1 text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {room > 0 && (
          <Uploader kind="venue" multiple onUploaded={(urls) => set({ photos: [...l.photos, ...urls.slice(0, room).map((url) => ({ url }))] })}>
            {(busy) => (
              <span className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-line bg-white text-center text-muted hover:border-ink/30">
                <span className="flex flex-col items-center gap-1 text-[13px] font-semibold">{busy ? 'Uploading…' : <><ImagePlus size={24} /> Add photos</>}</span>
              </span>
            )}
          </Uploader>
        )}
      </div>
      <p className="text-[12px] text-muted">{l.photos.length} of {limits.maxPhotos}. Photos are resized automatically. The first photo is the cover people see first.</p>
    </>
  )
}

/* ---------------- Step 3: Menu ---------------- */

function MenuStep({ l, set, isFood, limits }: { l: Listing; set: (p: Partial<Listing>) => void; isFood: boolean; limits: ListingRes['limits'] }) {
  const update = (i: number, p: Partial<Treat>) => set({ treats: l.treats.map((t, j) => (j === i ? { ...t, ...p } : t)) })
  return (
    <>
      <p className="text-[14px] text-ink-soft">
        {isFood
          ? 'Add your best dishes and drinks with photos. On a Mingleo proposal, each person picks one of these for the other to try, so make them tempting.'
          : 'List what couples can do here, with photos. People pick these when they plan a date at your venue.'}{' '}
        At least {limits.minMenu}, up to {limits.maxMenu}.
      </p>
      <div className="space-y-3">
        {l.treats.map((t, i) => (
          <div key={i} className="flex gap-3 rounded-3xl border border-line bg-white p-3">
            <Uploader kind="menu" onUploaded={([url]) => update(i, { photo: url })}>
              {(busy) =>
                t.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photo} alt={t.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-line text-muted hover:border-ink/30">
                    <span className="flex flex-col items-center text-[11px] font-semibold">{busy ? '…' : <><Camera size={20} /> Photo</>}</span>
                  </span>
                )
              }
            </Uploader>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[64px_1fr_110px]">
              <input aria-label="Emoji" className="rounded-xl border border-line px-2 py-2 text-center text-lg outline-none focus:border-ember" maxLength={4} value={t.emoji} onChange={(e) => update(i, { emoji: e.target.value })} />
              <input aria-label="Name" className="rounded-xl border border-line px-3 py-2 text-[14px] outline-none focus:border-ember" maxLength={50} placeholder={isFood ? 'Kulhad chai' : 'Wheel throwing'} value={t.name} onChange={(e) => update(i, { name: e.target.value })} />
              <input aria-label="Price" type="number" min={0} className="rounded-xl border border-line px-3 py-2 text-[14px] outline-none focus:border-ember" placeholder="₹ price" value={t.price ?? ''} onChange={(e) => update(i, { price: e.target.value ? Number(e.target.value) : undefined })} />
              <input aria-label="Description" className="rounded-xl border border-line px-3 py-2 text-[13px] outline-none focus:border-ember sm:col-span-3" maxLength={100} placeholder="One line that makes someone want to try it" value={t.note ?? ''} onChange={(e) => update(i, { note: e.target.value })} />
              <div className="flex flex-wrap items-center gap-1.5 sm:col-span-3">
                {isFood && (['veg', 'egg', 'nonveg'] as const).map((d) => (
                  <Chip key={d} size="sm" tone="ink" active={t.diet === d} onClick={() => update(i, { diet: t.diet === d ? undefined : d })}>
                    <DietMark diet={d} /> {d === 'veg' ? 'Veg' : d === 'egg' ? 'Egg' : 'Non-veg'}
                  </Chip>
                ))}
                <button type="button" onClick={() => set({ treats: l.treats.filter((_, j) => j !== i) })} className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 size={13} /> Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {l.treats.length < limits.maxMenu && (
        <Button variant="outline" icon={<Plus size={16} />} onClick={() => set({ treats: [...l.treats, { name: '', emoji: isFood ? '🍽️' : '✨' }] })}>
          Add {isFood ? 'a dish or drink' : 'an activity'}
        </Button>
      )}
    </>
  )
}

/* ---------------- Step 4: Good to know ---------------- */

function GoodToKnowStep({ l, o, setG, setP, isFood }: { l: Listing; o: Options; setG: (p: Partial<GoodToKnow>) => void; setP: (p: Partial<VenuePolicies>) => void; isFood: boolean }) {
  const g = l.goodToKnow
  const Multi = ({ label, k, hint }: { label: string; k: 'food' | 'seating' | 'payment' | 'accessibility' | 'amenities' | 'safety'; hint?: string }) => (
    <Field label={label} hint={hint} group>
      <div className="flex flex-wrap gap-1.5">{o[k].map((x) => <Chip key={x} size="sm" active={(g[k] ?? []).includes(x)} onClick={() => setG({ [k]: toggle(g[k], x) })}>{x}</Chip>)}</div>
    </Field>
  )
  const Single = ({ label, k }: { label: string; k: 'alcohol' | 'vibe' | 'parking' }) => (
    <Field label={label} group>
      <div className="flex flex-wrap gap-1.5">{o[k].map((x) => <Chip key={x} size="sm" tone="ink" active={g[k] === x} onClick={() => setG({ [k]: g[k] === x ? undefined : x })}>{x}</Chip>)}</div>
    </Field>
  )
  return (
    <>
      <p className="text-[14px] text-ink-soft">The practical things people check before saying yes to a date somewhere. Be accurate: guests rate venues on whether this matched reality.</p>
      <div className="space-y-5 rounded-3xl border border-line bg-white p-5">
        {isFood && <Multi label="Food" k="food" hint="Pick everything that applies. Many first dates are vegetarian." />}
        {isFood && <Single label="Alcohol" k="alcohol" />}
        <Multi label="Seating" k="seating" />
        <Single label="Vibe" k="vibe" />
        <Multi label="Payment" k="payment" />
        <Single label="Parking" k="parking" />
        <Multi label="Accessibility" k="accessibility" />
        <Multi label="Also here" k="amenities" />
        <Multi label="Safety" k="safety" hint="Every Mingleo first date happens at a public, well-run place." />
        <Field label="Student discount (%)" hint="Optional. Most of our first community in Dehradun are students.">
          <input className={`${inputCls} max-w-[140px]`} type="number" min={0} max={50} value={g.studentDiscount ?? ''} onChange={(e) => setG({ studentDiscount: e.target.value ? Number(e.target.value) : undefined })} placeholder="10" />
        </Field>
      </div>

      <div className="space-y-5 rounded-3xl border border-line bg-white p-5">
        <div className="text-[14px] font-semibold">Policies</div>
        <Field label="Cancellation" group>
          <div className="flex flex-wrap gap-1.5">{o.cancellation.map((x) => <Chip key={x} size="sm" tone="ink" active={l.policies.cancellation === x} onClick={() => setP({ cancellation: x })}>{x}</Chip>)}</div>
        </Field>
        <Field label="If guests are running late" group>
          <div className="flex flex-wrap gap-1.5">{o.lateArrival.map((x) => <Chip key={x} size="sm" tone="ink" active={l.policies.lateArrival === x} onClick={() => setP({ lateArrival: x })}>{x}</Chip>)}</div>
        </Field>
        <Field label="House rules or anything else to know (optional)" hint="e.g. Last order 10 PM · Carry a jacket on the deck after sunset">
          <textarea className={`${inputCls} h-20`} maxLength={300} value={l.policies.houseRules ?? ''} onChange={(e) => setP({ houseRules: e.target.value })} />
        </Field>
      </div>
    </>
  )
}

/* ---------------- Step 5: Package, licence, review ---------------- */

function PackageStep({ l, set, data, setData, isFood }: { l: Listing; set: (p: Partial<Listing>) => void; data: ListingRes; setData: (d: ListingRes) => void; isFood: boolean }) {
  const toast = useToast()
  const [pkg, setPkg] = useState({ name: isFood ? 'Coffee & Dessert Date' : 'Date for Two', includes: '', price: '', duration: '90 min', capacity: 4, days: ['Fri', 'Sat', 'Sun'] })
  const [preview, setPreview] = useState(false)
  const addPackage = async () => {
    try {
      await api('/partner/experiences', {
        body: { name: pkg.name, includes: pkg.includes.split('\n').map((s) => s.trim()).filter(Boolean), price: Number(pkg.price), duration: pkg.duration, capacity: pkg.capacity, days: pkg.days },
      })
      setData(await api<ListingRes>('/partner/venue'))
      setPkg({ ...pkg, name: '', includes: '', price: '' })
      toast('Package added', 'success')
    } catch (e) {
      toast(errorMessage(e), 'warn')
    }
  }
  const previewVenue: Venue = {
    id: l.id, name: l.name, kind: l.kind, category: l.category, area: l.area, rating: 0, reviews: 0, emoji: isFood ? '☕' : '🎨', tone: ['#FBEFD3', '#D9A23B'],
    ambience: l.ambience, treats: l.treats.filter((t) => t.name), slots: l.slots, verified: false, packages: data.packages, description: l.description, address: l.address,
    landmark: l.landmark, mapsUrl: l.mapsUrl, priceForTwo: l.priceForTwo, hours: l.hours, photos: l.photos, goodToKnow: l.goodToKnow, policies: l.policies,
  }
  return (
    <>
      <div className="rounded-3xl border border-line bg-white p-5">
        <div className="text-[14px] font-semibold">Date packages</div>
        <p className="mt-1 text-[13px] text-muted">What a couple gets when they book you through Mingleo. Student-friendly packages (₹300–₹700) book fastest in Dehradun.</p>
        {data.packages.length > 0 && (
          <ul className="mt-3 space-y-2">
            {data.packages.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-2xl bg-sand/60 px-4 py-3 text-[14px]">
                <span><b>{p.name}</b> <span className="text-muted">· {p.includes.join(', ')}</span></span>
                <span className="font-semibold">{inr(p.price)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Package name"><input className={inputCls} value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price for two (₹)"><input className={inputCls} type="number" min={100} value={pkg.price} onChange={(e) => setPkg({ ...pkg, price: e.target.value })} placeholder="450" /></Field>
            <Field label="Duration"><input className={inputCls} value={pkg.duration} onChange={(e) => setPkg({ ...pkg, duration: e.target.value })} /></Field>
          </div>
          <Field label="What's included (one per line)"><textarea className={`${inputCls} h-24`} value={pkg.includes} onChange={(e) => setPkg({ ...pkg, includes: e.target.value })} placeholder={'2 handcrafted drinks\n1 dessert to share\nReserved couple table'} /></Field>
          <Field label="Available on" group>
            <div className="flex flex-wrap gap-1.5">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <Chip key={d} size="sm" tone="ink" active={pkg.days.includes(d)} onClick={() => setPkg({ ...pkg, days: toggle(pkg.days, d) })}>{d}</Chip>)}</div>
            <div className="mt-3 text-[13px] text-ink-soft">Couples per slot: <input type="number" min={1} max={50} className="w-16 rounded-lg border border-line px-2 py-1" value={pkg.capacity} onChange={(e) => setPkg({ ...pkg, capacity: Number(e.target.value) })} /></div>
          </Field>
        </div>
        <Button className="mt-4" variant="outline" icon={<Plus size={16} />} disabled={!pkg.name || !pkg.price || !pkg.includes.trim() || !pkg.days.length} onClick={addPackage}>Add package</Button>
      </div>

      <div className="rounded-3xl border border-line bg-white p-5">
        <div className="text-[14px] font-semibold">Licence details</div>
        <p className="mt-1 text-[13px] text-muted">Private: only our verification team sees these.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={isFood ? 'FSSAI licence number (14 digits)' : 'FSSAI licence number (if you serve food)'}><input className={inputCls} inputMode="numeric" maxLength={14} value={l.licence.fssai ?? ''} onChange={(e) => set({ licence: { ...l.licence, fssai: e.target.value.replace(/\D/g, '') } })} /></Field>
          <Field label="GSTIN (optional)"><input className={inputCls} maxLength={15} value={l.licence.gst ?? ''} onChange={(e) => set({ licence: { ...l.licence, gst: e.target.value.toUpperCase() } })} /></Field>
        </div>
      </div>

      <div className={`rounded-3xl p-5 ${data.missing.length ? 'bg-gold-soft/70' : 'bg-sage-soft'}`}>
        {data.missing.length ? (
          <>
            <div className="flex items-center gap-2 font-semibold"><CircleAlert size={18} /> Before you can submit</div>
            <ul className="mt-2 space-y-1 text-[14px] text-ink-soft">{data.missing.map((m) => <li key={m}>• {m}</li>)}</ul>
            <p className="mt-2 text-[12px] text-muted">This list updates when you save each step.</p>
          </>
        ) : (
          <div className="flex items-center gap-2 font-semibold text-sage"><CheckCircle2 size={18} /> Your listing is complete</div>
        )}
      </div>

      <div>
        <Button variant="ghost" onClick={() => setPreview(!preview)}>{preview ? 'Hide preview' : 'Preview what guests will see'}</Button>
        {preview && <div className="mt-3 rounded-3xl border border-line bg-cream p-5"><VenueDetails venue={previewVenue} /></div>}
      </div>
    </>
  )
}

export default function SetupPage() {
  return (
    <RoleGate role="partner">
      <Setup />
    </RoleGate>
  )
}
