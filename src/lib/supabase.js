import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── DB HELPERS ───────────────────────────────────────────────────────────────

export async function checkRegistration(phone) {
  const raw = normalizePhone(phone)
  const digits = raw.replace(/\D/g, '')
  const candidates = new Set([raw])

  // If user entered a 10-digit number, try with +91 prefix
  if (digits.length === 10) {
    candidates.add(`+91${digits}`)
    candidates.add(digits)
  }

  // Leading 0 -> remove and add +91
  if (digits.length === 11 && digits.startsWith('0')) {
    candidates.add(`+91${digits.slice(1)}`)
    candidates.add(digits.slice(1))
  }

  // If user entered 91xxxxxxxxxx (12 digits starting with 91), try +91 version
  if (digits.length === 12 && digits.startsWith('91')) {
    candidates.add(`+${digits}`)
    candidates.add(digits.slice(2))
  }

  // If input had a leading +, also try the version without +
  if (raw.startsWith('+')) candidates.add(raw.replace(/^\+/, ''))

  const candidateArray = Array.from(candidates)

  // If we have only one candidate, use eq for clarity, otherwise use .in()
  let resp
  if (candidateArray.length === 1) {
    resp = await supabase
      .from('registrations')
      .select('id, name, phone')
      .eq('phone', candidateArray[0])
      .maybeSingle()
  } else {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, name, phone')
      .in('phone', candidateArray)
      .maybeSingle()
    if (error) throw error
    return data
  }

  const { data, error } = resp
  if (error) throw error
  return data // null if not registered
}

export async function submitRegistration(formData) {
  const payload = {
    // store canonical +91XXXXXXXXXX when possible for data consistency
    phone: canonicalizePhone(normalizePhone(formData.phone)),
    name: formData.name?.trim(),
    fathers_name: formData.fathersName?.trim(),
    email: formData.email?.trim(),
    college: formData.college?.trim(),
    course: formData.course?.trim(),
    year: formData.year?.trim(),
    area: formData.area?.trim(),
    unit: formData.unit?.trim(),
    panchayat: formData.panchayat?.trim(),
    role: formData.role?.trim(),
    instagram: formData.instagram?.trim(),
    photo_url: formData.photo || null,
    source: formData.source || 'new',
  }
  const { data, error } = await supabase
    .from('registrations')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

// Convert a user-provided phone string into canonical +91XXXXXXXXXX when
// possible. If a canonical form can't be derived, returns the cleaned input.
export function canonicalizePhone(p = '') {
  const cleaned = String(p).replace(/\s+/g, '').trim()
  const digits = cleaned.replace(/\D/g, '')

  if (digits.length < 10) return cleaned

  // take the last 10 digits as the national number and prefix with +91
  const last10 = digits.slice(-10)
  return `+91${last10}`
}

export async function fetchAllRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('registered_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteRegistration(id) {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getRegistrationCount() {
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count
}

// Mark a registration as checked-in (or undo). Assumes `checked_in` boolean column exists.
export async function setCheckIn(id, checked = true) {
  const { data, error } = await supabase
    .from('registrations')
    .update({ checked_in: checked })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export function normalizePhone(p = '') {
  return p.replace(/\s+/g, '').trim()
}
