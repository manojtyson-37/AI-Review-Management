import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { QrcodesService } from './qrcodes.service';
import { QRCode as QRCodeModel } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('qrcodes')
@UseGuards(AuthGuard('jwt'))
export class QrcodesController {
  constructor(private readonly qrcodesService: QrcodesService) {}

  @Post('location/:locationId')
  async generateQRCode(
    @Param('locationId') locationId: string,
  ): Promise<QRCodeModel> {
    return this.qrcodesService.generateQRCodeForLocation(locationId);
  }

  @Get('location/:locationId')
  async getQRCodes(
    @Param('locationId') locationId: string,
  ): Promise<QRCodeModel[]> {
    return this.qrcodesService.getQRCodesByLocation(locationId);
  }
}
