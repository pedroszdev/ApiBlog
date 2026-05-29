import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = modulo.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('Deve retornar accessToken e refreshToken quando email e senha são válidos', async () => {
      const dto = { email: 'pedro@gmail.com', password: '170607Pedro!' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: dto.email,
        name: 'pedro',
        password: 'hash-armazenado',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockPrismaService.session.create.mockResolvedValueOnce({});

      const resultado = await service.login(dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        'hash-armazenado',
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: 1,
        email: dto.email,
      });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 1, email: dto.email },
        { expiresIn: '7d', jwtid: expect.any(String) },
      );
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          token: 'refresh-token',
          expiresAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.session.create).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('Deve lançar 400 quando o email não existe', async () => {
      const dto = { email: 'naoexiste@gmail.com', password: '170607Pedro!' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(dto)).rejects.toThrow(
        new HttpException('Email ou senha invalido', HttpStatus.BAD_REQUEST),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockPrismaService.session.create).not.toHaveBeenCalled();
    });

    it('Deve lançar 400 quando a senha não bate', async () => {
      const dto = { email: 'pedro@gmail.com', password: 'errada' };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: dto.email,
        name: 'pedro',
        password: 'hash-armazenado',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(dto)).rejects.toThrow(
        new HttpException('Email ou senha invalido', HttpStatus.BAD_REQUEST),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        'hash-armazenado',
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockPrismaService.session.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('Deve invalidar a sessão pelo refreshToken', async () => {
      mockPrismaService.session.update.mockResolvedValueOnce({
        id: 10,
        token: 'refresh-token',
        isValid: false,
      });

      const resultado = await service.logout('refresh-token');

      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        data: { isValid: false },
        where: { token: 'refresh-token' },
      });
      expect(mockPrismaService.session.update).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 10,
        token: 'refresh-token',
        isValid: false,
      });
    });

    it('Deve lançar 400 quando a sessão não é encontrada', async () => {
      mockPrismaService.session.update.mockRejectedValueOnce(
        new Error('not found'),
      );

      await expect(service.logout('inexistente')).rejects.toThrow(
        new HttpException(
          'Sessão inválida ou já encerrada',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('refresh', () => {
    it('Deve gerar novos tokens e rotacionar a sessão quando o refresh é válido', async () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 5);

      mockPrismaService.session.findFirst.mockResolvedValueOnce({
        id: 10,
        userId: 1,
        token: 'refresh-antigo',
        isValid: true,
        expiresAt: futuro,
      });
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'pedro@gmail.com',
        name: 'pedro',
        password: 'hash',
      });
      mockJwtService.sign
        .mockReturnValueOnce('novo-access')
        .mockReturnValueOnce('novo-refresh');
      mockPrismaService.session.update.mockReturnValueOnce(
        'update-promise' as unknown as never,
      );
      mockPrismaService.session.create.mockReturnValueOnce(
        'create-promise' as unknown as never,
      );
      mockPrismaService.$transaction.mockResolvedValueOnce([{}, {}]);

      const resultado = await service.refresh('refresh-antigo');

      expect(mockPrismaService.session.findFirst).toHaveBeenCalledWith({
        where: { token: 'refresh-antigo', isValid: true },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: 1,
        email: 'pedro@gmail.com',
      });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 1, email: 'pedro@gmail.com' },
        { expiresIn: '7d', jwtid: expect.any(String) },
      );
      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { isValid: false },
      });
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          token: 'novo-refresh',
          expiresAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        'update-promise',
        'create-promise',
      ]);
      expect(resultado).toEqual({
        accessToken: 'novo-access',
        refreshToken: 'novo-refresh',
      });
    });

    it('Deve lançar 401 quando não existe sessão válida', async () => {
      mockPrismaService.session.findFirst.mockResolvedValueOnce(null);

      await expect(service.refresh('qualquer')).rejects.toThrow(
        new HttpException(
          'Não autorizado, Faça o login novamente',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(mockPrismaService.session.update).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('Deve invalidar e lançar 401 quando a sessão estiver expirada', async () => {
      const passado = new Date();
      passado.setDate(passado.getDate() - 1);

      mockPrismaService.session.findFirst.mockResolvedValueOnce({
        id: 10,
        userId: 1,
        token: 'refresh-antigo',
        isValid: true,
        expiresAt: passado,
      });
      mockPrismaService.session.update.mockResolvedValueOnce({});

      await expect(service.refresh('refresh-antigo')).rejects.toThrow(
        new HttpException(
          'Não autorizado, Faça o login novamente',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        data: { isValid: false },
        where: { id: 10 },
      });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
