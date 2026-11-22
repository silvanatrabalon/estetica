import {
  computeBusinessReadiness,
  normalizeBusinessColor,
  normalizeBusinessName,
  normalizeBusinessText,
  validateBusinessClosure,
  validateBusinessHours,
  validateBusinessIdentity,
  type BusinessClosureInput,
  type BusinessClosureType,
  type BusinessHoursInput,
} from '../lib/businessSettings'
import { initSupabase } from '../lib/supabase'

export interface BusinessHoursRecord {
  id: string
  organizationId: string
  dayOfWeek: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
  pmOpensAt: string | null
  pmClosesAt: string | null
}

export interface BusinessClosureRecord {
  id: string
  organizationId: string
  closureDate: string
  closureType: BusinessClosureType
  startsAt: string | null
  endsAt: string | null
  reason: string | null
}

export interface BusinessSettingsRecord {
  organizationId: string
  name: string
  slug: string
  timezone: string
  logoUrl: string | null
  /** Where the shop is. Shown in the website footer. */
  address: string | null
  primaryColor: string | null
  bookingHeaderText: string | null
  bookingSubtitleText: string | null
  bookingMinNoticeMinutes: number
  bookingMaxHorizonDays: number
  notificationsEnabled: boolean
  /** true = morning + afternoon shifts with a break; false = one continuous day. */
  splitShifts: boolean
  weeklyHours: BusinessHoursRecord[]
  closures: BusinessClosureRecord[]
  readiness: {
    isReady: boolean
    missing: string[]
  }
}

interface OrganizationRow {
  id: string
  name: string
  slug: string
  timezone: string
  logo_url: string | null
  address: string | null
  brand_primary_color: string | null
  booking_header_text: string | null
  booking_subtitle_text: string | null
  booking_min_notice_minutes: number | null
  booking_max_horizon_days: number | null
  notifications_enabled: boolean | null
  split_shifts: boolean | null
  created_at: string
}

interface BusinessHoursRow {
  id: string
  organization_id: string
  day_of_week: number
  is_closed: boolean
  opens_at: string | null
  closes_at: string | null
  pm_opens_at: string | null
  pm_closes_at: string | null
}

interface BusinessClosureRow {
  id: string
  organization_id: string
  closure_date: string
  closure_type: BusinessClosureType
  starts_at: string | null
  ends_at: string | null
  reason: string | null
}

const ORGANIZATION_SELECT = [
  'id',
  'name',
  'slug',
  'timezone',
  'logo_url',
  'address',
  'brand_primary_color',
  'booking_header_text',
  'booking_subtitle_text',
  'booking_min_notice_minutes',
  'booking_max_horizon_days',
  'notifications_enabled',
  'split_shifts',
  'created_at',
].join(', ')

const DEFAULT_SINGLETON_ORGANIZATION = {
  name: 'Mi Estetica',
  slug: 'negocio-principal',
  timezone: 'UTC',
}

function defaultWeekHours(organizationId: string): BusinessHoursInput[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isClosed: true,
    opensAt: null,
    closesAt: null,
    pmOpensAt: null,
    pmClosesAt: null,
    organizationId,
  } as BusinessHoursInput & { organizationId: string }))
}

function toBusinessHoursRecord(row: BusinessHoursRow): BusinessHoursRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    dayOfWeek: row.day_of_week,
    isClosed: row.is_closed,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    pmOpensAt: row.pm_opens_at ?? null,
    pmClosesAt: row.pm_closes_at ?? null,
  }
}

function toBusinessClosureRecord(row: BusinessClosureRow): BusinessClosureRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    closureDate: row.closure_date,
    closureType: row.closure_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  }
}

function toBusinessSettingsRecord(
  organization: OrganizationRow,
  weeklyHours: BusinessHoursRecord[],
  closures: BusinessClosureRecord[],
): BusinessSettingsRecord {
  return {
    organizationId: organization.id,
    name: organization.name,
    slug: organization.slug,
    timezone: organization.timezone,
    logoUrl: organization.logo_url,
    address: organization.address ?? null,
    primaryColor: organization.brand_primary_color,
    bookingHeaderText: organization.booking_header_text,
    bookingSubtitleText: organization.booking_subtitle_text,
    bookingMinNoticeMinutes: organization.booking_min_notice_minutes ?? 60,
    bookingMaxHorizonDays: organization.booking_max_horizon_days ?? 60,
    notificationsEnabled: organization.notifications_enabled ?? true,
    splitShifts: organization.split_shifts ?? false,
    weeklyHours,
    closures,
    readiness: computeBusinessReadiness({
      name: organization.name,
      timezone: organization.timezone,
      weeklyHours,
    }),
  }
}

async function resolveSingletonOrganization(): Promise<OrganizationRow> {
  const supabase = initSupabase()

  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_SELECT)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<OrganizationRow>()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const { data: inserted, error: insertError } = await supabase
    .from('organizations')
    .insert({
      ...DEFAULT_SINGLETON_ORGANIZATION,
      updated_at: new Date().toISOString(),
    })
    .select(ORGANIZATION_SELECT)
    .single<OrganizationRow>()

  if (!insertError && inserted) {
    return inserted
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('organizations')
    .select(ORGANIZATION_SELECT)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<OrganizationRow>()

  if (fallbackError) {
    throw fallbackError
  }

  if (!fallback) {
    throw insertError ?? new Error('No pudimos resolver el negocio principal.')
  }

  return fallback
}

async function ensureWeeklyHours(organizationId: string): Promise<BusinessHoursRecord[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('business_hours')
    .select('id, organization_id, day_of_week, is_closed, opens_at, closes_at, pm_opens_at, pm_closes_at')
    .eq('organization_id', organizationId)
    .order('day_of_week', { ascending: true })

  if (error) {
    throw error
  }

  const existing = (data ?? []) as BusinessHoursRow[]
  const missingDays = defaultWeekHours(organizationId)
    .filter((hour) => !existing.some((row) => row.day_of_week === hour.dayOfWeek))
    .map((hour) => ({
      organization_id: organizationId,
      day_of_week: hour.dayOfWeek,
      is_closed: true,
      opens_at: null,
      closes_at: null,
      pm_opens_at: null,
      pm_closes_at: null,
      updated_at: new Date().toISOString(),
    }))

  if (missingDays.length > 0) {
    const { error: insertError } = await supabase.from('business_hours').insert(missingDays)

    if (insertError) {
      throw insertError
    }

    const { data: refreshed, error: refreshedError } = await supabase
      .from('business_hours')
      .select('id, organization_id, day_of_week, is_closed, opens_at, closes_at, pm_opens_at, pm_closes_at')
      .eq('organization_id', organizationId)
      .order('day_of_week', { ascending: true })

    if (refreshedError) {
      throw refreshedError
    }

    return ((refreshed ?? []) as BusinessHoursRow[]).map(toBusinessHoursRecord)
  }

  return existing.map(toBusinessHoursRecord)
}

async function listClosures(organizationId: string): Promise<BusinessClosureRecord[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('business_closure_exceptions')
    .select('id, organization_id, closure_date, closure_type, starts_at, ends_at, reason')
    .eq('organization_id', organizationId)
    .order('closure_date', { ascending: true })
    .order('starts_at', { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as BusinessClosureRow[]).map(toBusinessClosureRecord)
}

export async function getBusinessSettings(): Promise<BusinessSettingsRecord> {
  const organization = await resolveSingletonOrganization()
  const [weeklyHours, closures] = await Promise.all([
    ensureWeeklyHours(organization.id),
    listClosures(organization.id),
  ])

  return toBusinessSettingsRecord(organization, weeklyHours, closures)
}

export async function saveBusinessSettings(input: {
  name: string
  timezone: string
  // Branding fields are optional: only the ones provided are written, so saving the
  // business rules never overwrites what was set in Apariencia.
  logoUrl?: string
  /** Only written when provided, like the branding fields. */
  address?: string
  primaryColor?: string
  bookingHeaderText?: string
  bookingSubtitleText?: string
  weeklyHours: BusinessHoursInput[]
}): Promise<BusinessSettingsRecord> {
  const identityValidation = validateBusinessIdentity({
    name: input.name,
    timezone: input.timezone,
    primaryColor: input.primaryColor === undefined ? undefined : normalizeBusinessColor(input.primaryColor),
    address: input.address,
  })

  if (!identityValidation.valid) {
    throw new Error(Object.values(identityValidation.errors)[0] ?? 'La configuracion del negocio es invalida.')
  }

  for (const hour of input.weeklyHours) {
    const validation = validateBusinessHours(hour)
    if (!validation.valid) {
      throw new Error(Object.values(validation.errors)[0] ?? 'Los horarios del negocio son invalidos.')
    }
  }

  const organization = await resolveSingletonOrganization()
  const supabase = initSupabase()
  const now = new Date().toISOString()

  const { error: organizationError } = await supabase
    .from('organizations')
    .update({
      name: normalizeBusinessName(input.name),
      timezone: input.timezone.trim(),
      ...(input.logoUrl === undefined ? {} : { logo_url: normalizeBusinessText(input.logoUrl) }),
      ...(input.address === undefined ? {} : { address: normalizeBusinessText(input.address) }),
      ...(input.primaryColor === undefined
        ? {}
        : { brand_primary_color: normalizeBusinessColor(input.primaryColor) }),
      ...(input.bookingHeaderText === undefined
        ? {}
        : { booking_header_text: normalizeBusinessText(input.bookingHeaderText) }),
      ...(input.bookingSubtitleText === undefined
        ? {}
        : { booking_subtitle_text: normalizeBusinessText(input.bookingSubtitleText) }),
      updated_at: now,
    })
    .eq('id', organization.id)

  if (organizationError) {
    throw organizationError
  }

  const { error: hoursError } = await supabase.from('business_hours').upsert(
    input.weeklyHours.map((hour) => ({
      organization_id: organization.id,
      day_of_week: hour.dayOfWeek,
      is_closed: hour.isClosed,
      opens_at: hour.isClosed ? null : hour.opensAt || null,
      closes_at: hour.isClosed ? null : hour.closesAt || null,
      pm_opens_at: hour.isClosed ? null : hour.pmOpensAt || null,
      pm_closes_at: hour.isClosed ? null : hour.pmClosesAt || null,
      updated_at: now,
    })),
    { onConflict: 'organization_id,day_of_week' },
  )

  if (hoursError) {
    throw hoursError
  }

  return getBusinessSettings()
}

/** The master switch of the appointment emails. Who gets the copies is chosen with setNotificationAdmins. */
export async function saveNotificationSettings(input: { notificationsEnabled: boolean }): Promise<void> {
  const organization = await resolveSingletonOrganization()
  const supabase = initSupabase()

  const { error } = await supabase
    .from('organizations')
    .update({
      notifications_enabled: input.notificationsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organization.id)

  if (error) {
    throw error
  }
}

export async function saveBusinessClosure(input: BusinessClosureInput & { id?: string }): Promise<BusinessClosureRecord> {
  const validation = validateBusinessClosure(input)

  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0] ?? 'El cierre excepcional es invalido.')
  }

  const organization = await resolveSingletonOrganization()
  const supabase = initSupabase()
  const payload = {
    organization_id: organization.id,
    closure_date: input.closureDate,
    closure_type: input.closureType,
    starts_at: input.closureType === 'half_day' ? input.startsAt : null,
    ends_at: input.closureType === 'half_day' ? input.endsAt : null,
    reason: normalizeBusinessText(input.reason ?? ''),
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('business_closure_exceptions')
      .update(payload)
      .eq('id', input.id)
      .select('id, organization_id, closure_date, closure_type, starts_at, ends_at, reason')
      .single<BusinessClosureRow>()

    if (error) {
      throw error
    }

    return toBusinessClosureRecord(data)
  }

  const { data, error } = await supabase
    .from('business_closure_exceptions')
    .insert(payload)
    .select('id, organization_id, closure_date, closure_type, starts_at, ends_at, reason')
    .single<BusinessClosureRow>()

  if (error) {
    throw error
  }

  return toBusinessClosureRecord(data)
}

export async function deleteBusinessClosure(closureId: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase
    .from('business_closure_exceptions')
    .delete()
    .eq('id', closureId)

  if (error) {
    throw error
  }
}

export async function updateBookingPolicy(
  minNoticeMinutes: number,
  maxHorizonDays: number,
): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_update_booking_policy', {
    p_min_notice_minutes: minNoticeMinutes,
    p_max_horizon_days: maxHorizonDays,
  })

  if (error) {
    throw error
  }
}
/**
 * Switches the business between one continuous working day and two shifts.
 * Turning split shifts off merges every day (business hours, schedules and special
 * days) into a single window, first start to last end.
 */
export async function setSplitShifts(enabled: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_split_shifts', { p_enabled: enabled })

  if (error) {
    throw error
  }
}

/** Whether the business works in two shifts. Defaults to false if the lookup fails. */
export async function getSplitShifts(): Promise<boolean> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('organizations')
    .select('split_shifts')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ split_shifts: boolean | null }>()

  if (error) {
    return false
  }

  return data?.split_shifts ?? false
}

export interface NotificationAdmin {
  userId: string
  name: string
  email: string | null
  /** Gets a copy of the appointment emails. */
  notify: boolean
}

/** The administrators and whether each one gets a copy of the appointment emails. */
export async function listNotificationAdmins(): Promise<NotificationAdmin[]> {
  const { data, error } = await initSupabase().rpc('admin_list_notification_admins')
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<{ user_id: string; name: string; email: string | null; notify: boolean }>).map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    notify: row.notify,
  }))
}

/** Sets which administrators get the copies: the given ones on, every other administrator off. */
export async function setNotificationAdmins(userIds: string[]): Promise<void> {
  const { error } = await initSupabase().rpc('admin_set_notification_admins', { p_user_ids: userIds })
  if (error) throw new Error(error.message)
}

