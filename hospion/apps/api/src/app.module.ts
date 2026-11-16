import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './departments/departments.module';
import { RequestTypesModule } from './request-types/request-types.module';
import { RequestsModule } from './requests/requests.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ImplementationsModule } from './implementations/implementations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    DepartmentsModule,
    RequestTypesModule,
    RequestsModule,
    ApprovalsModule,
    ImplementationsModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule {}
