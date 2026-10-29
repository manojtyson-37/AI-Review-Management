import { randomBytes } from 'crypto';
import { TokenCryptoService } from './token-crypto.service';

describe('TokenCryptoService', () => {
  const svc = new TokenCryptoService();
  const original = process.env.TOKEN_ENCRYPTION_KEY;
  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });
  afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });

  it('round-trips and does not store plaintext', () => {
    const enc = svc.encrypt('ya29.secret-token');
    expect(enc).not.toContain('ya29');
    expect(enc.startsWith('v1:')).toBe(true);
    expect(svc.decrypt(enc)).toBe('ya29.secret-token');
  });

  it('uses a fresh IV each time', () => {
    expect(svc.encrypt('x')).not.toBe(svc.encrypt('x'));
  });

  it('rejects tampered ciphertext', () => {
    const parts = svc.encrypt('hello').split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => svc.decrypt(parts.join(':'))).toThrow();
  });

  it('fails when the key is missing or the wrong size', () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => svc.encrypt('x')).toThrow('TOKEN_ENCRYPTION_KEY is not set');
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('short').toString('base64');
    expect(() => svc.encrypt('x')).toThrow('32 bytes');
  });
});
