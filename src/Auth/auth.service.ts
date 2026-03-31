import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto, TokenDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import bcrypt from 'node_modules/bcryptjs';
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

    if (!bcrypt.compareSync(data.password, user.password)) {
      throw new HttpException(
        'Email ou senha invalido',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Montamos o "crachá" (payload)
    const payload = { sub: user.id, email: user.email };

    // 2. Geramos os dois tokens
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' }); // Curta duração
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // Longa duração

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
      throw new HttpException('', HttpStatus.BAD_REQUEST);
    }
  }

  async refresh(TokenDto: TokenDto) {
    const data = TokenDto;
    const session = await this.prisma.session.findFirst({
      where: {
        token: data.token,
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
    // 1. Montamos o "crachá" (payload)
    const payload = { sub: user.id, email: user.email };

    // 2. Geramos os dois tokens
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' }); // Curta duração
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // Longa duração

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

    return { accessToken, refreshToken };
  }
}
