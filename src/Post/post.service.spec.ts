import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PostService', () => {
  let service: PostService;

  const mockPrismaService = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = modulo.get<PostService>(PostService);
  });

  describe('findAll', () => {
    it('Deve retornar os posts publicados paginados', async () => {
      const posts = [
        { id: 1, title: 'a', content: 'b', authorId: 1, published: true },
      ];
      mockPrismaService.post.findMany.mockResolvedValueOnce(posts);
      mockPrismaService.post.count.mockResolvedValueOnce(25);

      const resultado = await service.findAll(2, 10);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { id: 'asc' },
        where: { published: true },
      });
      expect(mockPrismaService.post.count).toHaveBeenCalledWith({
        where: { published: true },
      });
      expect(resultado).toEqual({
        posts,
        totalCount: 25,
        page: 2,
        totalPages: 3,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    const authorSelect = { select: { id: true, name: true, email: true } };

    // include esperado quando NÃO há usuário autenticado (likes desligado)
    const expectedInclude = {
      _count: { select: { likes: true } },
      likes: false,
      comments: {
        where: { parent_id: null },
        include: {
          author: authorSelect,
          _count: { select: { likes: true } },
          likes: false,
          replies: {
            include: {
              author: authorSelect,
              _count: { select: { likes: true } },
              likes: false,
            },
          },
        },
      },
    };

    it('Deve achar um post pelo id incluindo os comentarios', async () => {
      const post = {
        id: 5,
        title: 'a',
        content: 'b',
        authorId: 1,
        published: true,
        _count: { likes: 2 },
        comments: [],
      };
      mockPrismaService.post.findUnique.mockResolvedValueOnce(post);

      const resultado = await service.findById(5);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 5, published: true },
        include: expectedInclude,
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        id: 5,
        title: 'a',
        content: 'b',
        authorId: 1,
        published: true,
        likesCount: 2,
        likedByMe: false,
        comments: [],
      });
    });

    it('Deve lançar 404 quando o post não existe', async () => {
      mockPrismaService.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(
        new HttpException('Post não encontrado', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999, published: true },
        include: expectedInclude,
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPost', () => {
    it('Deve criar um post mapeando authorId a partir do sub', async () => {
      const sub = 1;
      const dto = {
        title: 'titulo',
        content: 'conteudo',
        published: true,
      };
      const criado = { id: 5, authorId: sub, ...dto };
      mockPrismaService.post.create.mockResolvedValueOnce(criado);

      const resultado = await service.createPost(sub, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          authorId: sub,
          content: dto.content,
          published: dto.published,
        },
      });
      expect(mockPrismaService.post.create).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(criado);
    });
  });

  describe('updatePost', () => {
    it('Deve atualizar o post pelo id', async () => {
      const id = 5;
      const dto = { title: 'novo titulo' };
      const atualizado = {
        id,
        title: dto.title,
        content: 'antigo',
        authorId: 1,
        published: true,
      };
      mockPrismaService.post.update.mockResolvedValueOnce(atualizado);

      const resultado = await service.updatePost(id, dto);

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        data: dto,
        where: { id },
      });
      expect(mockPrismaService.post.update).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(atualizado);
    });
  });

  describe('deletePost', () => {
    it('Deve excluir o post pelo id e retornar mensagem', async () => {
      mockPrismaService.post.delete.mockResolvedValueOnce({});

      const resultado = await service.deletePost(5);

      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(mockPrismaService.post.delete).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({ message: 'Post apagado' });
    });
  });
});
