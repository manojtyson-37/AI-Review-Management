import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { GoogleIntegrationService } from './google.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('integrations/google')
@UseGuards(AuthGuard('jwt'))
export class GoogleIntegrationController {
  constructor(private googleService: GoogleIntegrationService) {}

  @Post('connect')
  async connectMockAccount(@Req() req: any) {
    // Hardcode a mock business id for demo purposes if none exist
    const mockBusinessId = "mock_biz_" + req.user.sub;
    const userId = req.user.sub;
    await this.googleService.connectMockGoogleAccount(mockBusinessId, userId);
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
