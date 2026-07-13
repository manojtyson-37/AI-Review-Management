import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

import { AiModule } from '../ai/ai.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [AiModule, LocationsModule],
  providers: [SessionsService],
  controllers: [SessionsController]
})
export class SessionsModule {}
