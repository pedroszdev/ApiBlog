import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../Auth/auth.guard';
import { CommentGuard } from './comment.guard';
import { CommentValidationPipe } from './comments.pipe';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentsController', () => {
  let controller: CommentsController;

  const mockCommentsService = {
    createComment: jest.fn().mockResolvedValue({
      id: 7,
      comment: 'massa',
      authorId: 1,
      postId: 5,
    }),
    deleteComment: jest
      .fn()
      .mockResolvedValue({ message: 'Comentario apagado' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CommentGuard)
      .useValue({ canActivate: () => true })
      .overridePipe(CommentValidationPipe)
      .useValue({ transform: (value: unknown) => value })
      .compile();

    controller = modulo.get<CommentsController>(CommentsController);
  });

  describe('createcomment', () => {
    it('Deve criar um comentario passando o userId do decorator', async () => {
      const dto = { comment: 'massa', postId: 5 };
      const userId = 1;

      const resultado = await controller.createcomment(dto, userId);

      expect(mockCommentsService.createComment).toHaveBeenCalledWith(
        dto,
        userId,
      );
      expect(mockCommentsService.createComment).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 7,
        comment: 'massa',
        authorId: 1,
        postId: 5,
      });
    });
  });

  describe('deleteComment', () => {
    it('Deve excluir o comentario pelo id', async () => {
      const resultado = await controller.deleteComment(7);

      expect(mockCommentsService.deleteComment).toHaveBeenCalledWith(7);
      expect(mockCommentsService.deleteComment).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'Comentario apagado' });
    });
  });
});
