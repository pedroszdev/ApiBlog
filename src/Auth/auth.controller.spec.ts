import { Test, TestingModule } from '@nestjs/testing';
import * as express from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  };

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  const buildResMock = () => {
    const res: Partial<express.Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res as express.Response;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = modulo.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('Deve retornar accessToken e setar refreshToken no cookie', async () => {
      const dto = { email: 'pedro@gmail.com', password: '170607Pedro!' };
      mockAuthService.login.mockResolvedValueOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      const res = buildResMock();

      const resultado = await controller.login(dto, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        cookieOptions,
      );
      expect(res.cookie).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ accessToken: 'access-token' });
    });
  });

  describe('logout', () => {
    it('Deve invalidar a sessão e limpar o cookie refreshToken', async () => {
      mockAuthService.logout.mockResolvedValueOnce({});
      const req = {
        cookies: { refreshToken: 'refresh-token' },
      } as unknown as express.Request;
      const res = buildResMock();

      await controller.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-token');
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.clearCookie).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('Deve gerar novo accessToken e atualizar o cookie refreshToken', async () => {
      const dto = { token: 'refresh-antigo' };
      mockAuthService.refresh.mockResolvedValueOnce({
        accessToken: 'novo-access',
        refreshToken: 'novo-refresh',
      });
      const res = buildResMock();

      const resultado = await controller.refresh(dto, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
      expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'novo-refresh',
        cookieOptions,
      );
      expect(resultado).toEqual({ accessToken: 'novo-access' });
    });
  });
});
