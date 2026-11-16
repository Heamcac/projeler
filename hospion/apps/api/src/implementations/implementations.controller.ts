import { BadRequestException, Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PoolClient } from 'pg';
import { AuthGuard } from '../common/auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ok } from '../common/api-response';
import { SessionUser } from '../common/types';
import { DatabaseService } from '../database/database.service';
import { CompleteRequestDto } from './dto';

@Controller('requests/:id')
@UseGuards(AuthGuard, RolesGuard)
export class ImplementationsController {
  constructor(private readonly db: DatabaseService) {}

  @Post('complete')
  @Roles('BILLING_OPERATOR')
  async complete(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: CompleteRequestDto) {
    return ok(
      await this.db.tx(async (client) => {
        const request = await this.loadForUpdate(client, id);
        if (request.status !== 'IMPLEMENTATION_PENDING') {
          throw new BadRequestException('Onaylanmamış veya uygulama beklemeyen talep tamamlanamaz.');
        }
        await this.db.query(
          `INSERT INTO implementations (request_id, completed_by, hbys_reference, result_note)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (request_id) DO UPDATE
           SET completed_by = EXCLUDED.completed_by, hbys_reference = EXCLUDED.hbys_reference, result_note = EXCLUDED.result_note`,
          [id, user.id, dto.hbysReference.trim(), dto.resultNote.trim()],
          client,
        );
        const updated = await this.db.query(
          `UPDATE requests SET status = 'COMPLETED', version = version + 1, completed_at = now(), updated_at = now()
           WHERE id = $1 RETURNING *`,
          [id],
          client,
        );
        await this.audit(client, id, user, 'REQUEST_COMPLETED', 'HBYS üzerinde manuel işlem tamamlandı.', {
          fromStatus: request.status, toStatus: 'COMPLETED', version: updated.rows[0].version,
          hbysReference: dto.hbysReference.trim(), resultNote: dto.resultNote.trim(),
        });
        await this.db.query(
          `INSERT INTO notifications (user_id, request_id, title, body)
           VALUES ($1,$2,'Talep tamamlandı','Manuel HBYS işlemi tamamlandı.')`,
          [request.created_by, id],
          client,
        );
        return updated.rows[0];
      }),
    );
  }

  @Post('verify')
  @Roles('BILLING_OPERATOR', 'ADMIN')
  async verify(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return ok(
      await this.db.tx(async (client) => {
        const result = await this.db.query(
          `UPDATE implementations SET verified_by = $2, verified_at = now()
           WHERE request_id = $1 RETURNING *`,
          [id, user.id],
          client,
        );
        if (!result.rowCount) throw new BadRequestException('Tamamlanma kaydı bulunamadı.');
        await this.audit(client, id, user, 'IMPLEMENTATION_VERIFIED', 'Tamamlanma kaydı doğrulandı.', { hbysReference: result.rows[0].hbys_reference });
        return result.rows[0];
      }),
    );
  }

  private async loadForUpdate(client: PoolClient, id: string) {
    const result = await this.db.query('SELECT * FROM requests WHERE id = $1 FOR UPDATE', [id], client);
    if (!result.rowCount) throw new BadRequestException('Talep bulunamadı.');
    return result.rows[0] as { status: string; created_by: string };
  }

  private async audit(client: PoolClient, requestId: string, actor: SessionUser, action: string, message: string, details: object) {
    const metadata = JSON.stringify({ ...details, actor: { name: actor.fullName, roles: actor.roles } });
    await this.db.query(
      `INSERT INTO request_events (request_id, actor_id, event_type, message, metadata) VALUES ($1,$2,$3,$4,$5)`,
      [requestId, actor.id, action, message, metadata],
      client,
    );
    await this.db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'request',$3,$4)`,
      [actor.id, action, requestId, metadata],
      client,
    );
  }
}
