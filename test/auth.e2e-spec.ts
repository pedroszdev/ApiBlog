import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DataInterceptor } from '../src/app.interceptors';

const VALID_PASSWORD = 'Test@123';

async function resetDb(prisma: PrismaService) {
  await prisma.likes.deleteMany();
  await prisma.comments.deleteMany();
  await prisma.session.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

async function register(app: INestApplication, email: string, name = 'Pedro') {
  await request(app.getHttpServer())
    .post('/user')
    .send({ email, name, password: VALID_PASSWORD })
    .expect(201);
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new DataInterceptor());
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  describe('POST /login', () => {
    it('Deve logar e retornar accessToken + cookie de refresh', async () => {
      await register(app, 'login@test.com');

      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'login@test.com', password: VALID_PASSWORD })
        .expect(201);

      expect(typeof res.body.data.accessToken).toBe('string');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('Deve recusar senha errada (400)', async () => {
      await register(app, 'senha@test.com');

      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'senha@test.com', password: 'Errada@123' })
        .expect(400);

      expect(res.body.message).toBe('Email ou senha invalido');
    });

    it('Deve recusar email inexistente (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'naoexiste@test.com', password: VALID_PASSWORD })
        .expect(400);

      expect(res.body.message).toBe('Email ou senha invalido');
    });

    it('Deve recusar senha curta na validação (400)', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'val@test.com', password: '123' })
        .expect(400);
    });
  });

  describe('POST /refresh', () => {
    it('Deve renovar o token reenviando o cookie', async () => {
      await register(app, 'refresh@test.com');
      const login = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'refresh@test.com', password: VALID_PASSWORD })
        .expect(201);

      const cookie = login.headers['set-cookie'];

      const res = await request(app.getHttpServer())
        .post('/refresh')
        .set('Cookie', cookie)
        .expect(201);

      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('Deve recusar sem cookie (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/refresh')
        .expect(401);

      expect(res.body.message).toBe('Refresh token ausente');
    });

    it('Deve invalidar o cookie antigo após a rotação (401)', async () => {
      await register(app, 'rot@test.com');
      const login = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'rot@test.com', password: VALID_PASSWORD })
        .expect(201);

      const oldCookie = login.headers['set-cookie'];

      // primeira renovação invalida a sessão antiga
      await request(app.getHttpServer())
        .post('/refresh')
        .set('Cookie', oldCookie)
        .expect(201);

      // reenviar o cookie antigo agora deve falhar
      await request(app.getHttpServer())
        .post('/refresh')
        .set('Cookie', oldCookie)
        .expect(401);
    });
  });

  describe('POST /logout', () => {
    it('Deve encerrar a sessão e invalidar o refresh', async () => {
      await register(app, 'logout@test.com');
      const login = await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'logout@test.com', password: VALID_PASSWORD })
        .expect(201);

      const cookie = login.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/logout')
        .set('Cookie', cookie)
        .expect(201);

      await request(app.getHttpServer())
        .post('/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
