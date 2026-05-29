import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AuthGuard } from '../Auth/auth.guard';
import { OptionalAuthGuard } from '../Auth/optionalAuth.guard';
import { PostGuard } from './post.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('PostController', () => {
  let controller: PostController;

  const mockPostService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 1, title: 'a', content: 'b', authorId: 1, published: true },
    ]),
    findById: jest.fn().mockResolvedValue({
      id: 5,
      title: 'a',
      content: 'b',
      authorId: 1,
      published: true,
      comments: [],
    }),
    createPost: jest.fn().mockResolvedValue({
      id: 5,
      title: 'titulo',
      content: 'conteudo',
      authorId: 1,
      published: true,
    }),
    updatePost: jest.fn().mockResolvedValue({
      id: 5,
      title: 'novo titulo',
      content: 'conteudo',
      authorId: 1,
      published: true,
    }),
    deletePost: jest.fn().mockResolvedValue({ message: 'Post apagado' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PostGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = modulo.get<PostController>(PostController);
  });

  describe('findAll', () => {
    it('Deve listar todos os posts', async () => {
      const resultado = await controller.findAll();

      expect(mockPostService.findAll).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual([
        { id: 1, title: 'a', content: 'b', authorId: 1, published: true },
      ]);
    });
  });

  describe('findById', () => {
    it('Deve achar um post pelo id do parametro', async () => {
      const resultado = await controller.findById(5, undefined);

      expect(mockPostService.findById).toHaveBeenCalledWith(5, undefined);
      expect(mockPostService.findById).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 5,
        title: 'a',
        content: 'b',
        authorId: 1,
        published: true,
        comments: [],
      });
    });
  });

  describe('createPost', () => {
    it('Deve criar um post passando o sub do decorator UserId', async () => {
      const dto = {
        title: 'titulo',
        content: 'conteudo',
        published: true,
      };
      const sub = 1;

      const resultado = await controller.createPost(dto, sub);

      expect(mockPostService.createPost).toHaveBeenCalledWith(sub, dto);
      expect(mockPostService.createPost).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 5,
        title: 'titulo',
        content: 'conteudo',
        authorId: 1,
        published: true,
      });
    });
  });

  describe('updatepost', () => {
    it('Deve atualizar o post pelo id', async () => {
      const dto = { title: 'novo titulo' };
      const id = 5;

      const resultado = await controller.updatepost(id, dto);

      expect(mockPostService.updatePost).toHaveBeenCalledWith(id, dto);
      expect(mockPostService.updatePost).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 5,
        title: 'novo titulo',
        content: 'conteudo',
        authorId: 1,
        published: true,
      });
    });
  });

  describe('deletePost', () => {
    it('Deve excluir o post pelo id', async () => {
      const resultado = await controller.deletePost(5);

      expect(mockPostService.deletePost).toHaveBeenCalledWith(5);
      expect(mockPostService.deletePost).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'Post apagado' });
    });
  });
});
