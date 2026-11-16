import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthGuard } from '../common/auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { DatabaseService } from '../database/database.service';
import { ok } from '../common/api-response';
import { CreateUserDto, DepartmentDto, DepartmentLeaderDto, UpdateUserDto } from './dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly db: DatabaseService) {}

  @Get('users')
  async users() {
    const result = await this.db.query(
      `SELECT u.id, u.full_name AS "fullName", u.email, u.department_id AS "departmentId", u.is_active AS "isActive",
              COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       GROUP BY u.id
       ORDER BY u.full_name`,
    );
    return ok(result.rows);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    const user = await this.db.tx(async (client) => {
      const result = await this.db.query(
        `INSERT INTO users (full_name, email, password_hash, department_id)
         VALUES ($1,$2,$3,$4) RETURNING id, full_name AS "fullName", email`,
        [dto.fullName.trim(), dto.email.trim().toLowerCase(), hash, dto.departmentId ?? null],
        client,
      );
      for (const role of dto.roles) {
        await this.db.query('INSERT INTO user_roles (user_id, role_code) VALUES ($1,$2) ON CONFLICT DO NOTHING', [result.rows[0].id, role], client);
      }
      return result.rows[0];
    });
    return ok(user);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const result = await this.db.tx(async (client) => {
      const user = await this.db.query(
        `UPDATE users
         SET full_name = COALESCE($2, full_name),
             department_id = COALESCE($3, department_id),
             is_active = COALESCE($4, is_active),
             updated_at = now()
         WHERE id = $1
         RETURNING id, full_name AS "fullName", email, is_active AS "isActive"`,
        [id, dto.fullName?.trim() ?? null, dto.departmentId ?? null, dto.isActive ?? null],
        client,
      );
      if (dto.roles) {
        await this.db.query('DELETE FROM user_roles WHERE user_id = $1', [id], client);
        for (const role of dto.roles) {
          await this.db.query('INSERT INTO user_roles (user_id, role_code) VALUES ($1,$2)', [id, role], client);
        }
      }
      return user.rows[0];
    });
    return ok(result);
  }

  @Get('departments')
  async departments() {
    const result = await this.db.query('SELECT id, name, is_active AS "isActive" FROM departments ORDER BY name');
    return ok(result.rows);
  }

  @Post('departments')
  async createDepartment(@Body() dto: DepartmentDto) {
    const result = await this.db.query(
      'INSERT INTO departments (name, is_active) VALUES ($1, COALESCE($2, true)) RETURNING id, name, is_active AS "isActive"',
      [dto.name.trim(), dto.isActive ?? null],
    );
    return ok(result.rows[0]);
  }

  @Patch('departments/:id')
  async updateDepartment(@Param('id') id: string, @Body() dto: DepartmentDto) {
    const result = await this.db.query(
      `UPDATE departments SET name = $2, is_active = COALESCE($3, is_active), updated_at = now()
       WHERE id = $1 RETURNING id, name, is_active AS "isActive"`,
      [id, dto.name.trim(), dto.isActive ?? null],
    );
    return ok(result.rows[0]);
  }

  @Post('department-leaders')
  async assignLeader(@Body() dto: DepartmentLeaderDto) {
    const result = await this.db.query(
      `INSERT INTO department_leaders (department_id, leader_user_id, is_primary)
       VALUES ($1,$2,COALESCE($3,true))
       ON CONFLICT (department_id, leader_user_id)
       DO UPDATE SET is_primary = EXCLUDED.is_primary, is_active = true
       RETURNING *`,
      [dto.departmentId, dto.leaderUserId, dto.isPrimary ?? null],
    );
    return ok(result.rows[0]);
  }
}
