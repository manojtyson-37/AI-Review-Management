import { BadRequestException, Body, Controller, Delete, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleIntegrationService } from './google.service';
import { BusinessAccessService, MANAGE_ROLES, OWNER_ONLY } from './business-access.service';

@Controller('integrations/google')
export class GoogleIntegrationController {
  constructor(
    private googleService: GoogleIntegrationService,
    private access: BusinessAccessService,
  ) {}

  /** Public: Google redirects the browser here. Identity comes from the signed state, not a bearer token. */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Query('error') error: string, @Res() res) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (error || !code || !state) {
      return res.redirect(`${frontend}/dashboard/integrations?google=error`);
    }
    try {
      await this.googleService.handleCallback(code, state);
      return res.redirect(`${frontend}/dashboard/integrations?google=connected`);
    } catch {
      return res.redirect(`${frontend}/dashboard/integrations?google=error`);
    }
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async status(@Req() req, @Query('businessId') businessId?: string) {
    const id = await this.access.resolveBusinessId(req.user.id, businessId, MANAGE_ROLES);
    return { businessId: id, ...(await this.googleService.status(id)) };
  }

  @Get('connect-url')
  @UseGuards(AuthGuard('jwt'))
  async connectUrl(@Req() req, @Query('businessId') businessId?: string) {
    const id = await this.access.resolveBusinessId(req.user.id, businessId, OWNER_ONLY);
    return { url: this.googleService.buildConnectUrl(req.user.id, id) };
  }

  @Get('locations')
  @UseGuards(AuthGuard('jwt'))
  async locations(@Req() req, @Query('businessId') businessId?: string) {
    const id = await this.access.resolveBusinessId(req.user.id, businessId, MANAGE_ROLES);
    return { data: await this.googleService.fetchGoogleLocations(id) };
  }

  @Post('locations/sync')
  @UseGuards(AuthGuard('jwt'))
  async selectLocation(
    @Req() req,
    @Body() body: { businessId?: string; googleAccountId: string; googleLocationId: string; name: string; address?: string },
  ) {
    if (!body?.googleAccountId || !body?.googleLocationId) throw new BadRequestException('Missing location identifiers');
    const id = await this.access.resolveBusinessId(req.user.id, body.businessId, MANAGE_ROLES);
    return { success: true, data: await this.googleService.selectLocation(id, body) };
  }

  /** Revokes Google access and deletes tokens and synced reviews. */
  @Post('disconnect')
  @UseGuards(AuthGuard('jwt'))
  async disconnect(@Req() req, @Body() body: { businessId?: string }) {
    const id = await this.access.resolveBusinessId(req.user.id, body?.businessId, OWNER_ONLY);
    await this.googleService.disconnect(id);
    return { success: true };
  }

  /** Deletes synced Google data while leaving the connection in place. */
  @Delete('data')
  @UseGuards(AuthGuard('jwt'))
  async deleteData(@Req() req, @Query('businessId') businessId?: string) {
    const id = await this.access.resolveBusinessId(req.user.id, businessId, OWNER_ONLY);
    await this.googleService.deleteSyncedData(id);
    return { success: true };
  }
}
