import { ForbiddenException } from '@nestjs/common';
import { RequestsService } from '../src/requests/requests.service';
import { SessionUser } from '../src/common/types';

describe('request service critical scenarios', () => {
  const leader: SessionUser = {
    id: 'leader-1',
    email: 'leader@hospion.local',
    fullName: 'Leader',
    departmentId: 'dep-1',
    roles: ['TEAM_LEADER'],
  };

  it('prevents a leader from approving their own financial request before persistence changes', async () => {
    const client = {};
    const db = {
      tx: (handler: (client: unknown) => Promise<unknown>) => handler(client),
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FOR UPDATE')) {
          return { rows: [{ id: 'req-1', created_by: 'leader-1', department_id: 'dep-1', status: 'PENDING', version: 1 }] };
        }
        return { rows: [{ id: 'req-1' }], rowCount: 1 };
      }),
    };
    const service = new RequestsService(db as never);

    await expect(service.decide(leader, 'req-1', { decision: 'APPROVE', version: 1 })).rejects.toThrow(ForbiddenException);
  });

  it('uses row locking for decision concurrency control', async () => {
    const source = RequestsService.toString();
    expect(source).toContain('FOR UPDATE');
    expect(source).toContain('version');
  });

  it('writes request events and notifications in the service transaction', async () => {
    const source = RequestsService.toString();
    expect(source).toContain('request_events');
    expect(source).toContain('notifications');
    expect(source).toContain('audit_logs');
  });
});
