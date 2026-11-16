export const eventLabels: Record<string, string> = {
  REQUEST_CREATED: 'Talep oluşturuldu',
  ASSIGNMENT_PENDING: 'Atama bekliyor',
  DECISION_APPROVE: 'Onaylandı',
  DECISION_REJECT: 'Reddedildi',
  DECISION_REQUEST_INFO: 'Ek bilgi istendi',
  REQUEST_CANCELLED: 'Geri çekildi',
  REQUEST_COMPLETED: 'İşlem tamamlandı',
  IMPLEMENTATION_VERIFIED: 'Tamamlanma doğrulandı',
};

export const roleLabels: Record<string, string> = {
  STAFF: 'Personel', TEAM_LEADER: 'Ekip lideri', BILLING_OPERATOR: 'Fatura yetkilisi', ADMIN: 'Yönetici', AUDITOR: 'Denetçi',
};

export interface RequestLogItem {
  id: string;
  request_id: string;
  event_type: string;
  message: string;
  actor_name: string;
  actor_roles: string[];
  created_at: string;
  request_type_name: string;
  department_name: string;
  protocol_no: string | null;
  patient_no: string | null;
  metadata: {
    fromStatus?: string | null; toStatus?: string; version?: number;
    reason?: string | null; hbysReference?: string; resultNote?: string;
  };
}

export interface RequestLogResult {
  items: RequestLogItem[]; total: number; page: number; pageSize: number;
}
