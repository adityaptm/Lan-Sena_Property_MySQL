import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Verify caller is Super Admin or Admin
  const supabaseServer = await createServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseServer.from('users').select('role').eq('id', user.id).single();
  const callerRole = profile?.role;

  if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
    return NextResponse.json(
      { error: 'Forbidden: Hanya Super Admin atau Admin yang dapat membuat akun pengguna.' },
      { status: 403 }
    );
  }

  const { email: rawEmail, password, nama, role } = await req.json();
  if (!rawEmail || !password || !nama || !role) {
    return NextResponse.json({ error: 'Email, password, nama, dan role wajib diisi' }, { status: 400 });
  }

  // Normalize email — jika tidak ada @, tambahkan domain default
  const email = rawEmail.includes('@')
    ? rawEmail.toLowerCase().trim()
    : `${rawEmail.toLowerCase().trim()}@lansena.id`;

  // Admin tidak boleh assign role Super Admin
  if (callerRole === 'Admin' && role === 'Super Admin') {
    return NextResponse.json(
      { error: 'Admin tidak dapat membuat akun dengan role Super Admin.' },
      { status: 403 }
    );
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

  return NextResponse.json({ success: true, userId: newUser?.user?.id, email });
}
