import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { BusinessAccessService, MANAGE_ROLES } from '../integrations/business-access.service';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ReviewsController {
  constructor(
    private reviews: ReviewsService,
    private access: BusinessAccessService,
  ) {}

  @Get()
  async list(@Req() req, @Query('businessId') businessId?: string, @Query('locationId') locationId?: string) {
    const id = await this.access.resolveBusinessId(req.user.id, businessId, MANAGE_ROLES);
    return this.reviews.list(id, locationId);
  }

  @Post('sync')
  async sync(@Req() req, @Body() body: { businessId?: string }) {
    const id = await this.access.resolveBusinessId(req.user.id, body?.businessId, MANAGE_ROLES);
    return this.reviews.sync(id);
  }

  @Post('reply/generate')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // each call is a paid OpenAI request
  async generate(@Req() req, @Body() body: { reviewId: string }) {
    if (typeof body?.reviewId !== 'string') throw new BadRequestException('reviewId is required');
    return { draft: await this.reviews.generateDraft(req.user.id, body.reviewId) };
  }

  @Post('reply/send')
  async send(@Req() req, @Body() body: { reviewId: string; reply: string }) {
    if (typeof body?.reviewId !== 'string' || typeof body?.reply !== 'string') {
      throw new BadRequestException('reviewId and reply are required');
    }
    await this.reviews.postReply(req.user.id, body.reviewId, body.reply);
    return { success: true };
  }
}
