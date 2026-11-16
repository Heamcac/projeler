export type RoleCode = 'STAFF' | 'TEAM_LEADER' | 'BILLING_OPERATOR' | 'ADMIN' | 'AUDITOR';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  departmentId: string | null;
  roles: RoleCode[];
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
