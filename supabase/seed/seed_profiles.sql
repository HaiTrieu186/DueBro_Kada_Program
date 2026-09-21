-- supabase/seed/seed_profiles.sql
-- Architecture Section 6.5: 18 Hồ sơ Seed Data Đa Dạng Cho Demo Matching & Household
-- Phân bố: 16 hồ sơ tại TP.HCM (Quận 10, Quận 1, Bình Thạnh, Thủ Đức) + 2 hồ sơ tại Hà Nội (chứng minh lọc city)

-- 1. Thêm 18 tài khoản vào auth.users (nếu chưa có)
do $$
declare
  i int;
  uid uuid;
  u_email text;
begin
  for i in 1..18 loop
    uid := ('a0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;
    u_email := 'seed+' || lpad(i::text, 2, '0') || '@duebro.test';
    
    if not exists (select 1 from auth.users where id = uid) then
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) values (
        uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        u_email, crypt('DueBro@2026', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', 'Seed User ' || i),
        now(), now()
      );
    end if;
  end loop;
end $$;

-- 2. Thêm vào profiles và lifestyle_profiles
insert into profiles (id, display_name, avatar_url)
values
  ('a0000000-0000-0000-0000-000000000001', 'Minh Tuấn (Bách Khoa)', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
  ('a0000000-0000-0000-0000-000000000002', 'Hải Đăng (Dev Cú Đêm)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('a0000000-0000-0000-0000-000000000003', 'Thảo My (Kinh Tế)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
  ('a0000000-0000-0000-0000-000000000004', 'Hoàng Nam (Thích Mèo)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
  ('a0000000-0000-0000-0000-000000000005', 'Quỳnh Anh (Ngăn Nắp)', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
  ('a0000000-0000-0000-0000-000000000006', 'Đức Huy (Gamer)', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
  ('a0000000-0000-0000-0000-000000000007', 'Phương Linh (Y Khoa)', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
  ('a0000000-0000-0000-0000-000000000008', 'Gia Bảo (Freelancer)', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
  ('a0000000-0000-0000-0000-000000000009', 'Thu Hà (Dậy Sớm)', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'),
  ('a0000000-0000-0000-0000-000000000010', 'Bảo Long (Gymmer)', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
  ('a0000000-0000-0000-0000-000000000011', 'Khánh Vy (Ngoại Thương)', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150'),
  ('a0000000-0000-0000-0000-000000000012', 'Tuấn Kiệt (Nhiếp Ảnh)', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150'),
  ('a0000000-0000-0000-0000-000000000013', 'Ngọc Hân (Thích Nấu Ăn)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('a0000000-0000-0000-0000-000000000014', 'Văn Hậu (Kiến Trúc)', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150'),
  ('a0000000-0000-0000-0000-000000000015', 'Tuyết Mai (Yên Tĩnh)', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150'),
  ('a0000000-0000-0000-0000-000000000016', 'Trọng Hiếu (Sống Xanh)', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150'),
  -- 2 hồ sơ Hà Nội (để test bộ lọc khác thành phố)
  ('a0000000-0000-0000-0000-000000000017', 'Việt Anh (Hà Nội Cầu Giấy)', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'),
  ('a0000000-0000-0000-0000-000000000018', 'Mai Trang (Hà Nội Bách Khoa)', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150')
on conflict (id) do update set display_name = excluded.display_name, avatar_url = excluded.avatar_url;

-- 3. Chi tiết hồ sơ lối sống đa dạng
insert into lifestyle_profiles (
  user_id, intent, city, district, gender, gender_pref, occupation_type,
  wake_up_time, sleep_time, budget_min, budget_max,
  tidiness_level, noise_tolerance, smokes, has_pet, guest_frequency, guest_curfew,
  bio, is_seed_data, seed_trust_score
)
values
  -- Nhóm 1: Con nhà người ta (Dậy sớm, rất sạch, học sinh viên) -> Phù hợp cao với người nghiêm túc
  ('a0000000-0000-0000-0000-000000000001', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'male', 'same', 'student',
   '06:30', '23:00', 3000000, 4500000, 5, 2, false, false, 'rarely', '22:00',
   'Sinh viên năm 3 Bách Khoa, phòng cần yên tĩnh để học bài, giữ vệ sinh chung.', true, 92),

  -- Nhóm 2: Cú đêm công nghệ (Ngủ 02h, dậy 09h, IT/freelancer)
  ('a0000000-0000-0000-0000-000000000002', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'male', 'any', 'worker',
   '09:00', '02:00', 3500000, 5000000, 3, 4, false, false, 'sometimes', null,
   'Frontend dev làm remote. Thường code ban đêm, ban ngày ngủ yên tĩnh.', true, 84),

  -- Nhóm 3: Nữ kinh tế, thích nấu ăn
  ('a0000000-0000-0000-0000-000000000003', 'seeking_roommate', 'Hồ Chí Minh', 'Bình Thạnh', 'female', 'same', 'student',
   '07:00', '23:30', 2500000, 4000000, 4, 3, false, false, 'sometimes', '22:30',
   'Sinh viên UEH, hòa đồng, hay nấu cơm nhà tiết kiệm chi phí.', true, 88),

  -- Nhóm 4: Yêu thú cưng (Nuôi mèo)
  ('a0000000-0000-0000-0000-000000000004', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'male', 'any', 'freelancer',
   '07:30', '00:00', 3000000, 4500000, 4, 3, false, true, 'sometimes', '23:00',
   'Mình có nuôi 1 bé mèo Anh lông ngắn ngoan ngoãn đã tiêm phòng đủ.', true, 86),

  -- Nhóm 5: Siêu ngăn nắp, ghét khói thuốc
  ('a0000000-0000-0000-0000-000000000005', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 1', 'female', 'same', 'worker',
   '06:00', '22:30', 4000000, 6000000, 5, 1, false, false, 'never', '21:30',
   'Chuyên viên kiểm toán Big4, cực kỳ sạch sẽ và coi trọng sự yên bình sau giờ làm.', true, 95),

  -- Nhóm 6: Gamer, thoải mái, có hút thuốc
  ('a0000000-0000-0000-0000-000000000006', 'seeking_roommate', 'Hồ Chí Minh', 'Thủ Đức', 'male', 'any', 'student',
   '09:30', '02:30', 2000000, 3200000, 2, 5, true, false, 'often', null,
   'Thích chơi game LMHT, vui tính, thoải mái trong sinh hoạt chung.', true, 65),

  -- Nhóm 7: Sinh viên Y khoa, trực đêm thất thường
  ('a0000000-0000-0000-0000-000000000007', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 5', 'female', 'same', 'student',
   '06:30', '23:00', 2500000, 3500000, 4, 2, false, false, 'rarely', null,
   'Sinh viên Y Dược, tính tình cẩn thận, hay phải đi thực tập bệnh viện.', true, 90),

  -- Nhóm 8: Freelancer ngân sách cao
  ('a0000000-0000-0000-0000-000000000008', 'has_room', 'Hồ Chí Minh', 'Quận 1', 'male', 'any', 'freelancer',
   '08:00', '00:30', 5000000, 7000000, 4, 3, false, false, 'sometimes', '23:00',
   'Đã thuê sẵn căn hộ 2PN tại Quận 1, tìm 1 bạn nam share phòng.', true, 89),

  -- Nhóm 9: Sinh viên Sư phạm, dậy sớm
  ('a0000000-0000-0000-0000-000000000009', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'female', 'same', 'student',
   '05:30', '22:00', 2000000, 3000000, 5, 2, false, false, 'never', '21:30',
   'Sinh viên ĐH Sư Phạm, nề nếp gia giáo, ngủ sớm dậy sớm tập thể dục.', true, 93),

  -- Nhóm 10: Thể thao, Gymmer
  ('a0000000-0000-0000-0000-000000000010', 'seeking_roommate', 'Hồ Chí Minh', 'Bình Thạnh', 'male', 'same', 'student',
   '06:00', '23:00', 3000000, 4500000, 4, 3, false, false, 'sometimes', '22:00',
   'Đam mê tập gym, ăn uống healthy, tính tình sòng phẳng rõ ràng.', true, 87),

  -- Nhóm 11: Mới toanh (Không có Trust Score để test badge "Mới")
  ('a0000000-0000-0000-0000-000000000011', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'female', 'same', 'student',
   '07:00', '23:00', 2500000, 4000000, 3, 3, false, false, 'sometimes', null,
   'Tân sinh viên vừa lên Sài Gòn nhập học, mong tìm bạn cùng chia sẻ tiền trọ.', true, null),

  -- Nhóm 12: Nghệ thuật, nhiếp ảnh
  ('a0000000-0000-0000-0000-000000000012', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 3', 'male', 'any', 'freelancer',
   '08:30', '01:00', 3500000, 5500000, 3, 3, false, true, 'often', null,
   'Nhiếp ảnh gia tự do, thích không gian có tính thẩm mỹ và cởi mở.', true, 78),

  -- Nhóm 13: Tiết kiệm tối đa
  ('a0000000-0000-0000-0000-000000000013', 'seeking_roommate', 'Hồ Chí Minh', 'Thủ Đức', 'female', 'same', 'student',
   '06:30', '22:30', 1500000, 2500000, 4, 2, false, false, 'never', '22:00',
   'Tìm bạn share phòng trọ gần làng đại học Thủ Đức, chi phí tiết kiệm.', true, 85),

  -- Nhóm 14: Sinh viên Kiến trúc
  ('a0000000-0000-0000-0000-000000000014', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 3', 'male', 'any', 'student',
   '08:00', '02:00', 3000000, 4500000, 2, 4, false, false, 'sometimes', null,
   'Đồ án làm mô hình hơi bừa bộn một chút nhưng cam kết dọn sạch sau khi nộp bài.', true, 72),

  -- Nhóm 15: Cần tuyệt đối yên tĩnh
  ('a0000000-0000-0000-0000-000000000015', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'female', 'same', 'worker',
   '07:00', '22:30', 3500000, 5000000, 5, 1, false, false, 'never', '21:30',
   'Làm kế toán, không chịu được ồn ào và người lạ tới phòng.', true, 91),

  -- Nhóm 16: Mới toanh nam
  ('a0000000-0000-0000-0000-000000000016', 'seeking_roommate', 'Hồ Chí Minh', 'Quận 10', 'male', 'any', 'student',
   '07:00', '23:30', 2500000, 3500000, 3, 3, false, false, 'sometimes', '22:30',
   'Sinh viên Bách Khoa K24 mới vào trường, cần tìm phòng khu vực gần trường.', true, null),

  -- 2 HỒ SƠ HÀ NỘI ĐỂ CHỨNG MINH HARD FILTER CITY HOẠT ĐỘNG
  ('a0000000-0000-0000-0000-000000000017', 'seeking_roommate', 'Hà Nội', 'Cầu Giấy', 'male', 'same', 'student',
   '07:00', '23:30', 2500000, 4000000, 4, 3, false, false, 'sometimes', '22:00',
   'Sinh viên ĐH Quốc Gia Hà Nội, tìm bạn ở ghép khu vực Cầu Giấy.', true, 88),

  ('a0000000-0000-0000-0000-000000000018', 'seeking_roommate', 'Hà Nội', 'Hai Bà Trưng', 'female', 'same', 'student',
   '06:30', '23:00', 3000000, 4500000, 5, 2, false, false, 'rarely', '22:00',
   'Sinh viên Bách Khoa Hà Nội, tìm bạn nữ ở ghép gần đường Giải Phóng.', true, 90)

on conflict (user_id) do update set
  intent = excluded.intent,
  city = excluded.city,
  district = excluded.district,
  gender = excluded.gender,
  gender_pref = excluded.gender_pref,
  occupation_type = excluded.occupation_type,
  wake_up_time = excluded.wake_up_time,
  sleep_time = excluded.sleep_time,
  budget_min = excluded.budget_min,
  budget_max = excluded.budget_max,
  tidiness_level = excluded.tidiness_level,
  noise_tolerance = excluded.noise_tolerance,
  smokes = excluded.smokes,
  has_pet = excluded.has_pet,
  guest_frequency = excluded.guest_frequency,
  guest_curfew = excluded.guest_curfew,
  bio = excluded.bio,
  is_seed_data = excluded.is_seed_data,
  seed_trust_score = excluded.seed_trust_score;
