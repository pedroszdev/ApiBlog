import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockPrismaService = {
    comments: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = modulo.get<CommentsService>(CommentsService);
  });

  describe('createComment', () => {
    it('Deve criar um comentario mapeando authorId a partir do userId', async () => {
      const dto = { comment: 'massa', postId: 5 };
      const userId = 1;
      const criado = {
        id: 7,
        comment: dto.comment,
        authorId: userId,
        postId: dto.postId,
      };
      mockPrismaService.comments.create.mockResolvedValueOnce(criado);

      const resultado = await service.createComment(dto, userId);

      expect(mockPrismaService.comments.create).toHaveBeenCalledWith({
        data: {
          comment: dto.comment,
          authorId: userId,
          postId: dto.postId,
        },
      });
      expect(mockPrismaService.comments.create).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(criado);
    });
  });

  describe('deleteComment', () => {
    it('Deve excluir o comentario pelo id e retornar mensagem', async () => {
      mockPrismaService.comments.delete.mockResolvedValueOnce({});

      const resultado = await service.deleteComment(7);

      expect(mockPrismaService.comments.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(mockPrismaService.comments.delete).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'Comentario apagado' });
    });
  });
});
