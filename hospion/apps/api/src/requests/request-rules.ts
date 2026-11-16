import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleCode, SessionUser } from '../common/types';

export type RequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTATION_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export type Decision = 'APPROVE' | 'REJECT' | 'REQUEST_INFO';

const transitions: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['IN_REVIEW', 'INFO_REQUIRED', 'REJECTED', 'IMPLEMENTATION_PENDING', 'CANCELLED'],
  IN_REVIEW: ['INFO_REQUIRED', 'REJECTED', 'IMPLEMENTATION_PENDING'],
  INFO_REQUIRED: ['PENDING', 'CANCELLED'],
  APPROVED: ['IMPLEMENTATION_PENDING'],
  REJECTED: [],
  IMPLEMENTATION_PENDING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function normalizeReference(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function validatePatientOrProtocol(protocolNo?: string | null, patientNo?: string | null) {
  if (!normalizeReference(protocolNo) && !normalizeReference(patientNo)) {
    throw new BadRequestException('Protokol numarası veya hasta numarasından en az biri girilmelidir.');
  }
}

export function assertTransition(from: RequestStatus, to: RequestStatus) {
  if (!transitions[from]?.includes(to)) {
    throw new ConflictException(`${from} durumundan ${to} durumuna geçilemez.`);
  }
}

export function assertDecisionReason(decision: Decision, reason?: string | null) {
  if ((decision === 'REJECT' || decision === 'REQUEST_INFO') && !normalizeReference(reason)) {
    throw new BadRequestException('Ret veya ek bilgi kararında gerekçe zorunludur.');
  }
}

export function canReadRequest(user: SessionUser, request: { created_by: string; department_id: string }): boolean {
  if (hasAnyRole(user, ['ADMIN', 'AUDITOR', 'BILLING_OPERATOR'])) return true;
  if (request.created_by === user.id) return true;
  if (user.roles.includes('TEAM_LEADER') && user.departmentId && request.department_id === user.departmentId) return true;
  return false;
}

export function assertCanReadRequest(user: SessionUser, request: { created_by: string; department_id: string }) {
  if (!canReadRequest(user, request)) {
    throw new ForbiddenException('Bu talebe erişim yetkiniz yok.');
  }
}

export function hasAnyRole(user: SessionUser, roles: RoleCode[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}
