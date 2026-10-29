import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GoogleIntegrationController } from './google.controller';
import { GoogleIntegrationService } from './google.service';
import { GoogleApiClient } from './google-api.client';
import { BusinessAccessService } from './business-access.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [GoogleIntegrationController],
  providers: [GoogleIntegrationService, GoogleApiClient, BusinessAccessService],
  exports: [GoogleIntegrationService, GoogleApiClient, BusinessAccessService],
})
export class IntegrationsModule {}
