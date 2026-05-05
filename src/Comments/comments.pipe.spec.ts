import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CommentValidationPipe } from './comments.pipe';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentValidationPipe', () => {
  let pipe: CommentValidationPipe;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
    },
  };

  const metadata = { type: 'body' as const, metatype: undefined, data: '' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CommentValidationPipe,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    pipe = modulo.get<CommentValidationPipe>(CommentValidationPipe);
  });

  describe('post inexistente', () => {
    it('Deve lançar HttpException quando o postId não existe', async () => {
      const dto = { comment: 'massa', postId: 999 };
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(pipe.transform(dto, metadata)).rejects.toThrow(
        new HttpException('Post não existe', HttpStatus.BAD_REQUEST),
      );

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: dto.postId },
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('post existente', () => {
    it('Deve retornar o value quando o post existe', async () => {
      const dto = { comment: 'massa', postId: 5 };
      mockPrismaService.post.findUnique.mockResolvedValueOnce({
        id: dto.postId,
        title: 'titulo',
        content: 'conteudo',
        authorId: 1,
        published: true,
      });

      const resultado = await pipe.transform(dto, metadata);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: dto.postId },
      });
      expect(resultado).toEqual(dto);
    });
  });
});
