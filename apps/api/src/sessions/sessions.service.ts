import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewSession, Prisma } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(locationId: string, guestIp?: string): Promise<ReviewSession> {
    return this.prisma.reviewSession.create({
      data: {
        locationId,
        guestIp,
        status: 'STARTED',
      },
    });
  }

  async updateSession(
    id: string,
    data: Prisma.ReviewSessionUpdateInput
  ): Promise<ReviewSession> {
    return this.prisma.reviewSession.update({
      where: { id },
      data,
    });
  }

  async saveDrafts(sessionId: string, drafts: { professional: string; friendly: string; short: string }) {
    const draftData = Object.entries(drafts).map(([style, content]) => ({
      sessionId,
      style,
      content,
    }));
    
    await this.prisma.reviewDraft.createMany({
      data: draftData,
    });
  }
}
