import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { SessionUser } from '../common/types';
import { DatabaseService } from '../database/database.service';
import { ok } from '../common/api-response';

@Controller('approvals')
@UseGuards(AuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('inbox')
  @Roles('TEAM_LEADER')
  async inbox(@CurrentUser() user: SessionUser) {
    const result = await this.db.query(
      `SELECT r.*, rt.name AS request_type_name, d.name AS department_name, u.full_name AS created_by_name
       FROM requests r
       JOIN request_types rt ON rt.code = r.request_type
       JOIN departments d ON d.id = r.department_id
       JOIN users u ON u.id = r.created_by
       JOIN department_leaders dl ON dl.department_id = r.department_id AND dl.leader_user_id = $1 AND dl.is_active = true
       WHERE r.status IN ('PENDING','IN_REVIEW')
       ORDER BY CASE r.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, r.created_at ASC`,
      [user.id],
    );
    return ok(result.rows);
  }
}
