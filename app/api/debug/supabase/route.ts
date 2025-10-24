import { NextResponse } from 'next/server'
import supabaseServer from '@/lib/supabase-server'

export async function GET() {
  const supabaseUrlPresent = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKeyPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRolePresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const { data, error, count } = await supabaseServer
      .from('users')
      .select('id', { count: 'exact' })
      .limit(1)

    return NextResponse.json({
      env: {
        urlPresent: supabaseUrlPresent,
        anonPresent: anonKeyPresent,
        servicePresent: serviceRolePresent,
      },
      table: {
        usersCount: count ?? null,
        sampleId: data?.[0]?.id ?? null,
      },
      ok: !error,
      error: error?.message ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({
      env: {
        urlPresent: supabaseUrlPresent,
        anonPresent: anonKeyPresent,
        servicePresent: serviceRolePresent,
      },
      ok: false,
      error: e?.message || 'Unknown error when connecting to Supabase',
    }, { status: 500 })
  }
}
