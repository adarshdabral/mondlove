'use client'

import { useState } from 'react'

/** Smooth area chart with hover readout. */
export function AreaChart({ data, labels, color = '#E8774A', height = 180, format = (n: number) => String(n) }: { data: number[]; labels: string[]; color?: string; height?: number; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 600
  const h = height
  const pad = 8
  const max = Math.max(...data) * 1.15
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1)
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const pts = data.map((v, i) => [x(i), y(v)])
  const path = pts.reduce((acc, [px, py], i) => {
    if (i === 0) return `M${px},${py}`
    const [qx, qy] = pts[i - 1]
    const cx = (qx + px) / 2
    return `${acc} C${cx},${qy} ${cx},${py} ${px},${py}`
  }, '')
  const gid = 'g' + color.slice(1)
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.25" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="#EBE3D8" strokeDasharray="4 6" />)}
        <path d={`${path} L${x(data.length - 1)},${h} L${x(0)},${h} Z`} fill={`url(#${gid})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {data.map((_, i) => (
          <rect key={i} x={x(i) - (w / data.length) / 2} y={0} width={w / data.length} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke={color} strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-2 rounded-xl bg-ink px-2.5 py-1.5 text-xs font-semibold text-white shadow-lift" style={{ left: `calc(${(x(hover) / w) * 100}% - 40px)` }}>
          {labels[hover]} · {format(data[hover])}
        </div>
      )}
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  )
}

export function BarChart({ data, labels, color = 'bg-plum', height = 160, highlight }: { data: number[]; labels: string[]; color?: string; height?: number; highlight?: number }) {
  const max = Math.max(...data)
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((v, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
            <div className="absolute -top-1 hidden -translate-y-full rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold text-white group-hover:block">{v}</div>
            <div className={`w-full rounded-t-lg transition-all ${highlight === i ? color : color + ' opacity-35 group-hover:opacity-70'}`} style={{ height: `${(v / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {labels.map((l) => <span key={l} className="flex-1 text-center text-[11px] text-muted">{l}</span>)}
      </div>
    </div>
  )
}

export function Donut({ parts, size = 150 }: { parts: { label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0)
  const r = 54
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 140 140" className="-rotate-90 shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F4EDE4" strokeWidth="18" />
        {parts.map((p) => {
          const len = (p.value / total) * c
          const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len - 2} ${c - len + 2}`} strokeDashoffset={-acc} />
          acc += len
          return el
        })}
      </svg>
      <div className="space-y-1.5 text-[13px]">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-ink-soft">{p.label}</span>
            <span className="font-semibold">{Math.round((p.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ data, color = '#4F8A6A' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 80},${24 - ((v - min) / (max - min || 1)) * 22}`).join(' ')
  return (
    <svg width="80" height="26" viewBox="0 0 80 26">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0].value
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-semibold">
              {s.value.toLocaleString('en-IN')}
              {i > 0 && <span className="ml-2 text-[11px] font-normal text-muted">{Math.round((s.value / steps[i - 1].value) * 100)}%</span>}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-gradient-to-r from-ember to-plum" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
