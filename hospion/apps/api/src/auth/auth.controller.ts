import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { AuthGuard } from '../common/auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ok } from '../common/api-response';
import { SessionUser } from '../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.login(dto.email, dto.password);
    req.session.user = user;
    return ok(user);
  }

  @Post('logout')
  logout(@Req() req: Request) {
    req.session.destroy(() => undefined);
    return ok({ loggedOut: true });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return ok(user);
  }

  @Get('csrf')
  csrf(@Req() req: Request & { csrfToken?: () => string }) {
    return ok({ csrfToken: req.csrfToken?.() });
  }
}
