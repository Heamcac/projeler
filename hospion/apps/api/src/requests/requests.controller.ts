import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ok } from '../common/api-response';
import { SessionUser } from '../common/types';
import { CreateRequestDto, DecisionDto, RequestListQueryDto, RequestLogQueryDto } from './dto';
import { RequestsService } from './requests.service';

@Controller()
@UseGuards(AuthGuard)
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get('request-logs')
  async logs(@CurrentUser() user: SessionUser, @Query() query: RequestLogQueryDto) {
    return ok(await this.requests.logs(user, query));
  }

  @Post('requests')
  async create(@CurrentUser() user: SessionUser, @Body() dto: CreateRequestDto) {
    return ok(await this.requests.create(user, dto));
  }

  @Get('requests')
  async list(@CurrentUser() user: SessionUser, @Query() query: RequestListQueryDto) {
    return ok(await this.requests.list(user, query));
  }

  @Get('requests/:id')
  async get(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return ok(await this.requests.get(user, id));
  }

  @Get('requests/:id/events')
  async events(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return ok(await this.requests.events(user, id));
  }

  @Post('requests/:id/cancel')
  async cancel(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return ok(await this.requests.cancel(user, id));
  }

  @Post('requests/:id/decision')
  async decide(@CurrentUser() user: SessionUser, @Param('id') id: string, @Body() dto: DecisionDto) {
    return ok(await this.requests.decide(user, id, dto));
  }
}
