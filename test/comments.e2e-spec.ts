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
  text = 'um comentario',
) {
  const res = await request(app.getHttpServer())
    .post('/comments')
    .set('Authorization', `Bearer ${token}`)
    .send({ comment: text, postId })
    .expect(201);
  return res.body.data;
}

describe('Comments (e2e)', () => {
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

  describe('POST /comments', () => {
    it('Deve criar um comentário com os dados do autor', async () => {
      const { userId, accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      const res = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'um comentario', postId: post.id })
        .expect(201);

      expect(res.body.data.comment).toBe('um comentario');
      expect(res.body.data.author).toEqual({
        id: userId,
        name: 'Pedro',
        email: 'pedro@test.com',
      });
    });

    it('Deve recusar sem token (401)', async () => {
      await request(app.getHttpServer())
        .post('/comments')
        .send({ comment: 'um comentario', postId: 1 })
        .expect(401);
    });

    it('Deve recusar comentário em post inexistente (400)', async () => {
      const { accessToken } = await registerAndLogin(app);

      const res = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'um comentario', postId: 999999 })
        .expect(400);

      expect(res.body.message).toBe('Post não existe');
    });

    it('Deve recusar comentário curto (400)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'ab', postId: post.id })
        .expect(400);
    });
  });

  describe('POST /comments/:parentId/replies', () => {
    it('Deve criar uma resposta com parent_id', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);
      const parent = await createComment(
        app,
        accessToken,
        post.id,
        'comentario pai',
      );

      const res = await request(app.getHttpServer())
        .post(`/comments/${parent.id}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'uma resposta', postId: post.id })
        .expect(201);

      expect(res.body.data.parent_id).toBe(parent.id);
    });

    it('Deve recusar resposta a pai inexistente (400)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);

      const res = await request(app.getHttpServer())
        .post('/comments/999999/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'uma resposta', postId: post.id })
        .expect(400);

      expect(res.body.message).toBe('Comentário pai não existe');
    });

    it('Deve recusar resposta quando o pai é de outro post (400)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post1 = await createPost(app, accessToken);
      const post2 = await createPost(app, accessToken, {
        title: 'Post Dois',
        content: 'outro conteudo',
        published: true,
      });
      const parent = await createComment(
        app,
        accessToken,
        post1.id,
        'pai no post1',
      );

      const res = await request(app.getHttpServer())
        .post(`/comments/${parent.id}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: 'uma resposta', postId: post2.id })
        .expect(400);

      expect(res.body.message).toBe('Pai é de outro post');
    });
  });

  describe('DELETE /comments/:id', () => {
    it('Deve recusar exclusão por quem não é o autor (403)', async () => {
      const dono = await registerAndLogin(app, 'dono@test.com', 'Dono');
      const post = await createPost(app, dono.accessToken);
      const comment = await createComment(app, dono.accessToken, post.id);
      const outro = await registerAndLogin(app, 'outro@test.com', 'Outro');

      await request(app.getHttpServer())
        .delete(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${outro.accessToken}`)
        .expect(403);
    });

    it('Deve retornar 404 ao excluir comentário inexistente', async () => {
      const { accessToken } = await registerAndLogin(app);
      await request(app.getHttpServer())
        .delete('/comments/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('Deve excluir o próprio comentário (204)', async () => {
      const { accessToken } = await registerAndLogin(app);
      const post = await createPost(app, accessToken);
      const comment = await createComment(app, accessToken, post.id);

      await request(app.getHttpServer())
        .delete(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
