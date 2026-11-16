import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { ok } from '../common/api-response';
import { DatabaseService } from '../database/database.service';

@Controller('departments')
@UseGuards(AuthGuard)
export class DepartmentsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list() {
    const result = await this.db.query(
      'SELECT id, name, is_active AS "isActive" FROM departments WHERE is_active = true ORDER BY name',
    );
    return ok(result.rows);
  }
}
