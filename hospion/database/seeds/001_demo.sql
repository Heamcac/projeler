INSERT INTO roles (code, name) VALUES
  ('STAFF', 'Hasta Kayıt Personeli'),
  ('TEAM_LEADER', 'Ekip Lideri'),
  ('BILLING_OPERATOR', 'Fatura Yetkilisi'),
  ('ADMIN', 'Sistem Yöneticisi'),
  ('AUDITOR', 'Denetçi')
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (name) VALUES
  ('Acil Servis Hasta Kayıt'),
  ('Poliklinik Hasta Kayıt'),
  ('Yatış Hasta Kayıt'),
  ('Taburcu İşlemleri'),
  ('Kurum / Provizyon İşlemleri'),
  ('Faturalandırma')
ON CONFLICT (name) DO NOTHING;

INSERT INTO request_types (code, name, requires_billing_implementation, requires_financial_approval) VALUES
  ('PATIENT_INVOICE_CANCEL', 'Hasta faturası iptal talebi', true, true),
  ('INSTITUTION_INVOICE_CANCEL', 'Kurum faturası iptal talebi', true, true),
  ('INSTITUTION_APPROVAL', 'Kurum onayı talebi', true, true)
ON CONFLICT (code) DO NOTHING;

-- Demo password for every account: Demo1234!
WITH d AS (
  SELECT id, name FROM departments
), inserted AS (
  INSERT INTO users (full_name, email, password_hash, department_id)
  VALUES
    ('Ayşe Demir', 'staff@hospion.local', '$argon2id$v=19$m=65536,t=3,p=4$tzj1D1cvKYCVpDhjERN8Fg$dmIHqYlAue8kY6v8l0eLB/FBpxIXNX/N9ilcfLwT9OI', (SELECT id FROM d WHERE name = 'Acil Servis Hasta Kayıt')),
    ('Mehmet Kaya', 'leader@hospion.local', '$argon2id$v=19$m=65536,t=3,p=4$tzj1D1cvKYCVpDhjERN8Fg$dmIHqYlAue8kY6v8l0eLB/FBpxIXNX/N9ilcfLwT9OI', (SELECT id FROM d WHERE name = 'Acil Servis Hasta Kayıt')),
    ('Zeynep Arslan', 'billing@hospion.local', '$argon2id$v=19$m=65536,t=3,p=4$tzj1D1cvKYCVpDhjERN8Fg$dmIHqYlAue8kY6v8l0eLB/FBpxIXNX/N9ilcfLwT9OI', (SELECT id FROM d WHERE name = 'Faturalandırma')),
    ('Can Özkan', 'admin@hospion.local', '$argon2id$v=19$m=65536,t=3,p=4$tzj1D1cvKYCVpDhjERN8Fg$dmIHqYlAue8kY6v8l0eLB/FBpxIXNX/N9ilcfLwT9OI', (SELECT id FROM d WHERE name = 'Faturalandırma')),
    ('Elif Şahin', 'auditor@hospion.local', '$argon2id$v=19$m=65536,t=3,p=4$tzj1D1cvKYCVpDhjERN8Fg$dmIHqYlAue8kY6v8l0eLB/FBpxIXNX/N9ilcfLwT9OI', (SELECT id FROM d WHERE name = 'Kurum / Provizyon İşlemleri'))
  ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id, email
)
INSERT INTO user_roles (user_id, role_code)
SELECT id, CASE email
  WHEN 'staff@hospion.local' THEN 'STAFF'
  WHEN 'leader@hospion.local' THEN 'TEAM_LEADER'
  WHEN 'billing@hospion.local' THEN 'BILLING_OPERATOR'
  WHEN 'admin@hospion.local' THEN 'ADMIN'
  ELSE 'AUDITOR'
END
FROM inserted
WHERE email IN ('staff@hospion.local','leader@hospion.local','billing@hospion.local','admin@hospion.local','auditor@hospion.local')
ON CONFLICT DO NOTHING;

INSERT INTO department_leaders (department_id, leader_user_id, is_primary)
SELECT d.id, u.id, true
FROM departments d
CROSS JOIN users u
WHERE d.name IN ('Acil Servis Hasta Kayıt','Poliklinik Hasta Kayıt','Yatış Hasta Kayıt','Taburcu İşlemleri','Kurum / Provizyon İşlemleri')
  AND u.email = 'leader@hospion.local'
ON CONFLICT (department_id, leader_user_id) DO NOTHING;
