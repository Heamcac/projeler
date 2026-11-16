import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteRequestDto {
  @IsString()
  @MaxLength(120)
  hbysReference!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  resultNote!: string;
}
