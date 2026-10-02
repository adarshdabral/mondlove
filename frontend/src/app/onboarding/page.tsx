'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/api'
import { useSession, useToast } from '@/lib/session'
import { ALL_INTERESTS, DATE_STYLES, FOODS, INTENTIONS, ME_AVATAR, TRAITS } from '@/lib/constants'
import type { AvatarConfig, Interest, Me } from '@/lib/types'
import { AvatarStudio } from '@/components/AvatarStudio'
import { Button, Chip, Field, Logo, Progress, inputCls } from '@/components/ui'
import { PageLoader } from '@/components/shared'

const PROMPTS = ['A perfect Sunday looks like…', 'I’ll know it’s a good date if…', 'Together we could…', 'My most irrational fear…', 'The way to win me over…']

const toggle = <T,>(list: T[], item: T, key: (x: T) => string = String) => (list.some((x) => key(x) === key(item)) ? list.filter((x) => key(x) !== key(item)) : [...list, item])

export default function Onboarding() {
  const { user, loading, setUser } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [avatar, setAvatar] = useState<AvatarConfig>({ ...ME_AVATAR, hair: 'long', accessory: 'earrings' })
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [f, setF] = useState({
    name: '', area: '', pronouns: 'she/her', gender: 'woman' as 'woman' | 'man' | 'nonbinary', interestedIn: 'everyone' as 'women' | 'men' | 'everyone',
    interests: [] as Interest[], traits: [] as string[], food: [] as string[], intention: INTENTIONS[0], datePrefs: [] as string[],
    drinks: 'Socially', weekends: 'A bit of both', about: '', promptQ: PROMPTS[0], promptA: '', contactName: '', contactPhone: '', partnerEmail: '',
  })

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
    else if (user.role !== 'user') router.replace(user.role === 'partner' ? '/partner' : '/admin')
    else if (user.onboarded) router.replace('/app')
    else setF((x) => ({ ...x, name: user.name }))
  }, [user, loading, router])

  if (loading || !user || user.onboarded) return <PageLoader />
  const couple = user.mode !== 'single'
  const total = couple ? 5 : 4
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const canNext = [true, !!f.name.trim() && !!f.area.trim(), f.interests.length >= 3, f.datePrefs.length >= 1, true, true][step]

  const finish = async () => {
    setBusy(true)
    try {
      const { user: updated } = await api<{ user: Me }>('/users/me', {
        method: 'PATCH',
        body: {
          name: f.name, area: f.area, pronouns: f.pronouns, gender: f.gender, interestedIn: f.interestedIn, avatar,
          interests: f.interests, traits: f.traits, food: f.food, intention: f.intention, datePrefs: f.datePrefs,
          lifestyle: [{ label: 'Drinks', value: f.drinks }, { label: 'Weekends', value: f.weekends }],
          about: f.about || undefined, prompts: f.promptA ? [{ q: f.promptQ, a: f.promptA }] : [],
          trustedContact: f.contactName && f.contactPhone ? { name: f.contactName, phone: f.contactPhone } : undefined,
          onboarded: true,
        },
      })
      if (couple && f.partnerEmail) {
        await api('/couples/invite', { body: { email: f.partnerEmail } })
        toast(`Invite sent to ${f.partnerEmail}`, 'success')
      }
      setUser(updated)
      router.replace('/app')
    } catch (e) {
      toast(errorMessage(e), 'warn')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-[13px] text-muted">Step {step} of {total}</span>
        </div>
        <div className="mt-6"><Progress step={step} total={total} /></div>

        <div key={step} className="mt-8 animate-fade-up">
          {step === 1 && (
            <>
              <h1 className="font-display text-[32px] leading-tight">First, the basics.</h1>
              <p className="mt-1 text-ink-soft">Create the avatar people will see during discovery.</p>
              <div className="mt-6 space-y-5">
                <AvatarStudio value={avatar} onChange={(a) => { setAvatar(a); setAvatarTouched(true) }} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name"><input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
                  <Field label="Neighbourhood" hint="Only your area is shown, never your exact location."><input className={inputCls} placeholder="e.g. Rajpur Road" value={f.area} onChange={(e) => set('area', e.target.value)} /></Field>
                </div>
                <Field label="I am" group>
                  <div className="flex flex-wrap gap-2">
                    {([['woman', 'A woman', 'she/her'], ['man', 'A man', 'he/him'], ['nonbinary', 'Non-binary', 'they/them']] as const).map(([g, l, pr]) => (
                      <Chip
                        key={g}
                        active={f.gender === g}
                        onClick={() => {
                          setF((x) => ({ ...x, gender: g, pronouns: pr }))
                          if (!avatarTouched) setAvatar((a) => ({ ...a, hair: g === 'woman' ? 'long' : g === 'man' ? 'short' : 'bob', accessory: g === 'woman' ? 'earrings' : 'none', beard: false }))
                        }}
                      >
                        {l}
                      </Chip>
                    ))}
                  </div>
                </Field>
                {!couple || user.mode === 'both' ? (
                  <Field label="I'd like to meet" group>
                    <div className="flex flex-wrap gap-2">
                      {(['women', 'men', 'everyone'] as const).map((g) => <Chip key={g} active={f.interestedIn === g} onClick={() => set('interestedIn', g)}><span className="capitalize">{g}</span></Chip>)}
                    </div>
                  </Field>
                ) : null}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-[32px] leading-tight">What lights you up?</h1>
              <p className="mt-1 text-ink-soft">Pick at least 3. These shape who you meet and which dates we suggest.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {ALL_INTERESTS.map((i) => (
                  <Chip key={i.label} active={f.interests.some((x) => x.label === i.label)} onClick={() => set('interests', toggle(f.interests, i, (x) => x.label))}>{i.emoji} {i.label}</Chip>
                ))}
              </div>
              <h2 className="mt-8 font-display text-xl">Your personality <span className="text-sm text-muted">(up to 4)</span></h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRAITS.map((t) => (
                  <Chip key={t} tone="plum" active={f.traits.includes(t)} onClick={() => (f.traits.includes(t) || f.traits.length < 4) && set('traits', toggle(f.traits, t))}>{t}</Chip>
                ))}
              </div>
              <h2 className="mt-8 font-display text-xl">Food you love</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {FOODS.map((t) => <Chip key={t} active={f.food.includes(t)} onClick={() => set('food', toggle(f.food, t))}>{t}</Chip>)}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-[32px] leading-tight">{couple ? 'Your kind of dates' : 'What are you looking for?'}</h1>
              <div className="mt-6 space-y-6">
                {user.mode !== 'couple' && (
                  <Field label="Relationship intention" group>
                    <div className="flex flex-wrap gap-2">{INTENTIONS.map((t) => <Chip key={t} tone="plum" active={f.intention === t} onClick={() => set('intention', t)}>{t}</Chip>)}</div>
                  </Field>
                )}
                <Field label="Dates you'd say yes to" group>
                  <div className="flex flex-wrap gap-2">{DATE_STYLES.map((t) => <Chip key={t} active={f.datePrefs.includes(t)} onClick={() => set('datePrefs', toggle(f.datePrefs, t))}>{t}</Chip>)}</div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Drinks" group>
                    <div className="flex flex-wrap gap-1.5">{['Never', 'Socially', 'Often'].map((o) => <Chip key={o} size="sm" tone="ink" active={f.drinks === o} onClick={() => set('drinks', o)}>{o}</Chip>)}</div>
                  </Field>
                  <Field label="Weekends" group>
                    <div className="flex flex-wrap gap-1.5">{['Cosy at home', 'Out and about', 'A bit of both'].map((o) => <Chip key={o} size="sm" tone="ink" active={f.weekends === o} onClick={() => set('weekends', o)}>{o}</Chip>)}</div>
                  </Field>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-display text-[32px] leading-tight">A little about you</h1>
              <p className="mt-1 text-ink-soft">Optional, but profiles with a prompt get far more proposals.</p>
              <div className="mt-6 space-y-5">
                <Field label="About me"><textarea className={`${inputCls} h-24`} maxLength={400} value={f.about} onChange={(e) => set('about', e.target.value)} placeholder="What do you do, what do you love, what makes you laugh?" /></Field>
                <Field label="Prompt" group>
                  <select className={inputCls} value={f.promptQ} onChange={(e) => set('promptQ', e.target.value)}>{PROMPTS.map((p) => <option key={p}>{p}</option>)}</select>
                  <textarea className={`${inputCls} mt-2 h-20`} maxLength={200} value={f.promptA} onChange={(e) => set('promptA', e.target.value)} placeholder="Your answer" />
                </Field>
                <div className="rounded-3xl border border-line bg-white p-4">
                  <div className="text-[13px] font-semibold">Trusted contact <span className="font-normal text-muted">(for date check-ins)</span></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Name" value={f.contactName} onChange={(e) => set('contactName', e.target.value)} />
                    <input className={inputCls} placeholder="Phone" inputMode="tel" value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && couple && (
            <>
              <h1 className="font-display text-[32px] leading-tight">Link your partner</h1>
              <p className="mt-1 text-ink-soft">Enter the email they use for Mingleo. They&apos;ll get an invite to accept. You can also do this later from your profile.</p>
              <div className="mt-6">
                <Field label="Partner's email"><input className={inputCls} type="email" value={f.partnerEmail} onChange={(e) => set('partnerEmail', e.target.value)} placeholder="partner@example.com" /></Field>
              </div>
            </>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
          {step < total ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button disabled={busy} variant={couple ? 'plum' : 'primary'} onClick={finish}>{busy ? 'Saving…' : couple && !f.partnerEmail ? 'Skip for now & finish' : 'Finish'}</Button>
          )}
        </div>
      </div>
    </div>
  )
}
