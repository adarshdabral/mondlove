import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

/* ------------------------------------------------------------------ */
/* Shared sub-documents                                               */
/* ------------------------------------------------------------------ */

// A menu item (or activity option). Doubles as a "Date Token" people pick for each other.
const TreatSchema = new Schema(
  { name: { type: String, required: true }, emoji: { type: String, required: true }, note: String, photo: String, price: Number, diet: { type: String, enum: ['veg', 'nonveg', 'egg'] } },
  { _id: false },
)
const InterestSchema = new Schema({ emoji: { type: String, required: true }, label: { type: String, required: true } }, { _id: false })
const LabelValueSchema = new Schema({ label: { type: String, required: true }, value: { type: String, required: true } }, { _id: false })
const PromptSchema = new Schema({ q: String, a: String }, { _id: false })

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

const UserSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'partner', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    mode: { type: String, enum: ['single', 'couple', 'both'], default: 'single' },
    age: Number,
    pronouns: String,
    gender: { type: String, enum: ['woman', 'man', 'nonbinary'] },
    area: String,
    distanceKm: Number,
    avatar: { type: Schema.Types.Mixed, required: true },
    // Real photos are private: only revealed to people you have a confirmed date or couple with.
    photos: { type: [String], default: [] },
    interests: { type: [InterestSchema], default: [] },
    traits: { type: [String], default: [] },
    food: { type: [String], default: [] },
    datePrefs: { type: [String], default: [] },
    lifestyle: { type: [LabelValueSchema], default: [] },
    intention: String,
    conversation: String,
    about: String,
    prompts: { type: [PromptSchema], default: [] },
    interestedIn: { type: String, enum: ['women', 'men', 'everyone'], default: 'everyone' },
    favoriteVenue: String,
    // False until the person finishes onboarding (avatar, interests, preferences).
    onboarded: { type: Boolean, default: true },
    trustedContact: { name: String, phone: String },
    verification: {
      status: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
      method: String,
      score: Number,
    },
  },
  { timestamps: true },
)
export const User = model('User', UserSchema)
export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId }

/* ------------------------------------------------------------------ */
/* Couples & memories                                                 */
/* ------------------------------------------------------------------ */

const CoupleSchema = new Schema(
  {
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], validate: (v: unknown[]) => v.length === 2 },
    status: { type: String, enum: ['pending', 'verified'], default: 'verified' },
    source: { type: String, enum: ['mingleo_date', 'invite'], required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    since: { type: Date, default: Date.now },
    occasions: { type: [new Schema({ label: String, date: Date }, { _id: false })], default: [] },
  },
  { timestamps: true },
)
CoupleSchema.index({ members: 1 })
export const Couple = model('Couple', CoupleSchema)

const MemorySchema = new Schema(
  {
    couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    title: { type: String, required: true },
    venueName: String,
    emoji: String,
    tone: [String],
    date: { type: Date, default: Date.now },
    occasion: String,
    note: String,
    photos: { type: [String], default: [] },
    rating: Number,
  },
  { timestamps: true },
)
export const Memory = model('Memory', MemorySchema)

/* ------------------------------------------------------------------ */
/* Venues & experiences                                               */
/* ------------------------------------------------------------------ */

const VenueSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ['cafe', 'restaurant', 'activity'], required: true },
    category: String,
    tags: { type: [String], default: [] },
    area: String,
    city: { type: String, default: 'Dehradun' },
    location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [78.0322, 30.3165] } }, // Dehradun
    distanceKm: Number,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    emoji: String,
    tone: [String],
    ambience: { type: [String], default: [] },
    treats: { type: [TreatSchema], default: [] },
    slots: { type: [String], default: [] },
    // Listing details people see before booking (see lib/venueInfo.ts for the allowed values).
    description: String,
    address: String,
    landmark: String,
    mapsUrl: String,
    phone: String, // shared with guests only once they have a booking
    priceForTwo: Number,
    hours: { days: [String], open: String, close: String },
    photos: { type: [new Schema({ url: { type: String, required: true }, caption: String }, { _id: false })], default: [] },
    goodToKnow: { type: Schema.Types.Mixed, default: {} },
    policies: { cancellation: String, lateArrival: String, houseRules: String },
    licence: { fssai: String, gst: String }, // private: owner and admins only
    submittedAt: Date,
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    // draft → (owner submits) → pending → (admin approves) → verified
    status: { type: String, enum: ['draft', 'pending', 'verified', 'suspended'], default: 'draft' },
    documents: { type: [String], default: [] },
    commissionRate: { type: Number, default: 0.12 },
    plan: { type: String, enum: ['standard', 'pro'], default: 'standard' },
    featured: { type: Boolean, default: false },
    // Capacity per weekday + time, e.g. { "Fri-7:30 PM": 4 }. Missing keys fall back to experience capacity.
    availability: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
)
VenueSchema.index({ location: '2dsphere' })
export const Venue = model('Venue', VenueSchema)

const ExperienceSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    name: { type: String, required: true },
    includes: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    duration: String,
    days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    capacity: { type: Number, default: 4, min: 0 },
    active: { type: Boolean, default: true },
    emoji: String,
  },
  { timestamps: true },
)
export const Experience = model('Experience', ExperienceSchema)

/** Inventory: one document per experience + date + time. `booked` is incremented atomically. */
const SlotSchema = new Schema({
  experience: { type: Schema.Types.ObjectId, ref: 'Experience', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  capacity: { type: Number, required: true },
  booked: { type: Number, default: 0 },
})
SlotSchema.index({ experience: 1, date: 1, time: 1 }, { unique: true })
export const Slot = model('Slot', SlotSchema)

/* ------------------------------------------------------------------ */
/* Proposals                                                          */
/* ------------------------------------------------------------------ */

const ProposalSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    experience: { type: Schema.Types.ObjectId, ref: 'Experience', required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    startsAt: { type: Date, required: true },
    treatForReceiver: TreatSchema,
    treatForSender: TreatSchema,
    note: { type: String, maxlength: 140 },
    status: { type: String, enum: ['sent', 'customized', 'confirmed', 'declined', 'cancelled'], default: 'sent', index: true },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    history: {
      type: [new Schema({ by: Schema.Types.ObjectId, action: String, changes: [String], at: { type: Date, default: Date.now } }, { _id: false })],
      default: [],
    },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  },
  { timestamps: true },
)
export const Proposal = model('Proposal', ProposalSchema)

/* ------------------------------------------------------------------ */
/* Bookings, payments, revenue                                        */
/* ------------------------------------------------------------------ */

const BookingSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['date', 'lab', 'surprise', 'marketplace'], required: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    experience: { type: Schema.Types.ObjectId, ref: 'Experience', required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    proposal: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    title: String,
    day: String,
    time: String,
    startsAt: { type: Date, index: true },
    items: { type: [String], default: [] },
    treats: { forSender: TreatSchema, forReceiver: TreatSchema },
    price: { type: Number, required: true },
    gift: { id: String, label: String, price: Number },
    secret: { hint: String, message: String },
    status: { type: String, enum: ['pending', 'confirmed', 'arrived', 'completed', 'cancelled'], default: 'confirmed', index: true },
    feedback: {
      type: [new Schema({ user: Schema.Types.ObjectId, rating: Number, tags: [String], continue: String, at: { type: Date, default: Date.now } }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true },
)
export const Booking = model('Booking', BookingSchema)

const PaymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    payer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: { type: String, default: 'mock' },
    providerRef: String,
    status: { type: String, enum: ['authorized', 'captured', 'refunded'], default: 'authorized' },
  },
  { timestamps: true },
)
export const Payment = model('Payment', PaymentSchema)

export const REVENUE_STREAMS = [
  'booking_commission',
  'experience_commission',
  'subscription',
  'couple_pass',
  'featured_placement',
  'partner_pro',
  'gifts_addons',
  'brand_partnership',
] as const

/** Append-only ledger. Reversals are recorded as negative entries, never edits. */
const RevenueSchema = new Schema(
  {
    stream: { type: String, enum: REVENUE_STREAMS, required: true, index: true },
    amount: { type: Number, required: true },
    gross: Number,
    rate: Number,
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', index: true },
    note: String,
    at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)
export const Revenue = model('Revenue', RevenueSchema)

/* ------------------------------------------------------------------ */
/* Media (photos). Stored in MongoDB for now; move to object storage  */
/* (S3/R2 + signed URLs) before scale. Access is checked per request. */
/* ------------------------------------------------------------------ */

const MediaSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['profile', 'memory', 'venue', 'menu'], required: true },
    couple: { type: Schema.Types.ObjectId, ref: 'Couple' },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue' },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
    data: { type: Buffer, required: true, select: false },
    size: Number,
  },
  { timestamps: true },
)
export const Media = model('Media', MediaSchema)

/* ------------------------------------------------------------------ */
/* Safety: reports & blocks (not in the original diagram)             */
/* ------------------------------------------------------------------ */

const ReportSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['user', 'venue', 'booking'], required: true },
    target: { type: Schema.Types.ObjectId, required: true },
    targetLabel: String,
    type: { type: String, required: true },
    details: String,
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In review', 'Escalated', 'Resolved'], default: 'Open', index: true },
    automated: { type: Boolean, default: false },
  },
  { timestamps: true },
)
export const Report = model('Report', ReportSchema)

const BlockSchema = new Schema(
  {
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true })
export const Block = model('Block', BlockSchema)
