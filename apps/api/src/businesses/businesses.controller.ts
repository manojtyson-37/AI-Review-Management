import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { Business as BusinessModel } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { BusinessAccessService, MANAGE_ROLES, OWNER_ONLY } from '../integrations/business-access.service';

@Controller('businesses')
@UseGuards(AuthGuard('jwt'))
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly access: BusinessAccessService,
  ) {}

  @Post()
  async createBusiness(
    @Body() businessData: { name: string; logoUrl?: string; brandColor?: string },
    @Req() req,
  ): Promise<BusinessModel> {
    // Creating a business and linking to the current user via BusinessUser
    return this.businessesService.createBusiness({
      name: businessData.name,
      logoUrl: businessData.logoUrl,
      brandColor: businessData.brandColor,
      users: {
        create: {
          role: 'BUSINESS_OWNER',
          user: { connect: { id: req.user.id } }
        }
      }
    });
  }

  @Get()
  async getBusinesses(@Req() req): Promise<BusinessModel[]> {
    // Only return businesses where the user has access
    return this.businessesService.businesses({
      where: {
        users: {
          some: {
            userId: req.user.id
          }
        }
      }
    });
  }

  @Get(':id')
  async getBusinessById(@Req() req, @Param('id') id: string): Promise<BusinessModel | null> {
    await this.access.assertRole(req.user.id, id, [...MANAGE_ROLES, 'STAFF', 'VIEWER']);
    return this.businessesService.business({ id });
  }

  @Put(':id')
  async updateBusiness(
    @Req() req,
    @Param('id') id: string,
    @Body() businessData: { name?: string; logoUrl?: string; brandColor?: string },
  ): Promise<BusinessModel> {
    await this.access.assertRole(req.user.id, id, MANAGE_ROLES);
    const { name, logoUrl, brandColor } = businessData ?? {};
    return this.businessesService.updateBusiness({
      where: { id },
      data: { name, logoUrl, brandColor },
    });
  }

  @Delete(':id')
  async deleteBusiness(@Req() req, @Param('id') id: string): Promise<BusinessModel> {
    await this.access.assertRole(req.user.id, id, OWNER_ONLY);
    return this.businessesService.deleteBusiness({ id });
  }
}
