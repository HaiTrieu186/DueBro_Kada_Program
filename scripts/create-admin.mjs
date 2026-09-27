import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ttmgdujhrdvwlkbnxprh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY. Vui lòng thiết lập trước khi chạy.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = 'admin@duebro.vn';
  const password = 'DueBro@2026Ops';

  console.log(`Kiểm tra tài khoản ${email}...`);
  const { data, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    console.error('Lỗi khi truy vấn danh sách users:', listError);
    process.exit(1);
  }

  const existingUser = data.users.find((u) => u.email === email);

  if (existingUser) {
    console.log(`Tài khoản ${email} đã tồn tại (ID: ${existingUser.id}). Tiến hành cập nhật mật khẩu & quyền ops...`);
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        app_metadata: { ...existingUser.app_metadata, role: 'ops' },
        user_metadata: { ...existingUser.user_metadata, display_name: 'Ops Admin' },
      }
    );

    if (updateError) {
      console.error('Lỗi cập nhật user:', updateError);
      process.exit(1);
    }

    console.log('Cập nhật tài khoản admin thành công:', updated.user.email);
    console.log('ID:', updated.user.id);
    console.log('Role:', updated.user.app_metadata?.role);
  } else {
    console.log(`Tạo mới tài khoản ${email}...`);
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'ops' },
      user_metadata: { display_name: 'Ops Admin' },
    });

    if (createError) {
      console.error('Lỗi tạo user:', createError);
      process.exit(1);
    }

    console.log('Tạo tài khoản admin thành công:', created.user.email);
    console.log('ID:', created.user.id);
    console.log('Role:', created.user.app_metadata?.role);
  }
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
