import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QRCode, Prisma } from '@prisma/client';

@Injectable()
export class QrcodesService {
  constructor(private prisma: PrismaService) {}

  async generateQRCodeForLocation(locationId: string): Promise<QRCode> {
    // Determine the base URL for the landing page
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const codeUrl = `${baseUrl}/r/${locationId}`;

    return this.prisma.qRCode.create({
      data: {
        locationId,
        codeUrl,
      },
    });
  }

  async getQRCodesByLocation(locationId: string): Promise<QRCode[]> {
    return this.prisma.qRCode.findMany({
      where: { locationId },
    });
  }
}
