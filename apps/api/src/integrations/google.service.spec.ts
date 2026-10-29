import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { GoogleIntegrationService } from './google.service';
import { GoogleInvalidGrantError } from './google-api.client';
import { TokenCryptoService } from '../common/token-crypto.service';

describe('GoogleIntegrationService', () => {
  let prisma: any, google: any, access: any, svc: GoogleIntegrationService;
  const crypto = new TokenCryptoService();
  const jwt = new JwtService({});

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    process.env.JWT_SECRET = 'test-secret';
    prisma = {
      googleOAuthToken: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn(), delete: jest.fn() },
      googleReview: { deleteMany: jest.fn() },
      location: { updateMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    google = { exchangeCode: jest.fn(), userEmail: jest.fn().mockResolvedValue('o@clinic.in'), refresh: jest.fn(), revoke: jest.fn().mockResolvedValue(undefined) };
    access = { assertRole: jest.fn().mockResolvedValue(undefined) };
    svc = new GoogleIntegrationService(prisma, crypto, google, jwt, access);
  });

  it('rejects a forged or wrong-type state', async () => {
    await expect(svc.handleCallback('c', 'garbage')).rejects.toBeInstanceOf(BadRequestException);
    const wrong = jwt.sign({ typ: 'login', businessId: 'b' }, { secret: 'test-secret:gbp-oauth-state' });
    await expect(svc.handleCallback('c', wrong)).rejects.toBeInstanceOf(BadRequestException);
    expect(google.exchangeCode).not.toHaveBeenCalled();
  });

  it('refuses a connection that lacks the Business Profile scope', async () => {
    google.exchangeCode.mockResolvedValue({ access_token: 'a', refresh_token: 'r', expires_in: 3600, scope: 'openid email' });
    const state = jwt.sign({ typ: 'gbp-connect', userId: 'u', businessId: 'b' }, { secret: 'test-secret:gbp-oauth-state' });
    await expect(svc.handleCallback('c', state)).rejects.toThrow('permission was not granted');
    expect(prisma.googleOAuthToken.upsert).not.toHaveBeenCalled();
  });

  it('stores tokens encrypted, never plaintext', async () => {
    google.exchangeCode.mockResolvedValue({ access_token: 'ACCESS', refresh_token: 'REFRESH', expires_in: 3600, scope: 'openid https://www.googleapis.com/auth/business.manage' });
    const state = jwt.sign({ typ: 'gbp-connect', userId: 'u', businessId: 'b' }, { secret: 'test-secret:gbp-oauth-state' });
    await svc.handleCallback('c', state);
    const { create } = prisma.googleOAuthToken.upsert.mock.calls[0][0];
    expect(create.accessToken).not.toContain('ACCESS');
    expect(crypto.decrypt(create.refreshToken)).toBe('REFRESH');
  });

  it('removes Google access when the refresh token was revoked', async () => {
    prisma.googleOAuthToken.findUnique.mockResolvedValue({
      accessToken: crypto.encrypt('old'), refreshToken: crypto.encrypt('rt'), expiresAt: new Date(Date.now() - 1000),
    });
    google.refresh.mockRejectedValue(new GoogleInvalidGrantError('revoked'));
    await expect(svc.getAccessToken('b')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.googleOAuthToken.delete).toHaveBeenCalled();
    expect(prisma.googleReview.deleteMany).not.toHaveBeenCalled(); // user data survives a dead token
  });

  it('rejects the callback when the user no longer owns the business', async () => {
    access.assertRole.mockRejectedValue(new BadRequestException());
    const state = jwt.sign({ typ: 'gbp-connect', userId: 'u', businessId: 'b' }, { secret: 'test-secret:gbp-oauth-state' });
    await expect(svc.handleCallback('c', state)).rejects.toBeInstanceOf(BadRequestException);
    expect(google.exchangeCode).not.toHaveBeenCalled();
  });

  it('does not accept a session token as OAuth state', async () => {
    const session = jwt.sign({ sub: 'u', typ: 'gbp-connect', businessId: 'b' }, { secret: 'test-secret' });
    await expect(svc.handleCallback('c', session)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('disconnect revokes at Google, deletes tokens and deletes synced reviews', async () => {
    prisma.googleOAuthToken.findUnique.mockResolvedValue({ refreshToken: crypto.encrypt('rt') });
    await svc.disconnect('b');
    expect(google.revoke).toHaveBeenCalledWith('rt');
    expect(prisma.googleOAuthToken.delete).toHaveBeenCalledWith({ where: { businessId: 'b' } });
    expect(prisma.googleReview.deleteMany).toHaveBeenCalledWith({ where: { location: { businessId: 'b' } } });
  });
});
