import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserGuard } from './user.guard';

describe('UserGuard', () => {
  let guard: UserGuard;

  const createMockContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new UserGuard();
  });

  describe('canActivate', () => {
    it('Deve retornar true quando o sub do token bate com o id da rota', () => {
      const context = createMockContext({ sub: 1 }, { id: '1' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('Deve lançar ForbiddenException quando o sub for diferente do id', () => {
      const context = createMockContext({ sub: 1 }, { id: '2' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Você não tem permissão para acessar esse recurso',
      );
    });

    it('Deve lançar ForbiddenException quando não houver user no request', () => {
      const context = createMockContext(undefined, { id: '1' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
