import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  // x-skip-notifications: the app adds it to every request while notifications are off in local development
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-skip-notifications',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ── Validate JWT and caller role ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Anon client to verify the caller's JWT
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  // Verify the caller is authenticated
  const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser()
  if (authError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid JWT' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Check caller has admin role
  const { data: roleRows, error: roleError } = await callerClient
    .from('user_roles')
    .select('role')
    .eq('user_id', callerUser.id)
    .eq('role', 'admin')
    .limit(1)

  if (roleError || !roleRows || roleRows.length === 0) {
    return new Response(JSON.stringify({ error: 'Unauthorized: admin role required' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ── Parse request body ────────────────────────────────────────────────────
  let userId: string
  try {
    const body = await req.json()
    userId = body.userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Missing userId')
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body: userId is required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ── Pre-deletion steps using service-role client ──────────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Step 1: Cancel pending/confirmed appointments where customer_user_id = userId
  const { data: cancelledRows, error: cancelError } = await adminClient
    .from('appointments')
    .update({ status: 'cancelled' })
    .in('status', ['pending', 'confirmed'])
    .eq('customer_user_id', userId)
    .select('id')

  if (cancelError) {
    return new Response(JSON.stringify({ error: `Failed to cancel appointments: ${cancelError.message}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const cancelledAppointments = cancelledRows?.length ?? 0

  // Step 2: NULL out created_by_user_id on appointments created by this user
  const { error: nullifyError } = await adminClient
    .from('appointments')
    .update({ created_by_user_id: null })
    .eq('created_by_user_id', userId)

  if (nullifyError) {
    return new Response(JSON.stringify({ error: `Failed to nullify created_by_user_id: ${nullifyError.message}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Step 3: Deactivate staff_members row if it exists
  const { error: staffError } = await adminClient
    .from('staff_members')
    .update({ is_active: false })
    .eq('profile_user_id', userId)

  if (staffError) {
    return new Response(JSON.stringify({ error: `Failed to deactivate staff member: ${staffError.message}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Step 4: Delete the user (cascades profiles and user_roles; NULLs customer_user_id on appointments)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    return new Response(JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ deletedUserId: userId, cancelledAppointments }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    },
  )
})
