import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { AuthGuard } from '../Auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('LikesController', () => {
  let controller: LikesController;

  const mockLikesService = {
    likePost: jest.fn().mockResolvedValue({ id: 10, postId: 5, authorId: 1 }),
    unLikePost: jest.fn().mockResolvedValue({ message: 'descurtido' }),
    likeComment: jest
      .fn()
      .mockResolvedValue({ id: 11, commentId: 7, authorId: 1 }),
    unLikeComment: jest.fn().mockResolvedValue({ message: 'descurtido' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        { provide: LikesService, useValue: mockLikesService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = modulo.get<LikesController>(LikesController);
  });

  describe('likePost', () => {
    it('Deve curtir o post passando o userId do decorator', async () => {
      const dto = { postId: 5 };
      const userId = 1;

      const resultado = await controller.likePost(dto, userId);

      expect(mockLikesService.likePost).toHaveBeenCalledWith(dto, userId);
      expect(mockLikesService.likePost).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ id: 10, postId: 5, authorId: 1 });
    });
  });

  describe('unLikePost', () => {
    it('Deve descurtir o post passando o userId do decorator', async () => {
      const dto = { postId: 5 };
      const userId = 1;

      const resultado = await controller.unLikePost(dto, userId);

      expect(mockLikesService.unLikePost).toHaveBeenCalledWith(dto, userId);
      expect(mockLikesService.unLikePost).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'descurtido' });
    });
  });

  describe('likeComment', () => {
    it('Deve curtir o comentario passando o userId do decorator', async () => {
      const dto = { commentId: 7 };
      const userId = 1;

      const resultado = await controller.likeComment(dto, userId);

      expect(mockLikesService.likeComment).toHaveBeenCalledWith(dto, userId);
      expect(mockLikesService.likeComment).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ id: 11, commentId: 7, authorId: 1 });
    });
  });

  describe('unLikeComment', () => {
    it('Deve descurtir o comentario passando o userId do decorator', async () => {
      const dto = { commentId: 7 };
      const userId = 1;

      const resultado = await controller.unLikeComment(dto, userId);

      expect(mockLikesService.unLikeComment).toHaveBeenCalledWith(dto, userId);
      expect(mockLikesService.unLikeComment).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'descurtido' });
    });
  });
});
