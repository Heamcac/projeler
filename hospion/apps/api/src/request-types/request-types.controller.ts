import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { ok } from '../common/api-response';
import { DatabaseService } from '../database/database.service';

@Controller('request-types')
@UseGuards(AuthGuard)
export class RequestTypesController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list() {
    const result = await this.db.query(
      `SELECT code, name,
              requires_billing_implementation AS "requiresBillingImplementation",
              requires_financial_approval AS "requiresFinancialApproval"
       FROM request_types
       WHERE is_active = true
       ORDER BY name`,
    );
    return ok(result.rows);
  }
}
