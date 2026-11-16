import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MaxLength(80)
  requestType!: string;

  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  protocolNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  patientNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNo?: string;

  @IsString()
  @MaxLength(80)
  reasonCode!: string;

  @IsString()
  @MinLength(8)
  description!: string;

  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority!: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export class RequestListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}

export class DecisionDto {
  @IsIn(['APPROVE', 'REJECT', 'REQUEST_INFO'])
  decision!: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  version?: number;
}

export class RequestLogQueryDto {
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsIn(['REQUEST_CREATED', 'ASSIGNMENT_PENDING', 'DECISION_APPROVE', 'DECISION_REJECT', 'DECISION_REQUEST_INFO', 'REQUEST_CANCELLED', 'REQUEST_COMPLETED', 'IMPLEMENTATION_VERIFIED'])
  eventType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
