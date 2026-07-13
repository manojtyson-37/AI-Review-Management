import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('funnel/:locationId')
  async getFunnel(@Param('locationId') locationId: string) {
    return this.analyticsService.getReviewFunnel(locationId);
  }
}
