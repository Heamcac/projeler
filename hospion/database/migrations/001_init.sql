CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(40) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_code VARCHAR(40) NOT NULL REFERENCES roles(code),
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE IF NOT EXISTS department_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  leader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (department_id, leader_user_id)
);

CREATE TABLE IF NOT EXISTS request_types (
  code VARCHAR(80) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  requires_billing_implementation BOOLEAN NOT NULL DEFAULT true,
  requires_financial_approval BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(80) NOT NULL REFERENCES request_types(code),
  department_id UUID NOT NULL REFERENCES departments(id),
  created_by UUID NOT NULL REFERENCES users(id),
  protocol_no VARCHAR(80) NULL,
  patient_no VARCHAR(80) NULL,
  invoice_no VARCHAR(100) NULL,
  reason_code VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_REVIEW','INFO_REQUIRED','APPROVED','REJECTED','IMPLEMENTATION_PENDING','COMPLETED','CANCELLED')),
  assigned_to UUID NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  CHECK (
    NULLIF(BTRIM(protocol_no), '') IS NOT NULL
    OR
    NULLIF(BTRIM(patient_no), '') IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role_code VARCHAR(40) NOT NULL REFERENCES roles(code),
  assigned_to UUID NULL REFERENCES users(id),
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','INFO_REQUIRED','SKIPPED')),
  decided_at TIMESTAMPTZ NULL,
  UNIQUE (request_id, step_order)
);

CREATE TABLE IF NOT EXISTS approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  approval_step_id UUID NULL REFERENCES approval_steps(id) ON DELETE SET NULL,
  decided_by UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(40) NOT NULL CHECK (decision IN ('APPROVE','REJECT','REQUEST_INFO')),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  actor_id UUID NULL REFERENCES users(id),
  event_type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID NULL REFERENCES requests(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES users(id),
  hbys_reference VARCHAR(120) NOT NULL,
  result_note TEXT NOT NULL,
  verified_by UUID NULL REFERENCES users(id),
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NULL REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NULL,
  ip_address INET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_department_status ON requests(department_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_status ON requests(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_protocol ON requests(protocol_no);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON requests(patient_no);
CREATE INDEX IF NOT EXISTS idx_events_request_created ON request_events(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
