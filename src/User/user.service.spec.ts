import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('userService', () => {
  let service: UserService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 9,
        email: 'ps6711534@gmail.com',
        name: 'pedro',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      }),
      create: jest.fn().mockResolvedValue({
        id: 10,
        email: 'pedroteste@gmail.com',
        name: 'pedro',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      }),
      update: jest.fn().mockResolvedValue({
        id: 10,
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      }),
      delete: jest.fn().mockResolvedValue({ message: 'User apagado' }),
    },
    session: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService, // Quando o Controller pedir o Service...
          useValue: mockPrismaService, // ...entregue o nosso mock!
        },
      ],
    }).compile();

    service = modulo.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('Deve criar usuario', async () => {
      const body = {
        name: 'Pedro',
        email: 'pedroteste@gmail.com',
        password: '170607Pedro!',
      };

      const resultado = await service.createUser(body);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: body.name,
          email: body.email,
          password: expect.any(String),
        },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 10,
        email: 'pedroteste@gmail.com',
        name: 'pedro',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      });
    });
  });

  describe('findByIdUser', () => {
    it('Deve achar user pelo id', async () => {
      const idRota = 9;

      const resultado = await service.findByIdUser(idRota);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: idRota,
        },
        include: {
          posts: true,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 9,
        email: 'ps6711534@gmail.com',
        name: 'pedro',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      });
    });

    it('Deve lançar 404 quando user não existe', async () => {
      const idRota = 999;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.findByIdUser(idRota)).rejects.toThrow(
        new HttpException('Usuario não encontrado', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: idRota },
        include: { posts: true },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUser', () => {
    it('Deve fazer o update do user sem alterar senha pelo id', async () => {
      const idRota = 10;
      const body = {
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 10,
          email: 'pedroteste@gmail.com',
          name: 'pedro',
          password:
            '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
          posts: [],
        })
        .mockResolvedValueOnce(null);

      const resultado = await service.updateUser(idRota, body);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: idRota,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: body.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: body,
        where: {
          id: idRota,
        },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 10,
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      });
    });

    it('deve fazer o update do user e hashear a nova senha', async () => {
      const idRota = 10;
      const body = {
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password: '170607Pedro!',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 10,
          email: 'pedroteste@gmail.com',
          name: 'pedro',
          password:
            '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
          posts: [],
        })
        .mockResolvedValueOnce(null);

      const resultado = await service.updateUser(idRota, body);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: idRota,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: body.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: {
          name: body.name,
          email: body.email,
          password: expect.any(String),
        },
        where: {
          id: idRota,
        },
      });
      //verifica se fez o hash da senha
      const callArgs = mockPrismaService.user.update.mock.calls[0][0];
      expect(callArgs.data.password).not.toBe(body.password);
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({
        id: 10,
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password:
          '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
        posts: [],
      });
    });

    it('Deve lançar 400 quando user não existe', async () => {
      const idRota = 999;
      const body = {
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password: '170607Pedro!',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateUser(idRota, body)).rejects.toThrow(
        new HttpException('Usuario não encontrado', HttpStatus.BAD_REQUEST),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: idRota },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('Deve lançar 400 quando a senha nao for segura', async () => {
      const idRota = 10;
      const body = {
        email: 'pedroteste@gmail.com',
        name: 'pedro teste',
        password: '12456461',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 10,
          email: 'pedroteste@gmail.com',
          name: 'pedro',
          password:
            '$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm',
          posts: [],
        })
        .mockResolvedValueOnce(null);

      await expect(service.updateUser(idRota, body)).rejects.toThrow(
        new HttpException(
          'Senha precisa ter no mínimo 8 caracteres, 1 letra maiúscula no mínimo, 1 número no mínimo, 1 caracter especial no mínimo e não é permitido sequência igual (aa, bb, 44, etc)',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: idRota,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: body.email },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUser (email)', () => {
    it('Deve lançar 409 quando o email já pertence a outro usuário', async () => {
      const idRota = 10;
      const body = { email: 'ps6711534@gmail.com' };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 10, email: 'pedroteste@gmail.com' })
        .mockResolvedValueOnce({ id: 9, email: 'ps6711534@gmail.com' });

      await expect(service.updateUser(idRota, body)).rejects.toThrow(
        new HttpException('Email já existe', HttpStatus.CONFLICT),
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('Deve deletar user pelo id', async () => {
      const idRota = 10;

      const resultado = await service.deleteUser(idRota);

      expect(mockPrismaService.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: idRota,
        },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: {
          id: idRota,
        },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledTimes(1);

      expect(resultado).toEqual({ message: 'User apagado' });
    });
  });
});
