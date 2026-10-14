import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { UserService } from '../User/user.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockUserService = {
    findByIdUser: jest
      .fn()
      .mockResolvedValue({ id: 1, email: 'pedro@gmail.com' }),
  };

  const createMockContext = (headers: Record<string, string | undefined>) => {
    const request: Record<string, unknown> = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      __request: request,
    } as unknown as ExecutionContext & { __request: Record<string, unknown> };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    guard = modulo.get<AuthGuard>(AuthGuard);
  });

  describe('canActivate', () => {
    it('Deve retornar true e injetar o user no request quando o token for válido', async () => {
      const payload = { sub: 1, email: 'pedro@gmail.com' };
      mockJwtService.verifyAsync.mockResolvedValueOnce(payload);

      const context = createMockContext({
        authorization: 'Bearer token-valido',
      });

      const resultado = await guard.canActivate(context);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token-valido');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(mockUserService.findByIdUser).toHaveBeenCalledWith(1);
      expect(resultado).toBe(true);
      expect((context as any).__request.user).toEqual(payload);
    });

    it('Deve lançar UnauthorizedException quando o header authorization estiver ausente', async () => {
      const context = createMockContext({ authorization: undefined });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Cabeçalho de autorização ausente'),
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('Deve lançar UnauthorizedException quando o type não for Bearer', async () => {
      const context = createMockContext({
        authorization: 'Basic token-qualquer',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Formato de token inválido'),
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('Deve lançar UnauthorizedException quando o token estiver vazio após Bearer', async () => {
      const context = createMockContext({ authorization: 'Bearer ' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Formato de token inválido'),
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('Deve lançar UnauthorizedException quando jwtService.verifyAsync falhar', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('jwt expired'),
      );

      const context = createMockContext({
        authorization: 'Bearer token-expirado',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
    });

    it('Deve lançar UnauthorizedException quando o usuário do token não existir mais', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: 1,
        email: 'pedro@gmail.com',
      });
      mockUserService.findByIdUser.mockRejectedValueOnce(
        new Error('Usuario não encontrado'),
      );

      const context = createMockContext({
        authorization: 'Bearer token-valido',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect((context as any).__request.user).toBeUndefined();
    });
  });
});
