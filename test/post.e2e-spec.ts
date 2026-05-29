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

  return { userId, accessToken };
}

async function createPost(
  app: INestApplication,
  token: string,
  body = { title: 'Meu Post', content: 'conteudo do post', published: true },
) {
  const res = await request(app.getHttpServer())
    .post('/post')
    .set('Authorization', `Bearer ${token}`)
    .send(body)
    .expect(201);
  return res.body.data;
}

describe('Post (e2e)', () => {
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

  describe('GET /post', () => {
    it('Deve listar posts sem autenticação', async () => {
      const res = await request(app.getHttpServer()).get('/post').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /post', () => {
    it('Deve criar um post com authorId do token', async () => {
      const { userId, accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Titulo', content: 'conteudo', published: true })
        .expect(201);

      expect(res.body.data.authorId).toBe(userId);
    });

    it('Deve recusar sem token (401)', async () => {
      await request(app.getHttpServer())
        .post('/post')
        .send({ title: 'Titulo', content: 'conteudo', published: true })
        .expect(401);
    });

    it('Deve recusar título curto (400)', async () => {
      const { accessToken } = await registerAndLogin(app);
      await request(app.getHttpServer())
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'ab', content: 'conteudo', published: true })
        .expect(400);
    });

    it('Deve recusar sem published (400)', async () => {
      const { accessToken } = await registerAndLogin(app);
      await request(app.getHttpServer())
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Titulo', content: 'conteudo' })
        .expect(400);
    });
  });

  describe('GET /post/:id', () => {
    it('Deve retornar o post moldado para visitante', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      const res = await request(app.getHttpServer())
        .get(`/post/${post.id}`)
        .expect(200);

      expect(res.body.data.likesCount).toBe(0);
      expect(res.body.data.likedByMe).toBe(false);
      expect(res.body.data.comments).toEqual([]);
    });

    it('Deve refletir likedByMe/likesCount para quem curtiu', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/post/${post.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.likesCount).toBe(1);
      expect(res.body.data.likedByMe).toBe(true);
    });

    it('Deve retornar 404 para post inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/post/999999')
        .expect(404);
      expect(res.body.message).toBe('Post não encontrado');
    });

    it('Deve retornar 400 para id não numérico', async () => {
      await request(app.getHttpServer()).get('/post/abc').expect(400);
    });
  });

  describe('PUT /post/:id', () => {
    it('Deve recusar edição por quem não é o autor (403)', async () => {
      const dono = await registerAndLogin(app, 'dono@test.com', 'Dono');
      const post = await createPost(app, dono.accessToken);
      const outro = await registerAndLogin(app, 'outro@test.com', 'Outro');

      await request(app.getHttpServer())
        .put(`/post/${post.id}`)
        .set('Authorization', `Bearer ${outro.accessToken}`)
        .send({ title: 'novo titulo' })
        .expect(403);
    });

    it('Deve retornar 404 ao editar post inexistente', async () => {
      const { accessToken } = await registerAndLogin(app);
      await request(app.getHttpServer())
        .put('/post/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'novo titulo' })
        .expect(404);
    });
  });

  describe('DELETE /post/:id', () => {
    it('Deve excluir o próprio post (204)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .delete(`/post/${post.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
