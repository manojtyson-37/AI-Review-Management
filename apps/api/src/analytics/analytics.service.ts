import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getReviewFunnel(locationId: string) {
    const sessions = await this.prisma.reviewSession.groupBy({
      by: ['status'],
      where: { locationId },
      _count: {
        status: true,
      },
    });

    // Transform into a simple funnel object
    const funnel = {
      STARTED: 0,
      QUESTIONS_ANSWERED: 0,
      DRAFT_GENERATED: 0,
      COPIED: 0,
      REDIRECTED: 0,
      POSTED: 0,
    };

    sessions.forEach(session => {
      funnel[session.status] = session._count.status;
    });

    return funnel;
  }
}
