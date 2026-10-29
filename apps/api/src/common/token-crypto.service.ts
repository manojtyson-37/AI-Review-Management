import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const VERSION = 'v1';

/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 * Format: v1:<iv>:<authTag>:<ciphertext>, each part base64.
 * The key comes from TOKEN_ENCRYPTION_KEY (32 random bytes, base64). There is no fallback key.
 */
@Injectable()
export class TokenCryptoService {
  private key(): Buffer {
    const raw = process.env.TOKEN_ENCRYPTION_KEY;
    if (!raw) {
      throw new Error('TOKEN_ENCRYPTION_KEY is not set');
    }
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded');
    }
    return key;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv, tag, ct].map((p) => (typeof p === 'string' ? p : p.toString('base64'))).join(':');
  }

  decrypt(payload: string): string {
    const [version, iv, tag, ct] = payload.split(':');
    if (version !== VERSION || !iv || !tag || !ct) {
      throw new Error('Unrecognised token payload');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64')), decipher.final()]).toString('utf8');
  }
}
