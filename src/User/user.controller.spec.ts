import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { AuthGuard } from '../Auth/auth.guard';
import { UserGuard } from './user.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('UserController', () => {
    let controller: UserController;

    const mockUserService = {
        findByIdUser: jest.fn().mockResolvedValue({
                "id": 9,
                "email": "ps6711534@gmail.com",
                "name": "pedro",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            }
        ),
        createUser : jest.fn().mockResolvedValue({
                "id": 10,
                "email": "pedroteste@gmail.com",
                "name": "pedro",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            }
        ),
        updateUser : jest.fn().mockResolvedValue({
                "id": 10,
                "email": "pedroteste@gmail.com",
                "name": "pedro teste",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            }
        ),
        deleteUser : jest.fn().mockResolvedValue({ "message": 'User apagado' })
    }

    beforeEach(async () => {
        jest.clearAllMocks();
    // 2. Criamos o módulo de teste isolado
        const modulo: TestingModule = await Test.createTestingModule({
            controllers: [UserController], // O Ator principal deste teste
            providers: [
                {
                    provide: UserService,      // Quando o Controller pedir o Service...
                    useValue: mockUserService, // ...entregue o nosso mock!
                },
                { 
                    provide: PrismaService, 
                    useValue: {} 
                }
            ],
        }).overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })                        
        .overrideGuard(UserGuard)
        .useValue({ canActivate: () => true })
        .compile();

            // 3. Pegamos a instância do Controller para usar nos testes
            controller = modulo.get<UserController>(UserController);
    });

  describe('findById', () => {
    it('Deve achar um usuario por ID do parametro', async () => {
        const idRota = 9;

        const resultado = await controller.findById(idRota);

        expect(mockUserService.findByIdUser).toHaveBeenCalledWith(9);
        expect(mockUserService.findByIdUser).toHaveBeenCalledTimes(1);

        expect(resultado).toEqual({
                "id": 9,
                "email": "ps6711534@gmail.com",
                "name": "pedro",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            })
    })
  })

  describe('createUser', () => {
    it('Deve criar um usuario', async () => {
        const body = {
            "email": "pedroteste@gmail.com",
            "name": "pedro",
            "password": "170607Pedro!",
        }

        const resultado = await controller.createUser(body);

        expect(mockUserService.createUser).toHaveBeenCalledWith(body);
        expect(mockUserService.createUser).toHaveBeenCalledTimes(1)

        expect(resultado).toEqual({
                "id": 10,
                "email": "pedroteste@gmail.com",
                "name": "pedro",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            })

    })
  })

  describe('updateById', () => {
    it('Deve fazer um update no usuario achado pelo ID', async () => {
        const body = {
            "email": "pedroteste@gmail.com",
            "name": "pedro teste",
            "password": "170607Pedro!",
        };

        const idRota = 10;

        const resultado = await controller.updateById(idRota, body);

        expect(mockUserService.updateUser).toHaveBeenCalledWith(idRota, body);
        expect(mockUserService.updateUser).toHaveBeenCalledTimes(1);

        expect(resultado).toEqual({
                "id": 10,
                "email": "pedroteste@gmail.com",
                "name": "pedro teste",
                "password": "$2b$10$to2/BdvbxaBQ8UByb9kS0eixkQaY/V15pPmTlsOUOp8ZfnM0AUfgm",
                "posts": []
            })
    })
  })

  describe('deleteById', () => {
    it('Deve excluir um usuario', async () => {
        const idRota = 10

        const resultado = await controller.deleteById(idRota)

        expect(mockUserService.deleteUser).toHaveBeenCalledWith(idRota);
        expect(mockUserService.deleteUser).toHaveBeenCalledTimes(1);

        expect(resultado).toEqual({ "message": 'User apagado' })
        
    })
  })
})