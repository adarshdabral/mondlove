'use client'

import { useState } from 'react'
import { Avatar } from './Avatar'
import { Chip } from './ui'
import { BGS, HAIR_COLORS, SHIRTS, SKINS } from '../lib/constants'
import type { Accessory, AvatarConfig, HairStyle } from '../lib/types'

const HAIRS: HairStyle[] = ['short', 'wavy', 'curly', 'buzz', 'long', 'bob', 'bun']
const ACCS: Accessory[] = ['none', 'glasses', 'earrings', 'beanie']

/** Avatar editor. In discovery people see this illustration, never a photo. */
export function AvatarStudio({ value, onChange }: { value: AvatarConfig; onChange: (a: AvatarConfig) => void }) {
  const a = value
  const set = (p: Partial<AvatarConfig>) => onChange({ ...a, ...p })
  const [tab, setTab] = useState<'hair' | 'color' | 'skin' | 'style'>('hair')
  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-4">
        <Avatar config={a} size={96} shape="squircle" />
        <div className="flex-1">
          <div className="text-[15px] font-semibold">Your Mingleo avatar</div>
          <div className="mt-0.5 text-xs leading-snug text-muted">People see this during discovery. Your photos stay private until you both agree to a date.</div>
        </div>
      </div>
      <div className="mt-4 flex gap-1 rounded-full bg-sand p-1 text-xs font-semibold">
        {(['hair', 'color', 'skin', 'style'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`flex-1 rounded-full py-1.5 capitalize transition cursor-pointer ${tab === t ? 'bg-white shadow-card' : 'text-muted'}`}>
            {t === 'color' ? 'Hair colour' : t === 'style' ? 'Extras' : t}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tab === 'hair' &&
          HAIRS.map((h) => (
            <button key={h} type="button" aria-label={`${h} hair`} onClick={() => set({ hair: h })} className={`rounded-2xl p-0.5 cursor-pointer ${a.hair === h ? 'ring-2 ring-ember' : ''}`}>
              <Avatar config={{ ...a, hair: h }} size={44} shape="squircle" />
            </button>
          ))}
        {tab === 'color' &&
          HAIR_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => set({ hairColor: c })} aria-label="Hair colour" className={`h-9 w-9 rounded-full cursor-pointer ${a.hairColor === c ? 'ring-2 ring-ember ring-offset-2' : ''}`} style={{ background: c }} />
          ))}
        {tab === 'skin' &&
          SKINS.map((c) => (
            <button key={c} type="button" onClick={() => set({ skin: c })} aria-label="Skin tone" className={`h-9 w-9 rounded-full cursor-pointer ${a.skin === c ? 'ring-2 ring-ember ring-offset-2' : ''}`} style={{ background: c }} />
          ))}
        {tab === 'style' && (
          <div className="w-full space-y-3">
            <div className="flex flex-wrap gap-2">
              {ACCS.map((x) => (
                <Chip key={x} size="sm" active={a.accessory === x} onClick={() => set({ accessory: x })}>{x === 'none' ? 'No accessory' : x}</Chip>
              ))}
              <Chip size="sm" active={!!a.beard} onClick={() => set({ beard: !a.beard })}>Beard</Chip>
            </div>
            <div className="flex flex-wrap gap-2">
              {BGS.map((b) => (
                <button key={b[0]} type="button" onClick={() => set({ bg: b })} aria-label="Background" className={`h-8 w-8 rounded-xl cursor-pointer ${a.bg[0] === b[0] ? 'ring-2 ring-ember ring-offset-2' : ''}`} style={{ background: `linear-gradient(135deg, ${b[0]}, ${b[1]})` }} />
              ))}
              <span className="mx-1 w-px bg-line" />
              {SHIRTS.map((c) => (
                <button key={c} type="button" onClick={() => set({ shirt: c })} aria-label="Top colour" className={`h-8 w-8 rounded-full border border-line cursor-pointer ${a.shirt === c ? 'ring-2 ring-ember ring-offset-2' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
