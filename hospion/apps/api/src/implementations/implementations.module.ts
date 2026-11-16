import { Module } from '@nestjs/common';
import { ImplementationsController } from './implementations.controller';

@Module({ controllers: [ImplementationsController] })
export class ImplementationsModule {}
