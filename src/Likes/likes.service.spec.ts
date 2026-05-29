import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LikesService } from './likes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LikesService', () => {
  let service: LikesService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
    },
    comments: {
      findUnique: jest.fn(),
    },
    likes: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  // Erro de violação de unique constraint do Prisma (já curtiu)
  const uniqueError = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed',
    { code: 'P2002', clientVersion: 'test' },
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = modulo.get<LikesService>(LikesService);
  });

  describe('likePost', () => {
    it('Deve criar o like quando o post existe', async () => {
      const userId = 1;
      const dto = { postId: 5 };
      const like = { id: 10, postId: 5, authorId: userId };
      mockPrismaService.post.findUnique.mockResolvedValueOnce({ id: 5 });
      mockPrismaService.likes.create.mockResolvedValueOnce(like);

      const resultado = await service.likePost(dto, userId);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(mockPrismaService.likes.create).toHaveBeenCalledWith({
        data: { postId: 5, authorId: userId },
      });
      expect(resultado).toEqual(like);
    });

    it('Deve lançar 400 quando o post não existe', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.likePost({ postId: 5 }, 1)).rejects.toThrow(
        new HttpException('post não existe', 400),
      );
      expect(mockPrismaService.likes.create).not.toHaveBeenCalled();
    });

    it('Deve lançar 409 quando o usuário já curtiu (P2002)', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce({ id: 5 });
      mockPrismaService.likes.create.mockRejectedValueOnce(uniqueError);

      await expect(service.likePost({ postId: 5 }, 1)).rejects.toThrow(
        new HttpException('Você já curtiu', 409),
      );
    });

    it('Deve relançar erros desconhecidos do Prisma', async () => {
      const erro = new Error('falha inesperada');
      mockPrismaService.post.findUnique.mockResolvedValueOnce({ id: 5 });
      mockPrismaService.likes.create.mockRejectedValueOnce(erro);

      await expect(service.likePost({ postId: 5 }, 1)).rejects.toThrow(erro);
    });

    it('Deve lançar 400 quando não houver postId', async () => {
      await expect(service.likePost({}, 1)).rejects.toThrow(
        new HttpException('Necessario mandar postId', 400),
      );
      expect(mockPrismaService.post.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('unLikePost', () => {
    it('Deve remover o like quando ele existe', async () => {
      const userId = 1;
      const dto = { postId: 5 };
      mockPrismaService.likes.findFirst.mockResolvedValueOnce({ id: 10 });

      const resultado = await service.unLikePost(dto, userId);

      expect(mockPrismaService.likes.findFirst).toHaveBeenCalledWith({
        where: { postId: 5, authorId: userId },
      });
      expect(mockPrismaService.likes.deleteMany).toHaveBeenCalledWith({
        where: { postId: 5, authorId: userId },
      });
      expect(resultado).toEqual({ message: 'descurtido' });
    });

    it('Deve lançar 400 quando o like não existe', async () => {
      mockPrismaService.likes.findFirst.mockResolvedValueOnce(null);

      await expect(service.unLikePost({ postId: 5 }, 1)).rejects.toThrow(
        new HttpException('like não existe', 400),
      );
      expect(mockPrismaService.likes.deleteMany).not.toHaveBeenCalled();
    });

    it('Deve lançar 400 quando não houver postId', async () => {
      await expect(service.unLikePost({}, 1)).rejects.toThrow(
        new HttpException('Necessario mandar postId', 400),
      );
    });
  });

  describe('likeComment', () => {
    it('Deve criar o like quando o comentário existe', async () => {
      const userId = 1;
      const dto = { commentId: 7 };
      const like = { id: 11, commentId: 7, authorId: userId };
      mockPrismaService.comments.findUnique.mockResolvedValueOnce({ id: 7 });
      mockPrismaService.likes.create.mockResolvedValueOnce(like);

      const resultado = await service.likeComment(dto, userId);

      expect(mockPrismaService.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(mockPrismaService.likes.create).toHaveBeenCalledWith({
        data: { commentId: 7, authorId: userId },
      });
      expect(resultado).toEqual(like);
    });

    it('Deve lançar 400 quando o comentário não existe', async () => {
      mockPrismaService.comments.findUnique.mockResolvedValueOnce(null);

      await expect(service.likeComment({ commentId: 7 }, 1)).rejects.toThrow(
        new HttpException('comentario não existe', 400),
      );
      expect(mockPrismaService.likes.create).not.toHaveBeenCalled();
    });

    it('Deve lançar 409 quando o usuário já curtiu (P2002)', async () => {
      mockPrismaService.comments.findUnique.mockResolvedValueOnce({ id: 7 });
      mockPrismaService.likes.create.mockRejectedValueOnce(uniqueError);

      await expect(service.likeComment({ commentId: 7 }, 1)).rejects.toThrow(
        new HttpException('Você já curtiu', 409),
      );
    });

    it('Deve lançar 400 quando não houver commentId', async () => {
      await expect(service.likeComment({}, 1)).rejects.toThrow(
        new HttpException('Necessario mandar commentId', 400),
      );
      expect(mockPrismaService.comments.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('unLikeComment', () => {
    it('Deve remover o like quando ele existe', async () => {
      const userId = 1;
      const dto = { commentId: 7 };
      mockPrismaService.likes.findFirst.mockResolvedValueOnce({ id: 11 });

      const resultado = await service.unLikeComment(dto, userId);

      expect(mockPrismaService.likes.findFirst).toHaveBeenCalledWith({
        where: { commentId: 7, authorId: userId },
      });
      expect(mockPrismaService.likes.deleteMany).toHaveBeenCalledWith({
        where: { commentId: 7, authorId: userId },
      });
      expect(resultado).toEqual({ message: 'descurtido' });
    });

    it('Deve lançar 400 quando o like não existe', async () => {
      mockPrismaService.likes.findFirst.mockResolvedValueOnce(null);

      await expect(service.unLikeComment({ commentId: 7 }, 1)).rejects.toThrow(
        new HttpException('like não existe', 400),
      );
      expect(mockPrismaService.likes.deleteMany).not.toHaveBeenCalled();
    });

    it('Deve lançar 400 quando não houver commentId', async () => {
      await expect(service.unLikeComment({}, 1)).rejects.toThrow(
        new HttpException('Necessario mandar commentId', 400),
      );
    });
  });
});
