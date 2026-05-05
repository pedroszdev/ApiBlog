import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PostGuard } from './post.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('PostGuard', () => {
  let guard: PostGuard;

  const mockPrismaService = {
    post: {
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
        PostGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = modulo.get<PostGuard>(PostGuard);
  });

  describe('canActivate', () => {
    it('Deve retornar true quando o sub do token bate com o authorId do post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce({
        id: 5,
        authorId: 1,
        title: 'titulo',
        content: 'conteudo',
        published: true,
      });

      const context = createMockContext({ sub: 1 }, { id: '5' });

      const resultado = await guard.canActivate(context);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledTimes(1);
      expect(resultado).toBe(true);
    });

    it('Deve lançar 404 quando o post não existe', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      const context = createMockContext({ sub: 1 }, { id: '999' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException('Post não existe', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledTimes(1);
    });

    it('Deve lançar ForbiddenException quando o usuário não é o autor do post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce({
        id: 5,
        authorId: 2,
        title: 'titulo',
        content: 'conteudo',
        published: true,
      });

      const context = createMockContext({ sub: 1 }, { id: '5' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
