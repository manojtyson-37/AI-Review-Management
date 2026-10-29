import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const MANAGE_ROLES: Role[] = ['BUSINESS_OWNER', 'MANAGER'];
export const OWNER_ONLY: Role[] = ['BUSINESS_OWNER'];

@Injectable()
export class BusinessAccessService {
  constructor(private prisma: PrismaService) {}

  /** Throws unless the user is a member of the business with one of the allowed roles. */
  async assertRole(userId: string, businessId: string, allowed: Role[]): Promise<void> {
    const membership = await this.prisma.businessUser.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!membership || !allowed.includes(membership.role)) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }

  /**
   * Uses the requested business (after a membership check) or, when none is given,
   * the user's only business, creating one on first use.
   */
  async resolveBusinessId(userId: string, requested: string | undefined, allowed: Role[]): Promise<string> {
    if (requested) {
      await this.assertRole(userId, requested, allowed);
      return requested;
    }
    const memberships = await this.prisma.businessUser.findMany({ where: { userId, role: { in: allowed } } });
    if (memberships.length === 1) return memberships[0].businessId;
    if (memberships.length > 1) throw new ForbiddenException('Specify which business to use (businessId)');
    const business = await this.prisma.business.create({
      data: { name: 'My Business', users: { create: { userId, role: 'BUSINESS_OWNER' } } },
    });
    return business.id;
  }
}
