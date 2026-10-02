import type { UserDoc } from '../models/index.js'

/**
 * Mingleo compatibility indicator.
 *
 * A transparent, rules-based score from what two people have shared. It is a conversation
 * starter, not a scientific prediction, and the API labels it that way.
 */

type P = Pick<UserDoc, 'interests' | 'traits' | 'food' | 'datePrefs' | 'lifestyle' | 'intention'>

const overlap = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0
  const sb = new Set(b.map((x) => x.toLowerCase()))
  const shared = a.filter((x) => sb.has(x.toLowerCase())).length
  return shared / Math.min(a.length, b.length)
}

const scale = (x: number, lo = 64, hi = 96) => Math.round(lo + (hi - lo) * Math.max(0, Math.min(1, x)))

const CALM = ['Calm', 'Thoughtful', 'Empathetic', 'Easygoing', 'Homebody']
const LIVELY = ['Spontaneous', 'Adventurous', 'Witty', 'Night owl', 'Ambitious']

export function compatibility(a: P, b: P) {
  const interests = scale(overlap(a.interests.map((i) => i.label), b.interests.map((i) => i.label)))
  const food = scale(overlap(a.food, b.food), 66)
  const datePrefs = scale(overlap(a.datePrefs, b.datePrefs), 66)
  const traitOverlap = overlap(a.traits, b.traits)
  // Energy alignment: share of each person's traits that are "calm" vs "lively".
  const energy = (t: string[]) => (t.filter((x) => LIVELY.includes(x)).length - t.filter((x) => CALM.includes(x)).length) / Math.max(1, t.length)
  const energyGap = Math.abs(energy(a.traits) - energy(b.traits)) / 2
  const personality = scale(0.55 * traitOverlap + 0.45 * (1 - energyGap), 66)
  const la = new Map(a.lifestyle.map((l) => [l.label, l.value]))
  const sharedKeys = b.lifestyle.filter((l) => la.has(l.label))
  const lifestyle = scale(sharedKeys.length ? sharedKeys.filter((l) => la.get(l.label) === l.value).length / sharedKeys.length + 0.35 : 0.5, 66)
  const conversation = scale((a.intention === b.intention ? 0.7 : 0.35) + 0.3 * traitOverlap, 66)

  const breakdown = { personality, interests, food, lifestyle, datePrefs, conversation }
  const overall = Math.round(interests * 0.25 + personality * 0.2 + food * 0.15 + datePrefs * 0.15 + lifestyle * 0.1 + conversation * 0.15)
  return { overall, breakdown, sharedLine: sharedLine(a, b) }
}

function list(xs: string[]) {
  if (xs.length <= 1) return xs.join('')
  return xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]
}

export function sharedLine(a: P, b: P) {
  const bl = new Set(b.interests.map((i) => i.label))
  const shared = a.interests.filter((i) => bl.has(i.label)).map((i) => i.label.toLowerCase())
  if (shared.length >= 2) return `You both love ${list(shared.slice(0, 3))}.`
  const dates = a.datePrefs.filter((d) => b.datePrefs.includes(d)).map((d) => d.toLowerCase())
  if (shared.length === 1 && dates.length) return `You both love ${shared[0]} and say yes to ${dates[0]}.`
  if (dates.length) return `You’d both say yes to ${list(dates.slice(0, 2))}.`
  const food = a.food.filter((f) => b.food.includes(f))
  if (food.length) return `You share a soft spot for ${list(food.slice(0, 2))} food.`
  return 'Different worlds, which can make for the best conversations.'
}

export const COMPAT_DISCLAIMER =
  'The Mingleo compatibility indicator is a friendly guide based on what you have both shared. It is not a scientific prediction.'
