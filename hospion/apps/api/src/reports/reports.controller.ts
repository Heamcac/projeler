import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { DatabaseService } from '../database/database.service';
import { ok } from '../common/api-response';

@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('summary')
  @Roles('ADMIN', 'AUDITOR', 'TEAM_LEADER')
  async summary() {
    const byStatus = await this.db.query('SELECT status, count(*)::int AS count FROM requests GROUP BY status ORDER BY status');
    const byDepartment = await this.db.query(
      `SELECT d.name, count(r.id)::int AS count
       FROM departments d
       LEFT JOIN requests r ON r.department_id = d.id
       GROUP BY d.name
       ORDER BY d.name`,
    );
    return ok({ byStatus: byStatus.rows, byDepartment: byDepartment.rows });
  }
}
