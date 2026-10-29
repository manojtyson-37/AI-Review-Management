import { BadRequestException, Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location as LocationModel } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { BusinessAccessService, MANAGE_ROLES, OWNER_ONLY } from '../integrations/business-access.service';

@Controller('locations')
@UseGuards(AuthGuard('jwt'))
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly access: BusinessAccessService,
  ) {}

  /** Loads a location and checks the caller belongs to its business with one of the roles. */
  private async authorize(userId: string, id: string, roles = MANAGE_ROLES): Promise<LocationModel> {
    const location = await this.locationsService.location({ id });
    if (!location) throw new NotFoundException('Location not found');
    await this.access.assertRole(userId, location.businessId, roles);
    return location;
  }

  @Post()
  async createLocation(
    @Req() req: any,
    @Body() locationData: { businessId: string; name: string; address?: string },
  ): Promise<LocationModel> {
    if (typeof locationData?.name !== 'string' || !locationData.name.trim()) throw new BadRequestException('name is required');
    await this.access.assertRole(req.user.id, locationData.businessId, MANAGE_ROLES);
    return this.locationsService.createLocation({
      name: locationData.name,
      address: locationData.address,
      business: { connect: { id: locationData.businessId } },
    });
  }

  @Get('my-locations')
  async getMyLocations(@Req() req: any): Promise<LocationModel[]> {
    return this.locationsService.locations({
      where: { business: { users: { some: { userId: req.user.id } } } },
    });
  }

  @Get('business/:businessId')
  async getLocationsByBusiness(@Req() req: any, @Param('businessId') businessId: string): Promise<LocationModel[]> {
    await this.access.assertRole(req.user.id, businessId, MANAGE_ROLES);
    return this.locationsService.locations({ where: { businessId } });
  }

  @Get(':id')
  async getLocationById(@Req() req: any, @Param('id') id: string): Promise<LocationModel | null> {
    return this.authorize(req.user.id, id);
  }

  @Put(':id')
  async updateLocation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() locationData: { name?: string; address?: string },
  ): Promise<LocationModel> {
    await this.authorize(req.user.id, id);
    // Allowlist: never accept businessId or Google identifiers from the client.
    const data: { name?: string; address?: string } = {};
    if (typeof locationData?.name === 'string') data.name = locationData.name;
    if (typeof locationData?.address === 'string') data.address = locationData.address;
    return this.locationsService.updateLocation({ where: { id }, data });
  }

  @Delete(':id')
  async deleteLocation(@Req() req: any, @Param('id') id: string): Promise<LocationModel> {
    await this.authorize(req.user.id, id, OWNER_ONLY);
    return this.locationsService.deleteLocation({ id });
  }
}
