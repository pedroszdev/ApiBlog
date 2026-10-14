import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DataInterceptor } from '../src/app.interceptors';

const VALID_PASSWORD = 'Test@123';

// Limpeza respeitando as FKs: filhos antes dos pais
async function resetDb(prisma: PrismaService) {
  await prisma.likes.deleteMany();
  await prisma.comments.deleteMany();
  await prisma.session.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

// Fluxo real: cria usuário e faz login, devolvendo token e id
async function registerAndLogin(
  app: INestApplication,
  email = 'pedro@test.com',
  name = 'Pedro',
) {
  const created = await request(app.getHttpServer())
    .post('/user')
    .send({ email, name, password: VALID_PASSWORD })
    .expect(201);

  const userId = created.body.data.id as number;

  const login = await request(app.getHttpServer())
    .post('/login')
    .send({ email, password: VALID_PASSWORD })
    .expect(201);

  const accessToken = login.body.data.accessToken as string;

  return { userId, accessToken, email };
}

describe('User (e2e)', () => {
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

  describe('POST /user', () => {
    it('Deve criar um usuário', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'novo@test.com',
          name: 'Novo',
          password: VALID_PASSWORD,
        })
        .expect(201);

      expect(resposta.body.data.email).toBe('novo@test.com');
      expect(resposta.body.data.name).toBe('Novo');
      expect(resposta.body.data.id).toEqual(expect.any(Number));
    });

    it('Deve recusar email duplicado', async () => {
      await registerAndLogin(app, 'dup@test.com');

      const resposta = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'dup@test.com',
          name: 'Outro',
          password: VALID_PASSWORD,
        })
        .expect(409);

      expect(resposta.body.message).toBe('Email já utilizado');
    });

    it('Deve recusar senha fora do padrão', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ email: 'fraca@test.com', name: 'Fraca', password: 'password' })
        .expect(400);
    });

    it('Deve recusar nome curto', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ email: 'curto@test.com', name: 'ab', password: VALID_PASSWORD })
        .expect(400);
    });

    it('Deve recusar email inválido', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ email: 'naoehemail', name: 'Pedro', password: VALID_PASSWORD })
        .expect(400);
    });
  });

  describe('GET /user/:id', () => {
    it('Deve retornar o próprio usuário com posts', async () => {
      const { userId, accessToken } = await registerAndLogin(app);

      const resposta = await request(app.getHttpServer())
        .get(`/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(resposta.body.data.id).toBe(userId);
      expect(resposta.body.data.posts).toEqual([]);
    });

    it('Deve recusar sem token (401)', async () => {
      const { userId } = await registerAndLogin(app);

      await request(app.getHttpServer()).get(`/user/${userId}`).expect(401);
    });

    it('Deve recusar acesso a outro usuário (403)', async () => {
      const dono = await registerAndLogin(app, 'dono@test.com', 'Dono');
      const outro = await registerAndLogin(app, 'outro@test.com', 'Outro');

      await request(app.getHttpServer())
        .get(`/user/${dono.userId}`)
        .set('Authorization', `Bearer ${outro.accessToken}`)
        .expect(403);
    });
  });

  describe('PUT /user/:id', () => {
    it('Deve atualizar o próprio nome', async () => {
      const { userId, accessToken } = await registerAndLogin(app);

      const resposta = await request(app.getHttpServer())
        .put(`/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Pedro Editado' })
        .expect(200);

      expect(resposta.body.data.name).toBe('Pedro Editado');
    });
  });

  describe('DELETE /user/:id', () => {
    it('Deve excluir o próprio usuário mesmo com sessão ativa (204)', async () => {
      // O login cria uma Session; deleteUser remove as sessões antes de
      // apagar o usuário (senão o delete falharia por FK).
      const { userId, accessToken } = await registerAndLogin(app);

      await request(app.getHttpServer())
        .delete(`/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
