import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from '../src/database/database.service';
import { RequestsService } from '../src/requests/requests.service';
import { RequestLogQueryDto } from '../src/requests/dto';
import { ImplementationsController } from '../src/implementations/implementations.controller';
import { RoleCode, SessionUser } from '../src/common/types';

config({ path: resolve(__dirname, '../../../.env') });
const describeDatabase = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeDatabase('persistent request audit trail', () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new DatabaseService(pool);
  const service = new RequestsService(db);
  const implementations = new ImplementationsController(db);
  const departmentId = randomUUID();
  const users: SessionUser[] = [];
  const requestIds: string[] = [];
  let staff: SessionUser;
  let outsider: SessionUser;
  let leader: SessionUser;
  let billing: SessionUser;
  let auditor: SessionUser;
  let admin: SessionUser;

  async function addUser(role: RoleCode): Promise<SessionUser> {
    const id = randomUUID();
    const user: SessionUser = { id, email: `${id}@log-test.invalid`, fullName: `Log test ${role}`, departmentId: role === 'TEAM_LEADER' ? null : departmentId, roles: [role] };
    users.push(user);
    await db.query('INSERT INTO users (id, email, full_name, password_hash, department_id) VALUES ($1,$2,$3,$4,$5)', [id, user.email, user.fullName, 'test-account-disabled', user.departmentId]);
    await db.query('INSERT INTO user_roles (user_id, role_code) VALUES ($1,$2)', [id, role]);
    return user;
  }
  async function create(owner = staff) {
    const request = await service.create(owner, { requestType: 'PATIENT_INVOICE_CANCEL', departmentId, protocolNo: '000LOGTEST', patientNo: '', reasonCode: 'LOG_TEST', description: 'Synthetic audit integration fixture.', priority: 'NORMAL' });
    requestIds.push(request.id);
    return request;
  }
  function query(values: Partial<RequestLogQueryDto> = {}) { return Object.assign(new RequestLogQueryDto(), values); }

  beforeAll(async () => {
    await db.query('INSERT INTO departments (id, name) VALUES ($1,$2)', [departmentId, `Log test ${departmentId}`]);
    staff = await addUser('STAFF');
    outsider = await addUser('STAFF');
    leader = await addUser('TEAM_LEADER');
    billing = await addUser('BILLING_OPERATOR');
    auditor = await addUser('AUDITOR');
    admin = await addUser('ADMIN');
    await db.query('INSERT INTO department_leaders (department_id, leader_user_id) VALUES ($1,$2)', [departmentId, leader.id]);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    const userIds = users.map((user) => user.id);
    await db.tx(async (client) => {
      await db.query('DELETE FROM audit_logs WHERE actor_id = ANY($1::uuid[]) OR entity_id = ANY($2::uuid[])', [userIds, requestIds], client);
      await db.query('DELETE FROM requests WHERE created_by = ANY($1::uuid[])', [userIds], client);
      await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [userIds], client);
      await db.query('DELETE FROM departments WHERE id = $1', [departmentId], client);
    });
    await pool.end();
  });

  it('persists creation, rejection reason and actor snapshot in both logs', async () => {
    const request = await create();
    await service.decide(leader, request.id, { decision: 'REJECT', reason: 'Duplicate invoice.', version: 1 });
    await db.query('UPDATE users SET full_name = $2 WHERE id = $1', [leader.id, 'Changed name']);
    const logs = await service.logs(staff, query({ requestId: request.id }));
    expect(logs.total).toBe(2);
    expect(logs.items[0]).toMatchObject({ event_type: 'DECISION_REJECT', actor_name: leader.fullName, actor_roles: ['TEAM_LEADER'], message: 'Duplicate invoice.', metadata: { fromStatus: 'PENDING', toStatus: 'REJECTED', version: 2, reason: 'Duplicate invoice.' } });
    const audit = await db.query('SELECT metadata FROM audit_logs WHERE entity_id = $1 AND action = $2', [request.id, 'DECISION_REJECT']);
    expect(audit.rows[0].metadata).toEqual(logs.items[0].metadata);
  });

  it('limits staff to their own logs and lets all authorized roles read them', async () => {
    const request = await create();
    await expect(service.logs(outsider, query({ requestId: request.id }))).rejects.toThrow(ForbiddenException);
    expect((await service.logs(outsider, query())).total).toBe(0);
    for (const user of [staff, leader, billing, auditor, admin]) {
      expect((await service.logs(user, query({ requestId: request.id }))).total).toBe(1);
    }
  });

  it('records information request, withdrawal, approval, completion and verification', async () => {
    const info = await create();
    await service.decide(leader, info.id, { decision: 'REQUEST_INFO', reason: 'Invoice missing.', version: 1 });
    await service.cancel(staff, info.id);
    const cancelled = await service.logs(staff, query({ requestId: info.id }));
    expect(cancelled.items.map((event) => event.event_type)).toEqual(['REQUEST_CANCELLED', 'DECISION_REQUEST_INFO', 'REQUEST_CREATED']);
    expect(cancelled.items[0].metadata).toMatchObject({ fromStatus: 'INFO_REQUIRED', toStatus: 'CANCELLED' });
    const request = await create();
    await service.decide(leader, request.id, { decision: 'APPROVE', version: 1 });
    await implementations.complete(billing, request.id, { hbysReference: 'SYNTHETIC-HBYS', resultNote: 'No real HBYS operation.' });
    await implementations.verify(admin, request.id);
    const completed = await service.logs(staff, query({ requestId: request.id }));
    expect(completed.items.map((event) => event.event_type)).toEqual(['IMPLEMENTATION_VERIFIED', 'REQUEST_COMPLETED', 'DECISION_APPROVE', 'REQUEST_CREATED']);
    expect(completed.items[1].metadata).toMatchObject({ fromStatus: 'IMPLEMENTATION_PENDING', toStatus: 'COMPLETED', hbysReference: 'SYNTHETIC-HBYS', resultNote: 'No real HBYS operation.' });
  });

  it('filters by action, actor and dates and paginates without leaking scope', async () => {
    const logs = await service.logs(staff, query({ eventType: 'DECISION_REJECT', search: leader.fullName, pageSize: 1, from: '2000-01-01T00:00:00Z', to: '2100-01-01T00:00:00Z' }));
    expect(logs.total).toBe(1);
    expect(logs.items).toHaveLength(1);
    expect((await service.logs(staff, query({ eventType: 'DECISION_REJECT', page: 2, pageSize: 1 }))).items).toHaveLength(0);
    expect((await service.logs(outsider, query({ search: '000LOGTEST' }))).items).toHaveLength(0);
  });

  it('rolls back the decision and event when audit persistence fails', async () => {
    const request = await create();
    const original = db.query.bind(db);
    const spy = jest.spyOn(db, 'query').mockImplementation((sql, params, client) => {
      if (sql.includes('INSERT INTO audit_logs')) return Promise.reject(new Error('Audit unavailable'));
      return original(sql, params, client);
    });
    await expect(service.decide(leader, request.id, { decision: 'APPROVE', version: 1 })).rejects.toThrow('Audit unavailable');
    spy.mockRestore();
    expect((await service.get(staff, request.id)).status).toBe('PENDING');
    expect((await service.logs(staff, query({ requestId: request.id }))).total).toBe(1);
    expect((await db.query('SELECT * FROM approval_decisions WHERE request_id = $1', [request.id])).rowCount).toBe(0);
  });
});
