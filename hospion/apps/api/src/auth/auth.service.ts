import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service';
import { SessionUser } from '../common/types';

interface DbUser {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  department_id: string | null;
  is_active: boolean;
  locked_until: Date | null;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async login(email: string, password: string): Promise<SessionUser> {
    const normalized = email.trim().toLowerCase();
    const result = await this.db.query<DbUser>(
      `SELECT u.*, COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [normalized],
    );
    const user = result.rows[0];
    if (!user || !user.is_active || (user.locked_until && user.locked_until > new Date())) {
      throw new UnauthorizedException('E-posta veya parola hatalı.');
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      await this.db.query(
        `UPDATE users
         SET failed_login_count = failed_login_count + 1,
             locked_until = CASE WHEN failed_login_count >= 4 THEN now() + interval '5 minutes' ELSE locked_until END
         WHERE id = $1`,
        [user.id],
      );
      throw new UnauthorizedException('E-posta veya parola hatalı.');
    }

    await this.db.query('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1', [user.id]);
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      departmentId: user.department_id,
      roles: user.roles as SessionUser['roles'],
    };
  }
}
