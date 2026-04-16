import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TokenDto, LoginDto } from './dto/auth.dto';
import * as express from 'express';

@Controller()
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly service: AuthService,
  ) {}

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
    @Body() tokenDto: TokenDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken } = await this.service.refresh(tokenDto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // O JavaScript do navegador não consegue ler
      secure: true, // Só trafega em HTTPS (importante em produção)
      sameSite: 'strict', // Protege contra ataques falsificados (CSRF)
      maxAge: 7 * 24 * 60 * 60 * 1000, // Tempo de vida do cookie (7 dias em milissegundos)
    });
    return { accessToken };
  }
}
