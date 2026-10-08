# API Blog — NestJS + Prisma + PostgreSQL

API REST de um blog com autenticação JWT, posts, comentários aninhados e curtidas. Projeto de estudo e portfólio, feito para praticar os blocos principais do NestJS (módulos, guards, pipes, interceptors, middlewares e decorators customizados) junto com Prisma, PostgreSQL e testes automatizados.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Runtime / Linguagem | Node.js, TypeScript |
| Framework | NestJS 11 |
| ORM | Prisma 7 (com `@prisma/adapter-pg`) |
| Banco de dados | PostgreSQL 18 (via Docker Compose) |
| Autenticação | JWT (`@nestjs/jwt`) + refresh token em cookie `httpOnly` |
| Hash de senha | bcryptjs |
| Validação | class-validator / class-transformer |
| Documentação | Swagger (`@nestjs/swagger`) |
| Testes | Jest (unitários) + Supertest (e2e) |

## Funcionalidades

- **Usuários**: cadastro com validação de e-mail único e senha forte; leitura, edição e remoção só pelo próprio usuário.
- **Autenticação**: login com access token (15 min) e refresh token (7 dias), **rotação de refresh token** a cada `/refresh` e logout que invalida a sessão no banco.
- **Posts**: CRUD com paginação; só posts publicados aparecem para o público; só o autor pode editar ou apagar.
- **Comentários**: comentários em posts e **respostas aninhadas** (auto-relacionamento `parent` / `replies`).
- **Curtidas**: curtir e descurtir posts e comentários, com restrição de unicidade no banco (um like por usuário por item).
- **Visão personalizada**: `GET /post/:id` aceita token opcional e devolve `likesCount` e `likedByMe` no post, nos comentários e nas respostas.
- **Resposta padronizada**: um interceptor global envolve toda resposta em `{ status, data }`.

## Arquitetura

Cada recurso é um módulo NestJS com `controller` → `service` → `PrismaService`. As regras transversais ficam nas camadas do ciclo de vida da requisição:

```
Requisição
  │
  ├─ Middleware     UserMiddleware: loga o IP em /user
  ├─ Guards         AuthGuard: valida o Bearer token e popula req.user
  │                 OptionalAuthGuard: igual, mas deixa visitantes passarem
  │                 UserGuard / PostGuard / CommentGuard: checam se o usuário é o dono do recurso
  ├─ Pipes          ValidationPipe global (DTOs com class-validator)
  │                 CreateUserValidationPipe: e-mail único + regra de senha
  │                 CommentValidationPipe: garante que o post existe
  ├─ Decorators     @UserId() / @OptionalUserId(): extraem o id do usuário do token
  ├─ Controller → Service → Prisma
  │
  └─ Interceptor    DataInterceptor: formata a saída como { status, data }
```

### Fluxo de autenticação

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API
    participant DB as PostgreSQL

    C->>API: POST /login { email, password }
    API->>DB: busca usuário e compara hash (bcrypt)
    API->>DB: cria Session com o refresh token
    API-->>C: { accessToken } + cookie httpOnly refreshToken

    C->>API: requisição com Authorization: Bearer <accessToken>
    API-->>C: 200

    Note over C,API: access token expirou (15 min)
    C->>API: POST /refresh (cookie refreshToken)
    API->>DB: valida a sessão, invalida a antiga e cria a nova (transação)
    API-->>C: novo accessToken + novo cookie

    C->>API: POST /logout (cookie)
    API->>DB: Session.isValid = false
```

### Modelo de dados

```mermaid
erDiagram
    User ||--o{ Post : escreve
    User ||--o{ Session : possui
    User ||--o{ Comments : escreve
    User ||--o{ Likes : da
    Post ||--o{ Comments : tem
    Post ||--o{ Likes : recebe
    Comments ||--o{ Comments : "respostas (parent_id)"
    Comments ||--o{ Likes : recebe

    User {
        int id PK
        string email UK
        string name
        string password
    }
    Post {
        int id PK
        string title
        string content
        boolean published
        int authorId FK
    }
    Session {
        int id PK
        int userId FK
        string token UK
        boolean isValid
        datetime expiresAt
    }
    Comments {
        int id PK
        string comment
        int authorId FK
        int postId FK
        int parent_id FK
    }
    Likes {
        int id PK
        int authorId FK
        int postId FK
        int commentId FK
    }
```

`Likes` tem `@@unique([authorId, postId])` e `@@unique([authorId, commentId])`; o service converte o erro `P2002` do Prisma em `409 Conflict`.

## Endpoints

A documentação interativa (Swagger) fica em **`http://localhost:3000/documentacao`**.

🔒 = exige `Authorization: Bearer <accessToken>` · 👤 = só o dono do recurso

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/login` | Body `{ email, password }`. Retorna `accessToken` e define o cookie `refreshToken` |
| POST | `/refresh` | Usa o cookie `refreshToken` e devolve um novo par de tokens |
| POST | `/logout` | Invalida a sessão do cookie e o remove |

### Usuários

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/user` | Cadastro: `{ email, name, password }` |
| GET | `/user/:id` | 🔒👤 Dados do usuário com seus posts |
| PUT | `/user/:id` | 🔒👤 Atualiza `email`, `name` e/ou `password` |
| DELETE | `/user/:id` | 🔒👤 Remove o usuário e suas sessões (`204`) |

### Posts

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/post?page=1&limit=10` | Lista posts publicados, paginada |
| GET | `/post/:id` | Post com comentários, respostas e curtidas. Token opcional preenche `likedByMe` |
| POST | `/post` | 🔒 Cria post: `{ title, content, published }` |
| PUT | `/post/:id` | 🔒👤 Atualiza o post |
| DELETE | `/post/:id` | 🔒👤 Remove o post (`204`) |

### Comentários

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/comments` | 🔒 Comenta: `{ comment, postId }` |
| POST | `/comments/:parentId/replies` | 🔒 Responde a um comentário: `{ comment, postId }` |
| DELETE | `/comments/:id` | 🔒👤 Remove o comentário (`204`) |

### Curtidas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/like/post` | 🔒 Curte um post: `{ postId }` |
| DELETE | `/like/post` | 🔒 Descurte: `{ postId }` |
| POST | `/like/comment` | 🔒 Curte um comentário: `{ commentId }` |
| DELETE | `/like/comment` | 🔒 Descurte: `{ commentId }` |

### Formato de resposta

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "title": "Meu post",
    "content": "conteúdo",
    "published": true,
    "authorId": 1,
    "likesCount": 3,
    "likedByMe": true,
    "comments": [
      { "id": 10, "comment": "Ótimo!", "likesCount": 1, "likedByMe": false, "replies": [] }
    ]
  }
}
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env (usuário, senha, nome do banco e JWT_SECRET)

# 3. Subir o PostgreSQL
docker compose up -d

# 4. Aplicar as migrations e gerar o Prisma Client
npx prisma migrate dev
npx prisma generate

# 5. Rodar a API em modo watch
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais usadas pelo container do Postgres |
| `DATABASE_URL` | String de conexão usada pelo Prisma |
| `JWT_SECRET` | Segredo para assinar os tokens JWT |
| `PORT` | Porta da API (padrão `3000`) |

> O cookie `refreshToken` é criado com `secure: true`, então navegadores só o enviam via HTTPS. Para testar `/refresh` e `/logout` localmente, use Insomnia, Postman ou curl.

## Testes

```bash
# testes unitários (services, controllers, guards, pipes, middleware)
npm run test

# cobertura
npm run test:cov

# testes e2e (sobem a aplicação inteira contra um banco real)
npm run test:e2e
```

Os testes e2e leem um arquivo **`.env.test`** e **limpam o banco a cada teste**, então aponte o `DATABASE_URL` dele para um banco separado:

```bash
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/db_blog_test?schema=public"
JWT_SECRET=segredo_de_teste
```

```bash
# aplicar as migrations no banco de teste
npx dotenv -e .env.test -- prisma migrate deploy
```

## Estrutura do projeto

```
src/
├── Auth/          # login, refresh, logout, AuthGuard e OptionalAuthGuard
├── User/          # CRUD de usuário, UserGuard, pipe de validação e middleware
├── Post/          # CRUD de posts, PostGuard e decorators @UserId / @OptionalUserId
├── Comments/      # comentários e respostas, CommentGuard e pipe de validação
├── Likes/         # curtidas em posts e comentários
├── prisma/        # PrismaService (conexão via adapter pg)
├── types/         # tipagem de req.user no Express
├── app.interceptors.ts  # DataInterceptor ({ status, data })
└── main.ts        # bootstrap, pipes e interceptors globais, Swagger
prisma/
├── schema.prisma
└── migrations/
test/              # testes e2e por recurso
```

## O que pratiquei neste projeto

- Organização em módulos e injeção de dependência no NestJS
- Guards de autenticação e de autorização por dono do recurso
- Pipes customizados com acesso ao banco (validação assíncrona)
- Interceptor global para padronizar respostas
- Decorators de parâmetro customizados
- Access token + refresh token com rotação e sessões persistidas
- Modelagem relacional com Prisma: auto-relacionamento, restrições de unicidade, transações e `_count`
- Paginação com `skip` / `take`
- Testes unitários com mocks e testes e2e com Supertest em banco real
- Ambiente de banco com Docker Compose

## Próximos passos

- [ ] Adicionar `@ApiProperty` aos DTOs e `@ApiBearerAuth` às rotas para enriquecer o Swagger
- [ ] Configurar CORS e rate limiting no login
- [ ] Pipeline de CI rodando lint e testes
- [ ] Deploy da API e do banco
