  import { Test, TestingModule } from '@nestjs/testing';
  import { HttpException, HttpStatus } from '@nestjs/common';                                                                          
  import { CreateUserValidationPipe } from './userValidation.pipe';                                                                    
  import { PrismaService } from '../prisma/prisma.service';                                                                            
                                                                                                                                       
  describe('UserValidationPipe', () => {                                                                                         
    let pipe: CreateUserValidationPipe;
                                                                                                                                       
    const mockPrismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({                                                                          
          id: 1,                                                                                                                       
          email: 'existe@gmail.com',                                                                                                   
          name: 'pedro',                                                                                                               
          password: 'hash',
        }),
      },                                                                                                                               
    };
                                                                                                                                       
    const metadata = { type: 'body' as const, metatype: undefined, data: '' };                                                         
   
    beforeEach(async () => {                                                                                                           
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({                                                                   
        providers: [
          CreateUserValidationPipe,                                                                                                    
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      pipe = module.get<CreateUserValidationPipe>(CreateUserValidationPipe);                                                           
    });
                                                                                                                                          
    describe('email já cadastrado', () => {                                                                                            
      it('deve lançar HttpException quando o email já existir', async () => {
        const dto = { email: 'existe@gmail.com', name: 'pedro', password: 'Abcdef1@' };                                                
                  
        await expect(pipe.transform(dto, metadata)).rejects.toThrow(                                                                   
          new HttpException('Email já utilizado', HttpStatus.BAD_REQUEST),
        ); 
        
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
            where: {
                email: dto.email,
            },
        });
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
        
      });
    });                                                                                                                                
                  
    describe('validação de senha', () => {
      beforeEach(() => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);
      });                                                                                                                              
   
      it('deve lançar HttpException quando a senha for fraca', async () => {                                                           
        const dto = { email: 'novo@gmail.com', name: 'pedro', password: '123' };
                                                                                                                                       
        await expect(pipe.transform(dto, metadata)).rejects.toThrow(HttpException);    

        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
            where: {
                email: dto.email,
            },
        });
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
                                                
      });                                                                                                                              
                                                                                                                                       
      it('deve retornar o value quando a senha for válida', async () => {                                                              
        const dto = { email: 'novo@gmail.com', name: 'pedro', password: 'Abcdef1@' };
                                                                                                                                       
        const result = await pipe.transform(dto, metadata);                                                                            
   
        expect(result).toEqual(dto);                                                                                                   
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: dto.email },
        });                                       
      });
                                                                                                                                       
    });
  });
