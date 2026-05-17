import { initSupabase } from '../lib/supabase'

export interface ServiceCategory {
  id: string
  name: string
  displayOrder: number
}

interface ServiceCategoryRow {
  id: string
  name: string
  display_order: number
}

function toServiceCategory(row: ServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
  }
}

// ─── Admin functions (SECURITY DEFINER RPCs) ──────────────────────────────────

export async function adminListCategories(): Promise<ServiceCategory[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_categories')
  if (error) throw error
  return ((data ?? []) as ServiceCategoryRow[]).map(toServiceCategory)
}

export async function adminCreateCategory(
  name: string,
  displayOrder = 0,
): Promise<ServiceCategory> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_create_category', {
    p_name: name,
    p_display_order: displayOrder,
  })
  if (error) throw error
  const rows = (data ?? []) as ServiceCategoryRow[]
  if (rows.length === 0) throw new Error('No se pudo crear la categoría.')
  return toServiceCategory(rows[0])
}

export async function adminUpdateCategory(
  id: string,
  name: string,
  displayOrder: number,
): Promise<ServiceCategory> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_update_category', {
    p_id: id,
    p_name: name,
    p_display_order: displayOrder,
  })
  if (error) throw error
  const rows = (data ?? []) as ServiceCategoryRow[]
  if (rows.length === 0) throw new Error('No se pudo actualizar la categoría.')
  return toServiceCategory(rows[0])
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_delete_category', { p_id: id })
  if (error) throw error
}

// ─── Public function (anon-safe direct query) ─────────────────────────────────

export async function listCategories(): Promise<ServiceCategory[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, display_order')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return ((data ?? []) as ServiceCategoryRow[]).map(toServiceCategory)
}
