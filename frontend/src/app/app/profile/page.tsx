'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Camera, Heart, LogOut, ShieldCheck, Trash2, UserX } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useApi, useSession, useToast } from '@/lib/session'
import type { AvatarConfig, Me, MiniPerson } from '@/lib/types'
import { useCouple } from '@/components/AppShell'
import { Avatar } from '@/components/Avatar'
import { AvatarStudio } from '@/components/AvatarStudio'
import { Button, Card, Field, Pill, SectionTitle, inputCls } from '@/components/ui'
import { PageHeader } from '@/components/shared'

export default function Profile() {
  const { user, setUser, logout, refresh } = useSession()
  const toast = useToast()
  const router = useRouter()
  const { data: coupleData, reload: reloadCouple } = useCouple()
  const blocked = useApi<{ blocked: MiniPerson[] }>('/blocks')
  const [avatar, setAvatar] = useState<AvatarConfig>(user!.avatar)
  const [basics, setBasics] = useState({ name: user!.name, area: user!.area ?? '', about: user!.about ?? '' })
  const [contact, setContact] = useState(user!.trustedContact ?? { name: '', phone: '' })
  const [partnerEmail, setPartnerEmail] = useState('')
  const [busy, setBusy] = useState('')
  const photoInput = useRef<HTMLInputElement>(null)

  const save = async (key: string, body: object, ok = 'Saved') => {
    setBusy(key)
    try {
      const { user: u } = await api<{ user: Me }>('/users/me', { method: 'PATCH', body })
      setUser(u)
      toast(ok, 'success')
    } catch (e) {
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy('')
    }
  }

  const couple = coupleData?.couple
  const invites = coupleData?.invites ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={<span className="flex items-center gap-2">{user!.name}{user!.verified && <BadgeCheck size={26} className="fill-sky text-white" />}</span>}
        sub={user!.email}
        action={<Button variant="outline" icon={<LogOut size={15} />} onClick={async () => { await logout(); router.replace('/') }}>Log out</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle>Your profile</SectionTitle>
            <AvatarStudio value={avatar} onChange={setAvatar} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="First name"><input className={inputCls} value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} /></Field>
              <Field label="Neighbourhood"><input className={inputCls} value={basics.area} onChange={(e) => setBasics({ ...basics, area: e.target.value })} /></Field>
            </div>
            <div className="mt-3"><Field label="About me"><textarea className={`${inputCls} h-24`} maxLength={400} value={basics.about} onChange={(e) => setBasics({ ...basics, about: e.target.value })} /></Field></div>
            <Button className="mt-4" disabled={busy === 'profile'} onClick={() => save('profile', { avatar, ...basics }, 'Profile updated')}>Save profile</Button>
          </Card>

          <Card className="p-5">
            <SectionTitle>Private photos</SectionTitle>
            <p className="-mt-2 mb-4 text-[13px] text-muted">Only shown to people you&apos;ve had a confirmed date with, and your partner. Never in Discover.</p>
            <div className="flex flex-wrap gap-3">
              {user!.photos.map((src) => (
                <div key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                  <button
                    aria-label="Delete photo"
                    onClick={async () => {
                      await api(src.replace(/^\/api/, ''), { method: 'DELETE' })
                      await refresh()
                    }}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-white cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {user!.photos.length < 6 && (
                <button onClick={() => photoInput.current?.click()} disabled={busy === 'photo'} className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-dashed border-line bg-white text-muted cursor-pointer">
                  {busy === 'photo' ? '…' : <Camera size={22} />}
                </button>
              )}
            </div>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                if (f.size > 3 * 1024 * 1024) return toast('Photos must be under 3 MB', 'warn')
                setBusy('photo')
                try {
                  await api('/media?kind=profile', { raw: f })
                  await refresh()
                } catch (err) {
                  toast(errorMessage(err), 'warn')
                } finally {
                  setBusy('')
                }
              }}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle>How you use Mingleo</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {([['single', 'Meet someone'], ['both', 'Both'], ['couple', 'Couple']] as const).map(([m, l]) => (
                <button
                  key={m}
                  disabled={!!couple && m !== 'couple'}
                  onClick={() => save('mode', { mode: m }, 'Mode updated')}
                  className={`rounded-2xl border p-3 text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${user!.mode === m ? 'border-ember bg-ember-soft text-ember-dark' : 'border-line bg-white'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{couple ? 'Linked couples stay out of Discover. Unlink below to change this.' : 'Not a label. Switch any time.'}</p>
          </Card>

          <Card className="p-5" >
            <div id="partner" className="scroll-mt-24" />
            <SectionTitle>Partner</SectionTitle>
            {couple ? (
              <div className="flex items-center gap-3">
                <Avatar config={couple.partner.avatar} size={52} />
                <div className="flex-1">
                  <div className="font-semibold">{couple.partner.name}</div>
                  <div className="text-xs text-muted">Linked since {new Date(couple.since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm(`Unlink from ${couple.partner.name}? You'll both return to single mode.`)) return
                    await api('/couples/leave', { method: 'POST' })
                    await Promise.all([reloadCouple(), refresh()])
                    toast('Unlinked')
                  }}
                >
                  Unlink
                </Button>
              </div>
            ) : (
              <>
                {invites.map((i) => (
                  <div key={i.id} className="mb-3 flex items-center gap-3 rounded-2xl bg-plum-soft p-3">
                    <Avatar config={i.person.avatar} size={40} />
                    <div className="flex-1 text-sm">{i.incoming ? <><b>{i.person.name}</b> invited you</> : <>Waiting for <b>{i.person.name}</b> to accept</>}</div>
                    {i.incoming ? (
                      <Button
                        size="sm"
                        variant="plum"
                        onClick={async () => {
                          try {
                            await api(`/couples/${i.id}/accept`, { method: 'POST' })
                            await Promise.all([reloadCouple(), refresh()])
                            toast(`Linked with ${i.person.name} 💞`, 'success')
                          } catch (e) {
                            toast(errorMessage(e), 'warn')
                          }
                        }}
                      >
                        Accept
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={async () => { await api(`/couples/${i.id}/decline`, { method: 'POST' }); await reloadCouple() }}>Cancel</Button>
                    )}
                  </div>
                ))}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    try {
                      await api('/couples/invite', { body: { email: partnerEmail } })
                      toast(`If ${partnerEmail} has a Mingleo account, they'll see your invite.`, 'success')
                      setPartnerEmail('')
                      await reloadCouple()
                    } catch (err) {
                      toast(errorMessage(err), 'warn')
                    }
                  }}
                  className="flex gap-2"
                >
                  <input className={inputCls} type="email" required placeholder="Partner's email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} />
                  <Button type="submit" variant="plum" icon={<Heart size={15} />}>Invite</Button>
                </form>
              </>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle>Safety &amp; privacy</SectionTitle>
            <div className="flex items-center gap-3 rounded-2xl bg-sage-soft p-3 text-sm text-sage">
              <ShieldCheck size={18} />
              <span className="flex-1">Verification: <b>{user!.verification?.status ?? 'unverified'}</b></span>
              {user!.verification?.status === 'verified' && <Pill tone="sage">Trusted</Pill>}
            </div>
            <div className="mt-4 text-[13px] font-semibold text-ink-soft">Trusted contact <span className="font-normal text-muted">(one-tap date check-ins)</span></div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input className={inputCls} placeholder="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              <input className={inputCls} placeholder="Phone" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              <Button variant="soft" disabled={!contact.name || !contact.phone || busy === 'contact'} onClick={() => save('contact', { trustedContact: contact }, 'Trusted contact saved')}>Save</Button>
            </div>
            <div className="mt-5 text-[13px] font-semibold text-ink-soft">Blocked people</div>
            {blocked.data?.blocked.length ? (
              <ul className="mt-2 space-y-2">
                {blocked.data.blocked.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
                    <Avatar config={b.avatar} size={32} />
                    <span className="flex-1 text-sm font-medium">{b.name}</span>
                    <Button size="sm" variant="ghost" icon={<UserX size={14} />} onClick={async () => { await api(`/blocks/${b.id}`, { method: 'DELETE' }); await blocked.reload() }}>Unblock</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted">You haven&apos;t blocked anyone.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
