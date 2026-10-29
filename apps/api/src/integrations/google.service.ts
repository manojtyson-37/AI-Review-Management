import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenCryptoService } from '../common/token-crypto.service';
import { BusinessAccessService, OWNER_ONLY } from './business-access.service';
import { BUSINESS_SCOPE, GoogleApiClient, GoogleInvalidGrantError } from './google-api.client';

const STATE_TYPE = 'gbp-connect';

@Injectable()
export class GoogleIntegrationService {
  constructor(
    private prisma: PrismaService,
    private crypto: TokenCryptoService,
    private google: GoogleApiClient,
    private jwt: JwtService,
    private access: BusinessAccessService,
  ) {}

  /** Separate signing key for OAuth state, derived so it can never validate as a session token. */
  private jwtSecret(): string {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set');
    return `${s}:gbp-oauth-state`;
  }

  /** Consent URL. The state is a short-lived signed token binding the callback to this user and business. */
  buildConnectUrl(userId: string, businessId: string): string {
    const state = this.jwt.sign({ typ: STATE_TYPE, userId, businessId }, { secret: this.jwtSecret(), expiresIn: '10m' });
    return this.google.buildAuthUrl(state);
  }

  async handleCallback(code: string, state: string): Promise<string> {
    let payload: { typ: string; businessId: string; userId: string };
    try {
      payload = this.jwt.verify(state, { secret: this.jwtSecret() });
    } catch {
      throw new BadRequestException('Invalid or expired state');
    }
    if (payload.typ !== STATE_TYPE) throw new BadRequestException('Invalid state');
    // The user must still own the business at the moment of connection.
    await this.access.assertRole(payload.userId, payload.businessId, OWNER_ONLY);

    const tokens = await this.google.exchangeCode(code);
    if (!tokens.scope?.split(' ').includes(BUSINESS_SCOPE)) {
      throw new BadRequestException('The Business Profile permission was not granted');
    }
    const existing = await this.prisma.googleOAuthToken.findUnique({ where: { businessId: payload.businessId } });
    const refreshToken = tokens.refresh_token ?? (existing ? this.crypto.decrypt(existing.refreshToken) : undefined);
    if (!refreshToken) throw new BadRequestException('Google did not return a refresh token; reconnect and approve access');

    const googleEmail = await this.google.userEmail(tokens.access_token).catch(() => undefined);
    const data = {
      accessToken: this.crypto.encrypt(tokens.access_token),
      refreshToken: this.crypto.encrypt(refreshToken),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      googleEmail,
    };
    await this.prisma.googleOAuthToken.upsert({
      where: { businessId: payload.businessId },
      update: data,
      create: { businessId: payload.businessId, ...data },
    });
    return payload.businessId;
  }

  async status(businessId: string) {
    const token = await this.prisma.googleOAuthToken.findUnique({ where: { businessId } });
    return { connected: !!token, googleEmail: token?.googleEmail ?? null };
  }

  /** Returns a valid access token, refreshing it when it is about to expire. */
  async getAccessToken(businessId: string): Promise<string> {
    const token = await this.prisma.googleOAuthToken.findUnique({ where: { businessId } });
    if (!token) throw new ConflictException('Google is not connected for this business');
    if (token.expiresAt.getTime() - Date.now() > 60_000) {
      return this.crypto.decrypt(token.accessToken);
    }
    try {
      const refreshed = await this.google.refresh(this.crypto.decrypt(token.refreshToken));
      await this.prisma.googleOAuthToken.update({
        where: { businessId },
        data: {
          accessToken: this.crypto.encrypt(refreshed.access_token),
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
      return refreshed.access_token;
    } catch (err) {
      if (err instanceof GoogleInvalidGrantError) {
        // Access was revoked or expired on Google's side. Drop only the dead token; keep the user's synced data.
        await this.prisma.googleOAuthToken.delete({ where: { businessId } });
        throw new ConflictException('Google access was revoked or expired; reconnect Google');
      }
      throw err;
    }
  }

  /** Live list of the locations the connected Google account can manage. */
  async fetchGoogleLocations(businessId: string) {
    const accessToken = await this.getAccessToken(businessId);
    const accounts = await this.google.listAccounts(accessToken);
    const result: { googleAccountId: string; googleLocationId: string; name: string; address?: string }[] = [];
    for (const account of accounts) {
      for (const loc of await this.google.listLocations(accessToken, account.name)) {
        result.push({
          googleAccountId: account.name.replace('accounts/', ''),
          googleLocationId: loc.name.replace('locations/', ''),
          name: loc.title,
          address: loc.address,
        });
      }
    }
    return result;
  }

  /** Marks a Google location as one the business has chosen to sync. */
  async selectLocation(
    businessId: string,
    loc: { googleAccountId: string; googleLocationId: string; name: string; address?: string },
  ) {
    const live = await this.fetchGoogleLocations(businessId);
    const match = live.find(
      (l) => l.googleAccountId === loc.googleAccountId && l.googleLocationId === loc.googleLocationId,
    );
    if (!match) throw new BadRequestException('That location is not available to the connected Google account');

    const existing = await this.prisma.location.findUnique({ where: { googleLocationId: match.googleLocationId } });
    if (existing && existing.businessId !== businessId) {
      throw new BadRequestException('That location is not available');
    }
    const data = { googleAccountId: match.googleAccountId, name: match.name, address: match.address };
    return this.prisma.location.upsert({
      where: { googleLocationId: match.googleLocationId },
      update: data,
      create: { businessId, googleLocationId: match.googleLocationId, ...data },
    });
  }

  /** Revokes our access at Google, deletes the stored tokens and every synced review. */
  async disconnect(businessId: string): Promise<void> {
    const token = await this.prisma.googleOAuthToken.findUnique({ where: { businessId } });
    if (token) {
      await this.google.revoke(this.crypto.decrypt(token.refreshToken)).catch(() => undefined);
      await this.prisma.googleOAuthToken.delete({ where: { businessId } });
    }
    await this.deleteSyncedData(businessId);
  }

  /** Deletes synced reviews and drafts, and detaches the Google identifiers from the business's locations. */
  async deleteSyncedData(businessId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.googleReview.deleteMany({ where: { location: { businessId } } }),
      this.prisma.location.updateMany({
        where: { businessId, googleLocationId: { not: null } },
        data: { googleLocationId: null, googleAccountId: null, lastSyncedAt: null },
      }),
    ]);
  }
}
