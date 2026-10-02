'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

/* ---------- Brand ---------- */

export function LogoMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill={light ? '#fff' : '#1E1B2E'} />
      <circle cx="26" cy="32" r="12" fill="none" stroke="#E8774A" strokeWidth="5" />
      <circle cx="38" cy="32" r="12" fill="none" stroke={light ? '#1E1B2E' : '#F6C9A8'} strokeWidth="5" />
    </svg>
  )
}

export function Logo({ light = false, size = 'md' }: { light?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 26, md: 32, lg: 56 }[size]
  const t = { sm: 'text-lg', md: 'text-xl', lg: 'text-4xl' }[size]
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={s} light={light} />
      <span className={`font-display font-semibold ${t} ${light ? 'text-white' : 'text-ink'}`}>mingleo</span>
    </div>
  )
}

/* ---------- Buttons ---------- */

type BtnVariant = 'primary' | 'dark' | 'plum' | 'outline' | 'ghost' | 'soft' | 'danger'
const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-ember text-white hover:bg-ember-dark shadow-[0_8px_20px_-8px_rgb(232_119_74/0.7)]',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  plum: 'bg-plum text-white hover:bg-plum-dark shadow-[0_8px_20px_-8px_rgb(75_59_122/0.6)]',
  outline: 'bg-white text-ink border border-line hover:border-ink/30',
  ghost: 'text-ink-soft hover:bg-sand',
  soft: 'bg-sand text-ink hover:bg-line',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; full?: boolean; icon?: ReactNode }) {
  const sz = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-13 px-6 text-[15px]' }[size]
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${sz} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ children, onClick, label, className = '' }: { children: ReactNode; onClick?: () => void; label: string; className?: string }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition hover:bg-white active:scale-95 cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}

/* ---------- Layout ---------- */

export function TopBar({ title, right, onBack, transparent, noBack }: { title?: ReactNode; right?: ReactNode; onBack?: () => void; transparent?: boolean; noBack?: boolean }) {
  const router = useRouter()
  const handle = noBack ? undefined : onBack ?? (() => router.back())
  return (
    <div className={`sticky top-0 z-20 flex h-14 items-center gap-2 px-4 ${transparent ? '' : 'bg-cream/85 backdrop-blur-md'}`}>
      {handle ? (
        <IconButton label="Back" onClick={handle}>
          <ArrowLeft size={18} />
        </IconButton>
      ) : (
        <div className="w-10" />
      )}
      <div className="flex-1 truncate text-center text-[15px] font-semibold">{title}</div>
      <div className="flex min-w-10 justify-end">{right}</div>
    </div>
  )
}

export function Screen({ children, className = '', nav = false }: { children: ReactNode; className?: string; nav?: boolean }) {
  return <div className={`min-h-full ${nav ? 'pb-28' : 'pb-8'} ${className}`}>{children}</div>
}

export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mb-8 mt-6 border-t border-line/60 bg-cream/90 px-5 pb-6 pt-3 backdrop-blur-md">{children}</div>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-line/70 bg-white shadow-card ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lift' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h3 className="font-display text-[19px] font-medium">{children}</h3>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold text-ember hover:text-ember-dark cursor-pointer">
          {action}
        </button>
      )}
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-bold uppercase tracking-[0.14em] text-muted ${className}`}>{children}</div>
}

/* ---------- Chips & pills ---------- */

export function Chip({
  children,
  active,
  onClick,
  tone = 'ember',
  size = 'md',
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  tone?: 'ember' | 'plum' | 'ink'
  size?: 'sm' | 'md'
}) {
  const activeCls = { ember: 'bg-ember-soft border-ember text-ember-dark', plum: 'bg-plum-soft border-plum text-plum', ink: 'bg-ink border-ink text-white' }[tone]
  const sz = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-[13px]'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition ${sz} ${active ? activeCls : 'border-line bg-white text-ink-soft hover:border-ink/25'} ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
    >
      {children}
      {active && onClick && <Check size={13} strokeWidth={3} />}
    </button>
  )
}

export function Pill({ children, tone = 'sand', className = '' }: { children: ReactNode; tone?: 'sand' | 'ember' | 'plum' | 'sage' | 'gold' | 'sky' | 'ink' | 'red'; className?: string }) {
  const cls = {
    sand: 'bg-sand text-ink-soft',
    ember: 'bg-ember-soft text-ember-dark',
    plum: 'bg-plum-soft text-plum',
    sage: 'bg-sage-soft text-sage',
    gold: 'bg-gold-soft text-[#9a6d17]',
    sky: 'bg-sky-soft text-sky',
    ink: 'bg-ink text-white',
    red: 'bg-red-50 text-red-600',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls} ${className}`}>{children}</span>
}

/* ---------- Data display ---------- */

export function CompatRing({ value, size = 64, stroke = 6, label = true, color = '#E8774A', track = '#F4EDE4' }: { value: number; size?: number; stroke?: number; label?: boolean; color?: string; track?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display font-semibold" style={{ fontSize: size * 0.28 }}>
            {value}
            <span style={{ fontSize: size * 0.16 }}>%</span>
          </span>
        </div>
      )}
    </div>
  )
}

export function Bar({ value, color = 'bg-ember', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-sand ${className}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%`, transition: 'width 1s cubic-bezier(.2,.8,.2,1)' }} />
    </div>
  )
}

export function VenueArt({ emoji, tone, className = '', size = 'md' }: { emoji: string; tone: [string, string]; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const e = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' }[size]
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${tone[0]}, ${tone[1]})` }}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20" />
      <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
      <span className={`relative drop-shadow-sm ${e}`}>{emoji}</span>
    </div>
  )
}

export function Progress({ step, total, tone = 'bg-ember' }: { step: number; total: number; tone?: string }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: i < step ? '100%' : '0%' }} />
        </div>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition cursor-pointer ${on ? 'bg-sage' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

/* ---------- Overlays ---------- */

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end md:items-center md:justify-center md:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full animate-sheet overflow-y-auto rounded-t-[32px] bg-cream px-5 pb-8 pt-3 no-scrollbar md:max-w-lg md:animate-scale-in md:rounded-[32px] md:px-6 md:pt-5">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-medium">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-sand cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative max-h-[90vh] w-full animate-scale-in overflow-y-auto rounded-3xl bg-white p-6 shadow-lift thin-scroll ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-sand cursor-pointer">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Form field. Use `group` when the children are several controls (chips, buttons); a <label>
 * would otherwise name, and forward clicks to, only the first control inside it.
 */
export function Field({ label, children, hint, group }: { label: string; children: ReactNode; hint?: string; group?: boolean }) {
  const body = (
    <>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-soft">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </>
  )
  return group ? <div role="group" aria-label={label}>{body}</div> : <label className="block">{body}</label>
}

export const inputCls =
  'w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-ember focus:ring-4 focus:ring-ember/10'
