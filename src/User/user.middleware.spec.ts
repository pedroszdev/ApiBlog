import { Request, Response, NextFunction } from 'express';
import { UserMiddleware } from './user.middleware';

describe('UserMiddleware', () => {
  let middleware: UserMiddleware;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new UserMiddleware();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('use', () => {
    it('Deve chamar next() para continuar o fluxo', () => {
      const req = { ip: '127.0.0.1' } as Request;
      const res = {} as Response;
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Deve logar o IP que está acessando a rota user', () => {
      const req = { ip: '192.168.0.10' } as Request;
      const res = {} as Response;
      const next: NextFunction = jest.fn();

      middleware.use(req, res, next);

      expect(logSpy).toHaveBeenCalledWith(
        'IP: 192.168.0.10 está acessando rota user',
      );
      expect(logSpy).toHaveBeenCalledTimes(1);
    });
  });
});
