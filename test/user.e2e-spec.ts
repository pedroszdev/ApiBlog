import { INestApplication, ValidationPipe } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import request from 'supertest';
import { PrismaService } from "../src/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import { DataInterceptor } from "../src/app.interceptors";

describe('User (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let tokenValido: string;

    //config inicial
    beforeAll( async () => {
        const moduleUser: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        
        app = moduleUser.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());                                                                                            
        app.useGlobalInterceptors(new DataInterceptor());


        prisma = app.get(PrismaService);
        jwtService = app.get(JwtService);

        //inicia o server
        await app.init();

        tokenValido = jwtService.sign({sub: 1, email: 'pedrotest@gmail.com'})
    });
    afterAll(async () => {                                                                                                               
        await app.close();
    });

    //limpeza antes de cada teste
    beforeEach( async () => {
        await prisma.user.deleteMany();
        await prisma.user.create({                                                                                                         
            data: { id: 1, name: 'Pedro', email: 'pedrotest@gmail.com', password: 'hash' },
        }); 
        jest.clearAllMocks();
    });

    it('/user/1 (GET) - Deve receber todas as infos do user', async () => {
        const resposta = await request(app.getHttpServer())
            .get('/user/1')
            .set('Authorization', `Bearer ${tokenValido}`)
            .expect(200)
    });
    it('', async () => {});
    it('', async () => {});
    it('', async () => {});
})