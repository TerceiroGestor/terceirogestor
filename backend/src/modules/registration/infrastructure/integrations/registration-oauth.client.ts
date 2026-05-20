import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type RegistrationOAuthProvider = 'google' | 'microsoft';

@Injectable()
export class RegistrationOAuthClient {
  constructor(private readonly config: ConfigService) {}

  buildAuthorizeUrl(provider: RegistrationOAuthProvider, state: string) {
    return provider === 'google'
      ? this.buildGoogleAuthorizeUrl(state)
      : this.buildMicrosoftAuthorizeUrl(state);
  }

  fetchProfile(provider: RegistrationOAuthProvider, code: string) {
    return provider === 'google'
      ? this.fetchGoogleProfile(code)
      : this.fetchMicrosoftProfile(code);
  }

  private buildGoogleAuthorizeUrl(state: string) {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID')?.trim();
    const redirectUri = this.config
      .get<string>('GOOGLE_OAUTH_REDIRECT_URI')
      ?.trim();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth nao configurado');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private buildMicrosoftAuthorizeUrl(state: string) {
    const clientId = this.config
      .get<string>('MICROSOFT_OAUTH_CLIENT_ID')
      ?.trim();
    const redirectUri = this.config
      .get<string>('MICROSOFT_OAUTH_REDIRECT_URI')
      ?.trim();
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Microsoft OAuth nao configurado');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: 'openid email profile',
      state,
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  private async fetchGoogleProfile(code: string) {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID')?.trim();
    const clientSecret = this.config
      .get<string>('GOOGLE_OAUTH_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.config
      .get<string>('GOOGLE_OAUTH_REDIRECT_URI')
      ?.trim();
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth nao configurado');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenPayload: any = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
      throw new BadRequestException(
        tokenPayload?.error_description ?? 'Falha ao autenticar com Google',
      );
    }

    const accessToken = tokenPayload?.access_token;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new BadRequestException('Falha ao autenticar com Google');
    }

    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const profile: any = await profileResponse.json().catch(() => null);
    if (!profileResponse.ok) {
      throw new BadRequestException('Falha ao carregar perfil do Google');
    }

    const email =
      typeof profile?.email === 'string' ? profile.email.toLowerCase() : null;
    const name = typeof profile?.name === 'string' ? profile.name : null;
    const sub = typeof profile?.sub === 'string' ? profile.sub : null;
    if (!email || !sub) {
      throw new BadRequestException('Perfil do Google invalido');
    }
    return { email, name: name ?? email, sub };
  }

  private async fetchMicrosoftProfile(code: string) {
    const clientId = this.config
      .get<string>('MICROSOFT_OAUTH_CLIENT_ID')
      ?.trim();
    const clientSecret = this.config
      .get<string>('MICROSOFT_OAUTH_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.config
      .get<string>('MICROSOFT_OAUTH_REDIRECT_URI')
      ?.trim();
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Microsoft OAuth nao configurado');
    }

    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      },
    );
    const tokenPayload: any = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
      throw new BadRequestException(
        tokenPayload?.error_description ?? 'Falha ao autenticar com Microsoft',
      );
    }

    const accessToken = tokenPayload?.access_token;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new BadRequestException('Falha ao autenticar com Microsoft');
    }

    const profileResponse = await fetch(
      'https://graph.microsoft.com/oidc/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const profile: any = await profileResponse.json().catch(() => null);
    if (!profileResponse.ok) {
      throw new BadRequestException('Falha ao carregar perfil do Microsoft');
    }

    const emailRaw =
      (typeof profile?.email === 'string' && profile.email) ||
      (typeof profile?.preferred_username === 'string' &&
        profile.preferred_username) ||
      null;
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    const name = typeof profile?.name === 'string' ? profile.name : null;
    const sub = typeof profile?.sub === 'string' ? profile.sub : null;
    if (!email || !sub) {
      throw new BadRequestException('Perfil do Microsoft invalido');
    }
    return { email, name: name ?? email, sub };
  }
}