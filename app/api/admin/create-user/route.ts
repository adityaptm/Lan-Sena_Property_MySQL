import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Verify caller is Super Admin
  const supabaseServer = await createServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseServer.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
  }

  const { email, password, nama, role } = await req.json();
  if (!email || !password || !nama || !role) {
    return NextResponse.json({ error: 'Email, password, nama, dan role wajib diisi' }, { status: 400 });
  }

  // Use service role key to create user (server-side only)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nama },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Insert into public.users with the assigned role
  if (newUser?.user) {
    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: newUser.user.id,
      email,
      nama,
      role,
      is_active: true,
    });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, userId: newUser?.user?.id });
}
