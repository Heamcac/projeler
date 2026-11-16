export type RoleCode = 'STAFF' | 'TEAM_LEADER' | 'BILLING_OPERATOR' | 'ADMIN' | 'AUDITOR';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: RoleCode[];
}

export interface RequestItem {
  id: string;
  request_type?: string;
  request_type_name?: string;
  department_name?: string;
  protocol_no?: string | null;
  patient_no?: string | null;
  invoice_no?: string | null;
  reason_code?: string;
  description?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: string;
  version: number;
  created_at: string;
  created_by_name?: string;
}
