import { Module } from '@nestjs/common';
import { QrcodesService } from './qrcodes.service';
import { QrcodesController } from './qrcodes.controller';

@Module({
  providers: [QrcodesService],
  controllers: [QrcodesController]
})
export class QrcodesModule {}
