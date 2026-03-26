import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── DB HELPERS ───────────────────────────────────────────────────────────────

export async function checkRegistration(phone) {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, name, phone')
    .eq('phone', normalizePhone(phone))
    .maybeSingle()
  if (error) throw error
  return data // null if not registered
}

export async function submitRegistration(formData) {
  const payload = {
    phone: normalizePhone(formData.phone),
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

export function normalizePhone(p = '') {
  return p.replace(/\s+/g, '').trim()
}
