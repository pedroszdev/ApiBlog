import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const data = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new HttpException(
        'Email ou senha invalido',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await bcrypt.compare(data.password, user.password))) {
      throw new HttpException(
        'Email ou senha invalido',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Montamos o "crachá" (payload)
    const payload = { sub: user.id, email: user.email };

    // 2. Geramos os dois tokens (access usa o default 15m do JwtModule)
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 3. Calculamos a data de expiração para o banco de dados (somando 7 dias)
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // 4. Salvamos o Refresh Token no banco com o Prisma
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    try {
      const session = await this.prisma.session.update({
        data: {
          isValid: false,
        },
        where: {
          token: refreshToken,
        },
      });

      return session;
    } catch {
      throw new HttpException(
        'Sessão inválida ou já encerrada',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        token: refreshToken,
        isValid: true,
      },
    });

    if (!session) {
      throw new HttpException(
        'Não autorizado, Faça o login novamente',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.update({
        data: {
          isValid: false,
        },
        where: {
          id: session.id,
        },
      });

      throw new HttpException(
        'Não autorizado, Faça o login novamente',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    if (!user) {
      throw new HttpException(
        'Parabens por chegar aqui',
        HttpStatus.BAD_REQUEST,
      );
    }
    const payload = { sub: user.id, email: user.email };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Rotação: invalida a session antiga e cria a nova na mesma transação
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { isValid: false },
      }),
      this.prisma.session.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: expiresAt,
        },
      }),
    ]);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
