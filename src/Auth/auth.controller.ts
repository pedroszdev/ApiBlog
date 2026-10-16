import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import * as express from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Throttle({ long: { limit: 5, ttl: 60000, blockDuration: 60000 }})
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } = await this.service.login(loginDto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // O JavaScript do navegador não consegue ler
      secure: true, // Só trafega em HTTPS (importante em produção)
      sameSite: 'strict', // Protege contra ataques falsificados (CSRF)
      maxAge: 7 * 24 * 60 * 60 * 1000, // Tempo de vida do cookie (7 dias em milissegundos)
    });

    return { accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken: string = req.cookies['refreshToken'] as string;
    await this.service.logout(refreshToken);
    res.clearCookie('refreshToken');
  }

  @Post('refresh')
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const oldRefreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token ausente');
    }

    const { accessToken, refreshToken } =
      await this.service.refresh(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken };
  }
}
