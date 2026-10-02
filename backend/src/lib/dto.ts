import type { Types } from 'mongoose'
import type { UserDoc } from '../models/index.js'
import { compatibility } from './compat.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Public profile used in blind discovery. Never includes email, exact location or photos —
 * photos are only added when `revealPhotos` is true (a confirmed date or couple exists).
 */
export function personDto(u: UserDoc, viewer?: UserDoc, revealPhotos = false) {
  const c = viewer ? compatibility(viewer, u) : null
  return {
    id: u.handle,
    name: u.name,
    age: u.age,
    pronouns: u.pronouns,
    gender: u.gender,
    area: u.area,
    distanceKm: u.distanceKm,
    avatar: u.avatar,
    compat: c?.overall ?? null,
    breakdown: c?.breakdown ?? null,
    sharedLine: c?.sharedLine ?? '',
    interests: u.interests,
    traits: u.traits,
    food: u.food,
    datePrefs: u.datePrefs,
    lifestyle: u.lifestyle,
    intention: u.intention,
    conversation: u.conversation,
    about: u.about,
    prompts: u.prompts,
    verified: u.verification?.status === 'verified',
    favoriteVenue: u.favoriteVenue,
    photos: revealPhotos ? u.photos : [],
    photosLocked: !revealPhotos,
  }
}

export function selfDto(u: UserDoc) {
  return { ...personDto(u), handle: u.handle, email: u.email, role: u.role, mode: u.mode, interestedIn: u.interestedIn, photos: u.photos, photosLocked: false, verification: u.verification, onboarded: u.onboarded !== false, trustedContact: u.trustedContact ?? null }
}

export function venueDto(v: any, experiences: any[] = []) {
  return {
    id: v.slug,
    name: v.name,
    kind: v.kind,
    category: v.category,
    tags: v.tags,
    area: v.area,
    distanceKm: v.distanceKm,
    rating: v.rating,
    reviews: v.reviews,
    emoji: v.emoji,
    tone: v.tone,
    ambience: v.ambience,
    treats: v.treats,
    slots: v.slots,
    verified: v.status === 'verified',
    featured: v.featured,
    // "Know before you go". Phone and licence numbers are deliberately not public.
    description: v.description ?? '',
    address: v.address ?? '',
    landmark: v.landmark ?? '',
    mapsUrl: v.mapsUrl ?? '',
    priceForTwo: v.priceForTwo ?? null,
    hours: v.hours?.days?.length ? v.hours : null,
    photos: v.photos ?? [],
    goodToKnow: v.goodToKnow ?? {},
    policies: v.policies ?? {},
    packages: experiences
      .filter((e) => String(e.venue?._id ?? e.venue) === String(v._id) && e.active)
      .map(experienceDto),
  }
}

export function experienceDto(e: any) {
  return { id: e.code, name: e.name, includes: e.includes, price: e.price, duration: e.duration, days: e.days, capacity: e.capacity, active: e.active, emoji: e.emoji }
}

const handleOf = (u: any) => (u && typeof u === 'object' && 'handle' in u ? u.handle : String(u))

export function proposalDto(p: any) {
  const last = p.history?.[p.history.length - 1]
  return {
    id: String(p._id),
    from: handleOf(p.from),
    to: handleOf(p.to),
    venueId: p.venue?.slug ?? String(p.venue),
    packageId: p.experience?.code ?? String(p.experience),
    day: p.day,
    time: p.time,
    startsAt: p.startsAt,
    treatForReceiver: p.treatForReceiver ?? null,
    treatForSender: p.treatForSender ?? null,
    note: p.note ?? '',
    status: p.status,
    lastEditedBy: handleOf(p.lastEditedBy),
    changes: last?.action === 'customized' ? last.changes : [],
    bookingRef: p.booking?.ref ?? null,
    createdAt: p.createdAt,
  }
}

export function bookingDto(b: any) {
  return {
    id: String(b._id),
    ref: b.ref,
    kind: b.kind,
    title: b.title,
    venueId: b.venue?.slug ?? String(b.venue),
    venue: b.venue?.name,
    area: b.venue?.area,
    emoji: b.venue?.emoji,
    packageId: b.experience?.code,
    day: b.day,
    time: b.time,
    startsAt: b.startsAt,
    items: b.items,
    price: b.price,
    gift: b.gift?.id ? b.gift : null,
    status: b.status,
    users: (b.users ?? []).map(handleOf),
    treats: b.treats,
  }
}

export const idEq = (a: Types.ObjectId | string | undefined | null, b: Types.ObjectId | string | undefined | null) => !!a && !!b && String(a) === String(b)
