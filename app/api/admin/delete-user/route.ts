import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  // Hanya Super Admin yang bisa menghapus user
  const supabaseServer = await createServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseServer.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'Super Admin') {
    return NextResponse.json(
      { error: 'Forbidden: Hanya Super Admin yang dapat menghapus akun pengguna.' },
      { status: 403 }
    );
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 });
  }

  // Tidak bisa hapus diri sendiri
  if (userId === user.id) {
    return NextResponse.json({ error: 'Tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Hapus dari public.users terlebih dahulu
  await supabaseAdmin.from('users').delete().eq('id', userId);

  // Hapus dari Supabase Auth
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
