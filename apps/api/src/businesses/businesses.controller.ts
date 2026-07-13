import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { Business as BusinessModel } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('businesses')
@UseGuards(AuthGuard('jwt'))
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

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
  async getBusinessById(@Param('id') id: string): Promise<BusinessModel | null> {
    return this.businessesService.business({ id });
  }

  @Put(':id')
  async updateBusiness(
    @Param('id') id: string,
    @Body() businessData: { name?: string; logoUrl?: string; brandColor?: string },
  ): Promise<BusinessModel> {
    return this.businessesService.updateBusiness({
      where: { id },
      data: businessData,
    });
  }

  @Delete(':id')
  async deleteBusiness(@Param('id') id: string): Promise<BusinessModel> {
    return this.businessesService.deleteBusiness({ id });
  }
}
