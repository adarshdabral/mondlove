'use client'

import { useId } from 'react'
import type { AvatarConfig } from '../lib/types'

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

/** Illustrated, customizable avatar used during blind discovery — no photographs. */
export function Avatar({
  config,
  size = 64,
  className = '',
  ring = false,
  shape = 'circle',
}: {
  config: AvatarConfig
  size?: number
  className?: string
  ring?: boolean
  shape?: 'circle' | 'squircle'
}) {
  const uid = useId().replace(/:/g, '')
  const { skin, hair, hairColor, bg, shirt, accessory, beard } = config
  const skinShadow = shade(skin, -22)
  const hairHi = shade(hairColor, 28)

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${shape === 'circle' ? 'rounded-full' : 'rounded-[28%]'} ${ring ? 'ring-4 ring-white shadow-lift' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={bg[0]} />
            <stop offset="1" stopColor={bg[1]} />
          </linearGradient>
          <linearGradient id={`hair${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hairHi} />
            <stop offset="1" stopColor={hairColor} />
          </linearGradient>
        </defs>
        <rect width="120" height="120" fill={`url(#bg${uid})`} />
        <circle cx="96" cy="22" r="18" fill="#fff" opacity="0.25" />

        {/* back hair */}
        {hair === 'long' && (
          <path d="M33 56 C30 30 45 19 60 19 C77 19 90 30 87 56 L90 100 C80 106 70 102 68 96 L52 96 C50 102 40 106 30 100 Z" fill={`url(#hair${uid})`} />
        )}
        {hair === 'bob' && (
          <path d="M33 56 C31 30 46 20 60 20 C76 20 89 30 87 56 L88 78 C82 82 76 80 74 76 L46 76 C44 80 38 82 32 78 Z" fill={`url(#hair${uid})`} />
        )}

        {/* shoulders */}
        <path d="M16 120 C16 96 36 86 60 86 C84 86 104 96 104 120 Z" fill={shirt} />
        <path d="M48 87 Q60 98 72 87" fill="none" stroke={shade(shirt, -25)} strokeWidth="2.5" opacity="0.5" />
        {/* neck */}
        <path d="M51 70 L51 86 Q60 93 69 86 L69 70 Z" fill={skinShadow} />
        {/* ears */}
        <ellipse cx="37.5" cy="57" rx="4.5" ry="6" fill={skinShadow} />
        <ellipse cx="82.5" cy="57" rx="4.5" ry="6" fill={skinShadow} />
        {/* face */}
        <path d="M38 52 C38 36 47 29 60 29 C73 29 82 36 82 52 C82 68 72 80 60 80 C48 80 38 68 38 52 Z" fill={skin} />

        {beard && (
          <path d="M40 60 C42 74 50 81 60 81 C70 81 78 74 80 60 C76 68 70 71 60 71 C50 71 44 68 40 60 Z" fill={hairColor} opacity="0.85" />
        )}

        {/* front hair */}
        {hair === 'short' && (
          <path d="M36 52 C34 32 46 23 61 23 C76 23 87 32 84 52 C82 44 78 39 72 37 C64 41 50 42 41 40 C38 44 37 48 36 52 Z" fill={`url(#hair${uid})`} />
        )}
        {hair === 'wavy' && (
          <path d="M35 55 C31 31 47 20 62 21 C80 22 90 35 85 55 C84 46 80 40 74 37 C70 42 62 40 58 37 C54 41 46 42 41 40 C38 44 36 49 35 55 Z" fill={`url(#hair${uid})`} />
        )}
        {hair === 'buzz' && (
          <path d="M38 48 C38 33 48 27 60 27 C72 27 82 33 82 48 C78 40 70 36 60 36 C50 36 42 40 38 48 Z" fill={hairColor} opacity="0.9" />
        )}
        {(hair === 'long' || hair === 'bob') && (
          <path d="M37 54 C36 32 49 24 62 25 C76 26 85 34 83 52 C78 41 68 34 59 34 C54 41 45 47 37 54 Z" fill={`url(#hair${uid})`} />
        )}
        {hair === 'bun' && (
          <>
            <circle cx="60" cy="19" r="10" fill={`url(#hair${uid})`} />
            <path d="M37 52 C35 33 47 25 60 25 C74 25 85 33 83 52 C80 42 71 35 60 35 C49 35 40 42 37 52 Z" fill={`url(#hair${uid})`} />
          </>
        )}
        {hair === 'curly' && (
          <g fill={`url(#hair${uid})`}>
            {[
              [40, 44, 8], [45, 34, 9], [55, 28, 9], [66, 28, 9], [76, 34, 9], [81, 44, 8], [50, 38, 7], [70, 38, 7], [60, 34, 8],
            ].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} />
            ))}
          </g>
        )}
        {accessory === 'beanie' && (
          <>
            <path d="M35 46 C35 26 47 18 60 18 C73 18 85 26 85 46 Z" fill="#E8774A" />
            <rect x="33" y="42" width="54" height="8" rx="4" fill="#C95E33" />
          </>
        )}

        {/* brows */}
        <path d="M47 49 Q51 46.5 55 48.5" stroke={hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M65 48.5 Q69 46.5 73 49" stroke={hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <ellipse cx="51" cy="56" rx="2.4" ry="2.8" fill="#1E1B2E" />
        <ellipse cx="69" cy="56" rx="2.4" ry="2.8" fill="#1E1B2E" />
        <circle cx="51.8" cy="55" r="0.8" fill="#fff" />
        <circle cx="69.8" cy="55" r="0.8" fill="#fff" />
        {/* cheeks */}
        <ellipse cx="45" cy="64" rx="4.5" ry="2.8" fill="#E8774A" opacity="0.18" />
        <ellipse cx="75" cy="64" rx="4.5" ry="2.8" fill="#E8774A" opacity="0.18" />
        {/* nose + smile */}
        <path d="M60 58 Q58 63 60.5 64" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M53.5 68 Q60 73.5 66.5 68" stroke="#1E1B2E" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {accessory === 'glasses' && (
          <g fill="none" stroke="#1E1B2E" strokeWidth="1.8">
            <rect x="43" y="50.5" width="15" height="11" rx="5" />
            <rect x="62" y="50.5" width="15" height="11" rx="5" />
            <path d="M58 55 L62 55" />
          </g>
        )}
        {accessory === 'earrings' && (
          <g fill="#D9A23B">
            <circle cx="37.5" cy="65" r="2.2" />
            <circle cx="82.5" cy="65" r="2.2" />
          </g>
        )}
      </svg>
    </div>
  )
}
