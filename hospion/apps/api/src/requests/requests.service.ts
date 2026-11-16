import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { SessionUser } from '../common/types';
import { CreateRequestDto, DecisionDto, RequestListQueryDto, RequestLogQueryDto } from './dto';
import {
  assertCanReadRequest,
  assertDecisionReason,
  assertTransition,
  hasAnyRole,
  normalizeReference,
  RequestStatus,
  validatePatientOrProtocol,
} from './request-rules';

interface RequestRow {
  id: string;
  request_type: string;
  department_id: string;
  created_by: string;
  status: RequestStatus;
  assigned_to: string | null;
  version: number;
}

@Injectable()
export class RequestsService {
  constructor(private readonly db: DatabaseService) {}

  async create(user: SessionUser, dto: CreateRequestDto) {
    validatePatientOrProtocol(dto.protocolNo, dto.patientNo);
    return this.db.tx(async (client) => {
      const leader = await this.findPrimaryLeader(dto.departmentId, client);
      const result = await this.db.query(
        `INSERT INTO requests (
          request_type, department_id, created_by, protocol_no, patient_no, invoice_no,
          reason_code, description, priority, status, assigned_to
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING',$10)
        RETURNING *`,
        [
          dto.requestType,
          dto.departmentId,
          user.id,
          normalizeReference(dto.protocolNo),
          normalizeReference(dto.patientNo),
          normalizeReference(dto.invoiceNo),
          dto.reasonCode.trim(),
          dto.description.trim(),
          dto.priority,
          leader?.id ?? null,
        ],
        client,
      );
      const request = result.rows[0];
      await this.event(client, request.id, user, 'REQUEST_CREATED', 'Talep oluşturuldu.', { fromStatus: null, toStatus: 'PENDING', version: request.version, assignedTo: leader?.id ?? null });
      if (leader) {
        await this.notify(client, leader.id, request.id, 'Yeni talep', 'Onay kutunuzda yeni bir talep var.');
      } else {
        await this.event(client, request.id, null, 'ASSIGNMENT_PENDING', 'Aktif lider bulunamadı; talep yönetim kuyruğuna alındı.', {});
      }
      return request;
    });
  }

  async list(user: SessionUser, query: RequestListQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
    const params: unknown[] = [];
    const where: string[] = [];

    this.addReadScope(user, params, where);
    if (query.status) {
      params.push(query.status);
      where.push(`r.status = $${params.length}`);
    }
    if (query.search) {
      params.push(`%${query.search.trim()}%`);
      where.push(`(r.protocol_no ILIKE $${params.length} OR r.patient_no ILIKE $${params.length} OR r.invoice_no ILIKE $${params.length})`);
    }

    params.push(pageSize, (page - 1) * pageSize);
    const sql = `
      SELECT r.*, rt.name AS request_type_name, d.name AS department_name, u.full_name AS created_by_name
      FROM requests r
      JOIN request_types rt ON rt.code = r.request_type
      JOIN departments d ON d.id = r.department_id
      JOIN users u ON u.id = r.created_by
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY r.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await this.db.query(sql, params);
    return { items: result.rows, page, pageSize };
  }

  async get(user: SessionUser, id: string) {
    const request = await this.load(id);
    if (!(user.roles.includes('TEAM_LEADER') && await this.isDepartmentLeader(user.id, request.department_id))) {
      assertCanReadRequest(user, request);
    }
    return request;
  }

  async logs(user: SessionUser, query: RequestLogQueryDto) {
    if (query.requestId) await this.get(user, query.requestId);
    if (query.from && query.to && new Date(query.from) >= new Date(query.to)) {
      throw new BadRequestException('Başlangıç tarihi bitiş tarihinden önce olmalıdır.');
    }
    const params: unknown[] = [];
    const where: string[] = [];
    this.addReadScope(user, params, where);
    if (query.requestId) { params.push(query.requestId); where.push(`e.request_id = $${params.length}`); }
    if (query.eventType) { params.push(query.eventType); where.push(`e.event_type = $${params.length}`); }
    if (query.from) { params.push(query.from); where.push(`e.created_at >= $${params.length}::timestamptz`); }
    if (query.to) { params.push(query.to); where.push(`e.created_at < $${params.length}::timestamptz`); }
    if (query.search?.trim()) {
      params.push(`%${query.search.trim()}%`);
      where.push(`(r.protocol_no ILIKE $${params.length} OR r.patient_no ILIKE $${params.length}
        OR r.invoice_no ILIKE $${params.length} OR e.message ILIKE $${params.length}
        OR COALESCE(e.metadata->'actor'->>'name', u.full_name, 'Sistem') ILIKE $${params.length})`);
    }
    const joins = `FROM request_events e JOIN requests r ON r.id = e.request_id
      JOIN request_types rt ON rt.code = r.request_type JOIN departments d ON d.id = r.department_id
      LEFT JOIN users u ON u.id = e.actor_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
    const count = await this.db.query(`SELECT count(*)::int AS total ${joins}`, params);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await this.db.query(
      `SELECT e.*, COALESCE(e.metadata->'actor'->>'name', u.full_name, 'Sistem') AS actor_name,
        COALESCE(e.metadata->'actor'->'roles', (SELECT jsonb_agg(ur.role_code) FROM user_roles ur WHERE ur.user_id = e.actor_id), '[]'::jsonb) AS actor_roles,
        rt.name AS request_type_name, d.name AS department_name, r.protocol_no, r.patient_no, r.status AS request_status
       ${joins} ORDER BY e.created_at DESC, e.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: result.rows, total: count.rows[0].total, page, pageSize };
  }

  private addReadScope(user: SessionUser, params: unknown[], where: string[]) {
    if (hasAnyRole(user, ['ADMIN', 'AUDITOR', 'BILLING_OPERATOR'])) return;
    params.push(user.id);
    const owner = `r.created_by = $${params.length}`;
    if (user.roles.includes('TEAM_LEADER')) {
      params.push(user.departmentId);
      where.push(`(${owner} OR r.department_id = $${params.length} OR EXISTS
        (SELECT 1 FROM department_leaders dl WHERE dl.department_id = r.department_id
         AND dl.leader_user_id = $${params.length - 1} AND dl.is_active = true))`);
    } else { where.push(owner); }
  }

  async events(user: SessionUser, id: string) {
    await this.get(user, id);
    const result = await this.db.query(
      `SELECT e.*, u.full_name AS actor_name
       FROM request_events e
       LEFT JOIN users u ON u.id = e.actor_id
       WHERE e.request_id = $1
       ORDER BY e.created_at ASC`,
      [id],
    );
    return result.rows;
  }

  async cancel(user: SessionUser, id: string) {
    return this.db.tx(async (client) => {
      const request = await this.loadForUpdate(id, client);
      if (request.created_by !== user.id && !hasAnyRole(user, ['ADMIN'])) {
        throw new ForbiddenException('Bu talebi geri çekme yetkiniz yok.');
      }
      if (!['PENDING', 'INFO_REQUIRED'].includes(request.status)) {
        throw new BadRequestException('Yalnızca bekleyen veya ek bilgi isteyen talepler geri çekilebilir.');
      }
      assertTransition(request.status, 'CANCELLED');
      const updated = await this.updateStatus(client, id, 'CANCELLED', null);
      await this.event(client, id, user, 'REQUEST_CANCELLED', 'Talep geri çekildi.', { fromStatus: request.status, toStatus: 'CANCELLED', version: updated.version });
      return updated;
    });
  }

  async decide(user: SessionUser, id: string, dto: DecisionDto) {
    assertDecisionReason(dto.decision, dto.reason);
    if (!user.roles.includes('TEAM_LEADER')) {
      throw new ForbiddenException('Talep kararı için ekip lideri rolü gerekir.');
    }

    return this.db.tx(async (client) => {
      const request = await this.loadForUpdate(id, client);
      if (request.created_by === user.id) {
        throw new ForbiddenException('Lider kendi mali talebini onaylayamaz.');
      }
      const isLeader = await this.isDepartmentLeader(user.id, request.department_id, client);
      if (!isLeader) {
        throw new ForbiddenException('Bu birim için onay yetkiniz yok.');
      }
      if (dto.version && dto.version !== request.version) {
        throw new BadRequestException('Talep başka bir kullanıcı tarafından güncellenmiş.');
      }
      if (!['PENDING', 'IN_REVIEW'].includes(request.status)) {
        throw new BadRequestException('Bu talep karar verilebilir durumda değil.');
      }

      const nextStatus = dto.decision === 'APPROVE' ? 'IMPLEMENTATION_PENDING' : dto.decision === 'REJECT' ? 'REJECTED' : 'INFO_REQUIRED';
      assertTransition(request.status, nextStatus);
      await this.db.query(
        `INSERT INTO approval_decisions (request_id, decided_by, decision, reason)
         VALUES ($1,$2,$3,$4)`,
        [id, user.id, dto.decision, normalizeReference(dto.reason)],
        client,
      );
      const updated = await this.updateStatus(client, id, nextStatus, dto.decision === 'APPROVE' ? null : request.created_by);
      await this.event(client, id, user, `DECISION_${dto.decision}`, dto.reason?.trim() || 'Karar kaydedildi.', { fromStatus: request.status, toStatus: nextStatus, version: updated.version, reason: normalizeReference(dto.reason) });
      const title = dto.decision === 'APPROVE' ? 'Talep onaylandı' : dto.decision === 'REJECT' ? 'Talep reddedildi' : 'Ek bilgi istendi';
      await this.notify(client, request.created_by, id, title, dto.reason?.trim() || title);
      return updated;
    });
  }

  private async load(id: string): Promise<RequestRow> {
    const result = await this.db.query<RequestRow>('SELECT * FROM requests WHERE id = $1', [id]);
    const request = result.rows[0];
    if (!request) throw new NotFoundException('Talep bulunamadı.');
    return request;
  }

  private async loadForUpdate(id: string, client: PoolClient): Promise<RequestRow> {
    const result = await this.db.query<RequestRow>('SELECT * FROM requests WHERE id = $1 FOR UPDATE', [id], client);
    const request = result.rows[0];
    if (!request) throw new NotFoundException('Talep bulunamadı.');
    return request;
  }

  private async findPrimaryLeader(departmentId: string, client: PoolClient): Promise<{ id: string } | null> {
    const result = await this.db.query<{ id: string }>(
      `SELECT u.id
       FROM department_leaders dl
       JOIN users u ON u.id = dl.leader_user_id AND u.is_active = true
       WHERE dl.department_id = $1 AND dl.is_active = true
       ORDER BY dl.is_primary DESC, dl.created_at ASC
       LIMIT 1`,
      [departmentId],
      client,
    );
    return result.rows[0] ?? null;
  }

  private async isDepartmentLeader(userId: string, departmentId: string, client?: PoolClient) {
    const result = await this.db.query(
      `SELECT 1 FROM department_leaders
       WHERE leader_user_id = $1 AND department_id = $2 AND is_active = true`,
      [userId, departmentId],
      client,
    );
    return Boolean(result.rowCount);
  }

  private async updateStatus(client: PoolClient, id: string, status: RequestStatus, assignedTo: string | null) {
    const result = await this.db.query(
      `UPDATE requests
       SET status = $2::varchar(40), assigned_to = $3, version = version + 1,
           updated_at = now(), completed_at = CASE WHEN $2::varchar(40) = 'COMPLETED' THEN now() ELSE completed_at END
       WHERE id = $1
       RETURNING *`,
      [id, status, assignedTo],
      client,
    );
    return result.rows[0];
  }

  private async event(client: PoolClient, requestId: string, actor: SessionUser | null, eventType: string, message: string, details: object) {
    const actorId = actor?.id ?? null;
    const metadata = { ...details, actor: actor ? { name: actor.fullName, roles: actor.roles } : { name: 'Sistem', roles: [] } };
    await this.db.query(
      `INSERT INTO request_events (request_id, actor_id, event_type, message, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [requestId, actorId, eventType, message, JSON.stringify(metadata)],
      client,
    );
    await this.db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,'request',$3,$4)`,
      [actorId, eventType, requestId, JSON.stringify(metadata)],
      client,
    );
  }

  private async notify(client: PoolClient, userId: string, requestId: string, title: string, body: string) {
    await this.db.query(
      `INSERT INTO notifications (user_id, request_id, title, body) VALUES ($1,$2,$3,$4)`,
      [userId, requestId, title, body],
      client,
    );
  }
}
