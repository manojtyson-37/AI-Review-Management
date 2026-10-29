import { BadGatewayException, ConflictException, Injectable } from '@nestjs/common';

export const BUSINESS_SCOPE = 'https://www.googleapis.com/auth/business.manage';
const SCOPES = ['openid', 'email', BUSINESS_SCOPE];

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

export interface GoogleReviewDto {
  name: string; // accounts/{a}/locations/{l}/reviews/{r}
  reviewer?: { displayName?: string; isAnonymous?: boolean };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'STAR_RATING_UNSPECIFIED';
  comment?: string;
  createTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export class GoogleInvalidGrantError extends Error {}

/** Thin wrapper over the Google OAuth and Business Profile REST endpoints. */
@Injectable()
export class GoogleApiClient {
  private env(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`${name} is not set`);
    return v;
  }

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.env('GOOGLE_CLIENT_ID'),
      redirect_uri: this.env('GOOGLE_BUSINESS_REDIRECT_URI'),
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    return this.tokenRequest({
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.env('GOOGLE_BUSINESS_REDIRECT_URI'),
    });
  }

  async refresh(refreshToken: string): Promise<GoogleTokenResponse> {
    return this.tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' });
  }

  async revoke(token: string): Promise<void> {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    }).catch(() => undefined); // best effort: local deletion happens regardless
  }

  async userEmail(accessToken: string): Promise<string | undefined> {
    const res = await this.get<{ email?: string }>('https://openidconnect.googleapis.com/v1/userinfo', accessToken);
    return res.email;
  }

  async listAccounts(accessToken: string): Promise<{ name: string; accountName?: string }[]> {
    const res = await this.get<{ accounts?: { name: string; accountName?: string }[] }>(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      accessToken,
    );
    return res.accounts ?? [];
  }

  async listLocations(accessToken: string, account: string) {
    const out: { name: string; title: string; address?: string }[] = [];
    let pageToken: string | undefined;
    do {
      const qs = new URLSearchParams({ readMask: 'name,title,storefrontAddress', pageSize: '100' });
      if (pageToken) qs.set('pageToken', pageToken);
      const res = await this.get<{
        locations?: { name: string; title: string; storefrontAddress?: { addressLines?: string[]; locality?: string; postalCode?: string } }[];
        nextPageToken?: string;
      }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?${qs}`, accessToken);
      for (const l of res.locations ?? []) {
        const a = l.storefrontAddress;
        const address = a ? [...(a.addressLines ?? []), a.locality, a.postalCode].filter(Boolean).join(', ') : undefined;
        out.push({ name: l.name, title: l.title, address });
      }
      pageToken = res.nextPageToken;
    } while (pageToken);
    return out;
  }

  /** Lists reviews for accounts/{a}/locations/{l}. Capped at 20 pages (1000 reviews) per sync. */
  async listReviews(accessToken: string, locationPath: string): Promise<GoogleReviewDto[]> {
    const out: GoogleReviewDto[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < 20; page++) {
      const qs = new URLSearchParams({ pageSize: '50', orderBy: 'updateTime desc' });
      if (pageToken) qs.set('pageToken', pageToken);
      const res = await this.get<{ reviews?: GoogleReviewDto[]; nextPageToken?: string }>(
        `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?${qs}`,
        accessToken,
      );
      out.push(...(res.reviews ?? []));
      pageToken = res.nextPageToken;
      if (!pageToken) break;
    }
    return out;
  }

  async putReply(accessToken: string, reviewName: string, comment: string): Promise<void> {
    await this.request(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, accessToken, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
  }

  private async tokenRequest(body: Record<string, string>): Promise<GoogleTokenResponse> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.env('GOOGLE_CLIENT_ID'),
        client_secret: this.env('GOOGLE_CLIENT_SECRET'),
        ...body,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      if (json.error === 'invalid_grant') throw new GoogleInvalidGrantError(json.error_description);
      throw new BadGatewayException('Google token request failed');
    }
    return json;
  }

  private get<T>(url: string, accessToken: string): Promise<T> {
    return this.request(url, accessToken, { method: 'GET' }) as Promise<T>;
  }

  private async request(url: string, accessToken: string, init: RequestInit): Promise<unknown> {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${accessToken}` },
    });
    // 409, not 401: the app's own session is fine, only the Google connection needs attention.
    if (res.status === 401) throw new ConflictException('Google rejected the access token; reconnect Google');
    if (!res.ok) throw new BadGatewayException(`Google API error ${res.status}`);
    return res.status === 204 ? {} : res.json();
  }
}
