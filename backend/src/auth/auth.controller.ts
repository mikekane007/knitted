import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';

function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const value = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('google')
  googleLogin(@Res() response: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured.');
    }
    const callbackUrl = this.googleCallbackUrl();
    const state = randomBytes(32).toString('hex');
    response.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google-callback',
    });
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    return response.redirect(url.toString());
  }

  @Get('google-callback')
  async googleCallback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:4200').replace(/\/+$/, '');
    response.clearCookie('google_oauth_state', { path: '/api/auth/google-callback' });
    if (error || !code || !state) {
      return response.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication failed')}`);
    }
    const expectedState = readCookie(request, 'google_oauth_state');
    const supplied = Buffer.from(state);
    const expected = Buffer.from(expectedState ?? '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return response.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication failed')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured.');
    }
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.googleCallbackUrl(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!tokenResponse.ok) {
      throw new BadRequestException('Google token exchange failed.');
    }
    const tokenBody = await tokenResponse.json() as { access_token?: string };
    if (!tokenBody.access_token) {
      throw new BadRequestException('Google did not return an access token.');
    }
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { authorization: `Bearer ${tokenBody.access_token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!profileResponse.ok) {
      throw new BadRequestException('Google profile lookup failed.');
    }
    const profile = await profileResponse.json() as {
      id?: string;
      email?: string;
      name?: string;
      verified_email?: boolean;
    };
    if (!profile.id || !profile.email || profile.verified_email !== true) {
      return response.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Verified email not received from Google')}`);
    }
    const user = await this.auth.findOrCreateGoogleUser(profile.email, profile.name ?? '', profile.id);
    const jwt = await this.auth.createToken(user.id, user.email);
    return response.redirect(`${frontendUrl}/oauth-callback?token=${encodeURIComponent(jwt)}`);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.auth.getProfile(request.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(request.user.id, dto);
  }

  private googleCallbackUrl(): string {
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    if (callbackUrl) {
      return callbackUrl;
    }
    const apiUrl = process.env.PUBLIC_API_URL;
    if (!apiUrl) {
      throw new BadRequestException('PUBLIC_API_URL or GOOGLE_CALLBACK_URL must be configured.');
    }
    return `${apiUrl.replace(/\/+$/, '')}/api/auth/google-callback`;
  }
}
