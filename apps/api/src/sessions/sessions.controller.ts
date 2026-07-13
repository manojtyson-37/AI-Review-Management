import { Controller, Post, Param, Body, Put, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AiService } from '../ai/ai.service';
import { LocationsService } from '../locations/locations.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly aiService: AiService,
    private readonly locationsService: LocationsService,
  ) {}

  @Post('start/:locationId')
  async startSession(@Param('locationId') locationId: string, @Req() req) {
    const guestIp = req.ip || req.connection.remoteAddress;
    return this.sessionsService.createSession(locationId, guestIp);
  }

  @Put(':id/feedback')
  async submitFeedback(
    @Param('id') id: string,
    @Body() body: { rating: number; feedback: string }
  ) {
    // 1. Update session status and data
    const session = await this.sessionsService.updateSession(id, {
      rating: body.rating,
      feedback: body.feedback,
      status: 'QUESTIONS_ANSWERED',
    });

    // 2. Fetch business name via location
    const location = await this.locationsService.location({ id: session.locationId });
    // Assuming location object also joins business. For simplicity, we just use location name here or fetch business
    
    // 3. Generate AI drafts
    const drafts = await this.aiService.generateReviewDrafts(
      body.feedback,
      body.rating,
      location?.name || 'the business'
    );

    // 4. Save drafts to DB
    await this.sessionsService.saveDrafts(id, drafts);

    // 5. Update session status
    await this.sessionsService.updateSession(id, { status: 'DRAFT_GENERATED' });

    return { session, drafts };
  }

  @Post(':id/copy')
  async logCopy(@Param('id') id: string) {
    return this.sessionsService.updateSession(id, { status: 'COPIED' });
  }

  @Post(':id/redirect')
  async logRedirect(@Param('id') id: string) {
    return this.sessionsService.updateSession(id, { status: 'REDIRECTED' });
  }
}
