import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location as LocationModel } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('locations')
@UseGuards(AuthGuard('jwt'))
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async createLocation(
    @Body() locationData: { businessId: string; name: string; address?: string },
  ): Promise<LocationModel> {
    // Basic implementation - needs RBAC check to ensure user owns businessId
    return this.locationsService.createLocation({
      name: locationData.name,
      address: locationData.address,
      business: { connect: { id: locationData.businessId } }
    });
  }

  @Get('business/:businessId')
  async getLocationsByBusiness(@Param('businessId') businessId: string): Promise<LocationModel[]> {
    return this.locationsService.locations({
      where: { businessId }
    });
  }

  @Get(':id')
  async getLocationById(@Param('id') id: string): Promise<LocationModel | null> {
    return this.locationsService.location({ id });
  }

  @Put(':id')
  async updateLocation(
    @Param('id') id: string,
    @Body() locationData: { name?: string; address?: string },
  ): Promise<LocationModel> {
    return this.locationsService.updateLocation({
      where: { id },
      data: locationData,
    });
  }

  @Delete(':id')
  async deleteLocation(@Param('id') id: string): Promise<LocationModel> {
    return this.locationsService.deleteLocation({ id });
  }
}
