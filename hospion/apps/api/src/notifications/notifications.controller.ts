import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { SessionUser } from '../common/types';
import { DatabaseService } from '../database/database.service';
import { ok } from '../common/api-response';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list(@CurrentUser() user: SessionUser) {
    const result = await this.db.query(
      `SELECT id, request_id AS "requestId", title, body, is_read AS "isRead", created_at AS "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id],
    );
    return ok(result.rows);
  }

  @Patch(':id/read')
  async read(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    const result = await this.db.query(
      `UPDATE notifications SET is_read = true, read_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read AS "isRead"`,
      [id, user.id],
    );
    return ok(result.rows[0]);
  }
}
