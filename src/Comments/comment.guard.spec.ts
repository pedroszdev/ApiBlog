import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CommentGuard } from './comment.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentGuard', () => {
  let guard: CommentGuard;

  const mockPrismaService = {
    comments: {
      findUnique: jest.fn(),
    },
  };

  const createMockContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CommentGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = modulo.get<CommentGuard>(CommentGuard);
  });

  describe('canActivate', () => {
    it('Deve retornar true quando o sub do token bate com o authorId do comentario', async () => {
      mockPrismaService.comments.findUnique.mockResolvedValueOnce({
        id: 7,
        authorId: 1,
        comment: 'massa',
        postId: 5,
      });

      const context = createMockContext({ sub: 1 }, { id: '7' });

      const resultado = await guard.canActivate(context);

      expect(mockPrismaService.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(mockPrismaService.comments.findUnique).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(true);
    });

    it('Deve lançar 404 quando o comentario não existe', async () => {
      mockPrismaService.comments.findUnique.mockResolvedValueOnce(null);

      const context = createMockContext({ sub: 1 }, { id: '999' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException('Comentario não existe', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockPrismaService.comments.findUnique).toHaveBeenCalledTimes(1);
    });

    it('Deve lançar ForbiddenException quando o usuário não é o autor do comentario', async () => {
      mockPrismaService.comments.findUnique.mockResolvedValueOnce({
        id: 7,
        authorId: 2,
        comment: 'massa',
        postId: 5,
      });

      const context = createMockContext({ sub: 1 }, { id: '7' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
