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

async function createComment(
  app: INestApplication,
  token: string,
  postId: number,
) {
  const res = await request(app.getHttpServer())
    .post('/comments')
    .set('Authorization', `Bearer ${token}`)
    .send({ comment: 'um comentario', postId })
    .expect(201);
  return res.body.data;
}

describe('Likes (e2e)', () => {
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

  describe('POST /like/post', () => {
    it('Deve curtir um post', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(201);
    });

    it('Deve recusar sem postId (400)', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Necessario mandar postId');
    });

    it('Deve recusar post inexistente (404)', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: 999999 })
        .expect(404);

      expect(res.body.message).toBe('post não existe');
    });

    it('Deve recusar curtida duplicada (409)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(409);

      expect(res.body.message).toBe('Você já curtiu');
    });

    it('Deve recusar sem token (401)', async () => {
      await request(app.getHttpServer())
        .post('/like/post')
        .send({ postId: 1 })
        .expect(401);
    });
  });

  describe('DELETE /like/post', () => {
    it('Deve descurtir um post (204)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .post('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(201);

      await request(app.getHttpServer())
        .delete('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(204);
    });

    it('Deve recusar descurtir sem ter curtido (404)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      const res = await request(app.getHttpServer())
        .delete('/like/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId: post.id })
        .expect(404);

      expect(res.body.message).toBe('like não existe');
    });
  });

  describe('POST /like/comment', () => {
    it('Deve curtir um comentário', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);
      const comment = await createComment(app, accessToken, post.id);

      await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: comment.id })
        .expect(201);
    });

    it('Deve recusar sem commentId (400)', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Necessario mandar commentId');
    });

    it('Deve recusar comentário inexistente (404)', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: 999999 })
        .expect(404);

      expect(res.body.message).toBe('comentario não existe');
    });

    it('Deve recusar curtida duplicada (409)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);
      const comment = await createComment(app, accessToken, post.id);

      await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: comment.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: comment.id })
        .expect(409);

      expect(res.body.message).toBe('Você já curtiu');
    });
  });

  describe('DELETE /like/comment', () => {
    it('Deve descurtir um comentário (204)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);
      const comment = await createComment(app, accessToken, post.id);

      await request(app.getHttpServer())
        .post('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: comment.id })
        .expect(201);

      await request(app.getHttpServer())
        .delete('/like/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ commentId: comment.id })
        .expect(204);
    });
  });
});
