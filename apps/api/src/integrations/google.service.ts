import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleIntegrationService {
  constructor(private prisma: PrismaService) {}

  // In production, this would do OAuth flow.
  // For MVP, we simulate a successful connection.
  async connectMockGoogleAccount(businessId: string, userId: string) {
    // Ensure the mock business exists before attaching tokens
    await this.prisma.business.upsert({
      where: { id: businessId },
      update: {},
      create: {
        id: businessId,
        name: 'Mock Business',
        users: {
          create: {
            userId: userId,
            role: 'BUSINESS_OWNER'
          }
        }
      }
    });

    // Upsert the token for the business
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    return this.prisma.googleOAuthToken.upsert({
      where: { businessId },
      update: {
        accessToken: 'mock_access_token_123',
        refreshToken: 'mock_refresh_token_456',
        expiresAt,
      },
      create: {
        businessId,
        accessToken: 'mock_access_token_123',
        refreshToken: 'mock_refresh_token_456',
        expiresAt,
      },
    });
  }

  // Fetch mock locations
  async fetchGoogleLocations(businessId: string) {
    // In production, this would use the accessToken to call Google My Business API
    // GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations

    return [
      {
        googleLocationId: 'google_loc_1',
        name: 'ReviewAssist HQ',
        address: '123 Main St, San Francisco, CA 94105',
      },
      {
        googleLocationId: 'google_loc_2',
        name: 'ReviewAssist NYC',
        address: '456 Broadway, New York, NY 10013',
      },
      {
        googleLocationId: 'google_loc_3',
        name: 'ReviewAssist London',
        address: '789 Oxford St, London, UK',
      }
    ];
  }

  async syncLocation(businessId: string, locationData: { googleLocationId: string, name: string, address: string }) {
    return this.prisma.location.upsert({
      where: { googleLocationId: locationData.googleLocationId },
      update: {
        name: locationData.name,
        address: locationData.address,
      },
      create: {
        businessId,
        googleLocationId: locationData.googleLocationId,
        name: locationData.name,
        address: locationData.address,
      }
    });
  }
}
