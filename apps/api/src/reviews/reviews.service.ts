import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GoogleReview, Location } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GoogleIntegrationService } from '../integrations/google.service';
import { GoogleApiClient, GoogleReviewDto } from '../integrations/google-api.client';
import { BusinessAccessService, MANAGE_ROLES } from '../integrations/business-access.service';

const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const MAX_REPLY_LENGTH = 4000;

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private google: GoogleIntegrationService,
    private api: GoogleApiClient,
    private access: BusinessAccessService,
  ) {}

  /** Pulls reviews for every location the business selected. Existing local drafts are kept. */
  async sync(businessId: string): Promise<{ locations: number; reviews: number; failed: number }> {
    const accessToken = await this.google.getAccessToken(businessId);
    const locations = await this.prisma.location.findMany({
      where: { businessId, googleLocationId: { not: null }, googleAccountId: { not: null } },
    });
    let count = 0;
    let failed = 0;
    for (const loc of locations) {
      try {
        const reviews = await this.api.listReviews(accessToken, `accounts/${loc.googleAccountId}/locations/${loc.googleLocationId}`);
        for (const r of reviews) {
          if (await this.upsertReview(loc, r)) count++;
        }
        await this.prisma.location.update({ where: { id: loc.id }, data: { lastSyncedAt: new Date() } });
      } catch {
        failed++; // one location failing must not abort the rest
      }
    }
    return { locations: locations.length, reviews: count, failed };
  }

  private async upsertReview(loc: Location, r: GoogleReviewDto): Promise<boolean> {
    const rating = STARS[r.starRating];
    if (!rating) return false;
    const replied = !!r.reviewReply?.comment;
    const base = {
      reviewerName: r.reviewer?.isAnonymous ? 'A Google user' : r.reviewer?.displayName ?? 'A Google user',
      rating,
      comment: r.comment ?? null,
      reviewedAt: new Date(r.createTime),
      replyContent: r.reviewReply?.comment ?? null,
      repliedAt: r.reviewReply ? new Date(r.reviewReply.updateTime) : null,
    };
    await this.prisma.googleReview.upsert({
      where: { googleReviewName: r.name },
      create: { locationId: loc.id, googleReviewName: r.name, ...base, status: replied ? 'REPLIED' : 'NEEDS_REPLY' },
      // A reply that exists on Google wins; otherwise keep any local draft and its status.
      update: replied ? { ...base, status: 'REPLIED' } : { ...base },
    });
    if (!replied) {
      // Google shows no reply: a review we marked REPLIED (reply deleted on Google) goes back to needing one.
      await this.prisma.googleReview.updateMany({
        where: { googleReviewName: r.name, status: 'REPLIED' },
        data: { status: 'NEEDS_REPLY', replyContent: null, repliedAt: null },
      });
    }
    return true;
  }

  async list(businessId: string, locationId?: string) {
    const rows = await this.prisma.googleReview.findMany({
      where: { location: { businessId }, ...(locationId ? { locationId } : {}) },
      include: { location: { select: { name: true } } },
      orderBy: { reviewedAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => ({
      id: r.id,
      author: r.reviewerName,
      rating: r.rating,
      text: r.comment ?? '',
      date: r.reviewedAt.toISOString(),
      reply: r.replyContent,
      draft: r.draftReply,
      status: r.status,
      locationId: r.locationId,
      locationName: r.location.name,
    }));
  }

  /** Loads a review and checks the user may act on its business. */
  private async loadForUser(userId: string, reviewId: string): Promise<GoogleReview & { location: Location & { business: { name: string } } }> {
    const review = await this.prisma.googleReview.findUnique({
      where: { id: reviewId },
      include: { location: { include: { business: { select: { name: true } } } } },
    });
    if (!review) throw new NotFoundException('Review not found');
    await this.access.assertRole(userId, review.location.businessId, MANAGE_ROLES);
    return review;
  }

  async generateDraft(userId: string, reviewId: string): Promise<string> {
    const review = await this.loadForUser(userId, reviewId);
    if (review.status === 'REPLIED') throw new BadRequestException('This review already has a reply');
    const draft = await this.ai.generateReviewReply({
      rating: review.rating,
      comment: review.comment,
      reviewerName: review.reviewerName,
      businessName: review.location.business.name,
    });
    if (!draft) throw new BadRequestException('Could not generate a draft; try again');
    await this.prisma.googleReview.update({ where: { id: reviewId }, data: { draftReply: draft, status: 'DRAFTED' } });
    return draft;
  }

  /** Posts a reply a person has approved. This is the only path that writes to Google. */
  async postReply(userId: string, reviewId: string, reply: string) {
    const text = (reply ?? '').trim();
    if (!text) throw new BadRequestException('Reply cannot be empty');
    if (text.length > MAX_REPLY_LENGTH) throw new BadRequestException(`Reply must be ${MAX_REPLY_LENGTH} characters or fewer`);

    const review = await this.loadForUser(userId, reviewId);
    if (review.status === 'REPLIED') throw new BadRequestException('This review already has a reply');
    const accessToken = await this.google.getAccessToken(review.location.businessId);
    await this.api.putReply(accessToken, review.googleReviewName, text);

    // The reply is live on Google from here. If recording it locally fails, the next sync reconciles it.
    try {
      await this.prisma.googleReview.update({
        where: { id: reviewId },
        data: { replyContent: text, repliedAt: new Date(), status: 'REPLIED', draftReply: null },
      });
      await this.prisma.auditLog.create({
        data: { userId, action: 'GOOGLE_REPLY_POSTED', details: { reviewId, locationId: review.locationId } },
      });
    } catch {
      /* intentionally swallowed: see comment above */
    }
    return { posted: true };
  }
}
