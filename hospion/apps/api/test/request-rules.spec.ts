import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  assertCanReadRequest,
  assertDecisionReason,
  assertTransition,
  normalizeReference,
  validatePatientOrProtocol,
} from '../src/requests/request-rules';
import { SessionUser } from '../src/common/types';

const staff: SessionUser = {
  id: 'staff-1',
  email: 'staff@hospion.local',
  fullName: 'Staff',
  departmentId: 'dep-1',
  roles: ['STAFF'],
};

const leader: SessionUser = {
  id: 'leader-1',
  email: 'leader@hospion.local',
  fullName: 'Leader',
  departmentId: 'dep-1',
  roles: ['TEAM_LEADER'],
};

describe('patient/protocol validation', () => {
  it('accepts only protocol number', () => {
    expect(() => validatePatientOrProtocol('000123', undefined)).not.toThrow();
  });

  it('accepts only patient number', () => {
    expect(() => validatePatientOrProtocol(undefined, '000987')).not.toThrow();
  });

  it('accepts both numbers', () => {
    expect(() => validatePatientOrProtocol('000123', '000987')).not.toThrow();
  });

  it('rejects both empty', () => {
    expect(() => validatePatientOrProtocol('', '')).toThrow(BadRequestException);
  });

  it('rejects whitespace-only values', () => {
    expect(() => validatePatientOrProtocol('   ', '\t')).toThrow(BadRequestException);
  });

  it('preserves leading zeroes while trimming surrounding whitespace', () => {
    expect(normalizeReference('  000123  ')).toBe('000123');
  });
});

describe('authorization and workflow rules', () => {
  it('blocks unauthorized department data access', () => {
    expect(() => assertCanReadRequest(staff, { created_by: 'other', department_id: 'dep-2' })).toThrow(ForbiddenException);
  });

  it('allows a leader to read own department requests', () => {
    expect(() => assertCanReadRequest(leader, { created_by: 'other', department_id: 'dep-1' })).not.toThrow();
  });

  it('requires a reason for reject', () => {
    expect(() => assertDecisionReason('REJECT', ' ')).toThrow(BadRequestException);
  });

  it('requires a reason for information requests', () => {
    expect(() => assertDecisionReason('REQUEST_INFO', undefined)).toThrow(BadRequestException);
  });

  it('allows approved requests to move to implementation pending only through valid transitions', () => {
    expect(() => assertTransition('PENDING', 'IMPLEMENTATION_PENDING')).not.toThrow();
    expect(() => assertTransition('PENDING', 'COMPLETED')).toThrow(ConflictException);
  });

  it('prevents completing an unapproved request at the state-machine layer', () => {
    expect(() => assertTransition('INFO_REQUIRED', 'COMPLETED')).toThrow(ConflictException);
  });
});
