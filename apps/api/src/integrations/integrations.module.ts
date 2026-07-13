import { Module } from '@nestjs/common';
import { GoogleIntegrationController } from './google.controller';
import { GoogleIntegrationService } from './google.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GoogleIntegrationController],
  providers: [GoogleIntegrationService],
  exports: [GoogleIntegrationService],
})
export class IntegrationsModule {}
