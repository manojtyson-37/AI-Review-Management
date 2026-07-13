import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { GoogleIntegrationService } from './google.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('integrations/google')
@UseGuards(AuthGuard('jwt'))
export class GoogleIntegrationController {
  constructor(private googleService: GoogleIntegrationService) {}

  @Post('connect')
  async connectMockAccount(@Req() req: any) {
    // We assume the user has a business linked to them.
    // For MVP, if they don't, we should create or fetch one.
    // This is mocked to bypass full user-business role complex logic for MVP.
    // Let's assume the frontend passes businessId or we use user's first business
    
    // Hardcode a mock business id for demo purposes if none exist
    const mockBusinessId = "mock_biz_" + req.user.sub;
    await this.googleService.connectMockGoogleAccount(mockBusinessId);
    return { success: true, message: "Mock Google Account Connected" };
  }

  @Get('locations')
  async getLocations(@Req() req: any) {
    const mockBusinessId = "mock_biz_" + req.user.sub;
    const locations = await this.googleService.fetchGoogleLocations(mockBusinessId);
    return { data: locations };
  }

  @Post('locations/sync')
  async syncLocation(@Req() req: any, @Body() body: { googleLocationId: string, name: string, address: string }) {
    const mockBusinessId = "mock_biz_" + req.user.sub;
    const location = await this.googleService.syncLocation(mockBusinessId, body);
    return { success: true, data: location };
  }
}
