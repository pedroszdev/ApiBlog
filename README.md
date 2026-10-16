# API Blog — NestJS + Prisma + PostgreSQL

API REST de um blog com autenticação JWT, posts com rascunhos e busca, comentários aninhados, curtidas e perfil público de autor. Projeto de estudo e portfólio, feito para praticar os blocos principais do NestJS (módulos, guards, pipes, interceptors, filters, middlewares e decorators customizados) junto com Prisma, PostgreSQL e testes automatizados.

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
| Segurança | helmet, CORS, rate limiting (`@nestjs/throttler`) |
| Documentação | Swagger (`@nestjs/swagger` com plugin do CLI) |
| Testes | Jest (unitários) + Supertest (e2e) |
| Deploy | Dockerfile multi-stage + Docker Compose |

## Funcionalidades

- **Usuários**: cadastro com e-mail único, senha forte e `bio` opcional; leitura, edição e remoção só pelo próprio usuário; rota `/user/me` para o usuário logado.
- **Perfil público de autor**: `GET /user/author/:id` devolve nome, bio e só os posts **publicados**, sem expor e-mail nem senha.
- **Autenticação**: login com access token (15 min) e refresh token (7 dias), **rotação de refresh token** a cada `/refresh` (atômica e à prova de requisições simultâneas) e logout que invalida a sessão no banco.
- **Posts**: CRUD com paginação, ordenação por data (`sort`) e **busca** por título ou conteúdo (`search`, sem diferenciar maiúsculas). A listagem traz o nome do autor e as contagens de curtidas e comentários.
- **Rascunhos**: posts com `published: false` não aparecem na listagem nem no perfil do autor, e `GET /post/:id` só os mostra para o próprio autor (para os outros, `404`).
- **Comentários**: comentários em posts e **respostas aninhadas** (auto-relacionamento `parent` / `replies`).
- **Curtidas**: curtir e descurtir posts e comentários, com restrição de unicidade no banco (um like por usuário por item).
- **Visão personalizada**: `GET /post/:id` aceita token opcional e devolve `likesCount` e `likedByMe` no post, nos comentários e nas respostas.
- **Resposta padronizada**: um interceptor global envolve toda resposta de sucesso em `{ status, data }`.
- **Erros do Prisma tratados**: um exception filter global converte os erros conhecidos do Prisma em respostas HTTP (veja [Erros](#erros)).
- **Segurança**: headers do `helmet`, CORS habilitado e rate limiting global por IP.

## Arquitetura

Cada recurso é um módulo NestJS com `controller` → `service` → `PrismaService`. As regras transversais ficam nas camadas do ciclo de vida da requisição:

```
Requisição
  │
  ├─ Middleware     helmet, cookie-parser
  │                 UserMiddleware: loga o IP em /user
  ├─ Guards         ThrottlerGuard (global): rate limiting por IP
  │                 AuthGuard: valida o Bearer token e popula req.user
  │                 OptionalAuthGuard: igual, mas deixa visitantes passarem
  │                 UserGuard / PostGuard / CommentGuard: checam se o usuário é o dono do recurso
  ├─ Pipes          ValidationPipe global (DTOs com class-validator)
  │                 CreateUserValidationPipe: e-mail único + regra de senha
  │                 CommentValidationPipe: garante que o post existe
  │                 Page / Limit / Sort / IdLimitValidationPipe: validam query e ids (até INT4)
  ├─ Decorators     @UserId() / @OptionalUserId(): extraem o id do usuário do token
  ├─ Controller → Service → Prisma
  │
  ├─ Interceptor    DataInterceptor: formata a saída como { status, data }
  │                 ClassSerializerInterceptor (em /user): remove password/email com @Exclude
  └─ Filter         PrismaExceptionFilter: converte erros do Prisma em HTTP
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
    API->>DB: valida a sessão (existe, isValid e não expirou)
    API->>DB: transação: invalida a sessão antiga só se ainda for válida e cria a nova
    API-->>C: novo accessToken + novo cookie

    C->>API: POST /logout (cookie)
    API->>DB: Session.isValid = false
    API-->>C: limpa o cookie
```

Na rotação, a sessão antiga é invalidada com um `updateMany` condicionado a `isValid: true`. Se duas requisições chegam ao mesmo tempo com o mesmo refresh token, só a primeira consegue rotacionar; a outra recebe `401`.

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
        string bio
        datetime createdAt
        datetime updatedAt
    }
    Post {
        int id PK
        string title
        string content
        boolean published
        int authorId FK
        datetime createdAt
        datetime updatedAt
    }
    Session {
        int id PK
        int userId FK
        string token UK
        boolean isValid
        datetime expiresAt
        datetime createdAt
    }
    Comments {
        int id PK
        string comment
        int authorId FK
        int postId FK
        int parent_id FK
        datetime createdAt
        datetime updatedAt
    }
    Likes {
        int id PK
        int authorId FK
        int postId FK
        int commentId FK
        datetime createdAt
        datetime updatedAt
    }
```

- `Likes` tem `@@unique([authorId, postId])` e `@@unique([authorId, commentId])`; o service converte o erro `P2002` do Prisma em `409 Conflict`.
- Apagar um usuário apaga em cascata as sessões, os posts e as curtidas; os comentários dele ficam com `authorId` nulo (`onDelete: SetNull`).
- Apagar um post apaga seus comentários e curtidas; apagar um comentário apaga suas respostas.

## Endpoints

A documentação interativa (Swagger) fica em **`http://localhost:3000/documentacao`**. Os DTOs aparecem no Swagger automaticamente pelo plugin `@nestjs/swagger` configurado no `nest-cli.json`.

🔒 = exige `Authorization: Bearer <accessToken>` · 🔓 = token opcional · 👤 = só o dono do recurso

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/login` | Body `{ email, password }`. Retorna `accessToken` e define o cookie `refreshToken` |
| POST | `/refresh` | Usa o cookie `refreshToken` e devolve um novo `accessToken` + novo cookie. `401` se a sessão for inválida, expirada ou já rotacionada |
| POST | `/logout` | Invalida a sessão do cookie e o remove. `400` se a sessão já estiver encerrada |

### Usuários

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/user` | Cadastro: `{ email, name, password, bio? }` |
| GET | `/user/me` | 🔒 Dados do usuário logado com seus posts (inclusive rascunhos) e contagens |
| GET | `/user/:id` | 🔒👤 Mesmo retorno de `/user/me`, pelo id |
| GET | `/user/author/:id` | Perfil público: nome, bio e posts publicados, com contagens de curtidas e comentários |
| PUT | `/user/:id` | 🔒👤 Atualiza `email`, `name`, `password` e/ou `bio` |
| DELETE | `/user/:id` | 🔒👤 Remove o usuário e suas sessões (`204`) |

O `password` nunca é retornado (`@Exclude` + `ClassSerializerInterceptor`), e o perfil público também esconde o `email`.

### Posts

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/post` | Lista posts publicados, paginada. Veja os parâmetros abaixo |
| GET | `/post/:id` | 🔓 Post com autor, comentários, respostas e curtidas. Com token, preenche `likedByMe` e libera os rascunhos do próprio autor |
| POST | `/post` | 🔒 Cria post: `{ title, content, published }` |
| PUT | `/post/:id` | 🔒👤 Atualiza o post (campos opcionais) |
| DELETE | `/post/:id` | 🔒👤 Remove o post (`204`) |

Parâmetros de `GET /post`:

| Parâmetro | Padrão | Regra |
| --- | --- | --- |
| `page` | `1` | inteiro ≥ 1 |
| `limit` | `10` | inteiro entre 1 e 50 |
| `sort` | `desc` | `asc` ou `desc`, pela data de criação |
| `search` | vazio | busca no título e no conteúdo, sem diferenciar maiúsculas |

Exemplo: `GET /post?page=2&limit=5&sort=asc&search=nestjs`

### Comentários

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/comments` | 🔒 Comenta: `{ comment, postId }` |
| POST | `/comments/:parentId/replies` | 🔒 Responde a um comentário: `{ comment, postId }`. O pai precisa ser do mesmo post |
| DELETE | `/comments/:id` | 🔒👤 Remove o comentário e suas respostas (`204`) |

### Curtidas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/like/post` | 🔒 Curte um post: `{ postId }` |
| DELETE | `/like/post` | 🔒 Descurte: `{ postId }` (`204`) |
| POST | `/like/comment` | 🔒 Curte um comentário: `{ commentId }` |
| DELETE | `/like/comment` | 🔒 Descurte: `{ commentId }` (`204`) |

### Regras de validação

| Campo | Regra |
| --- | --- |
| `email` | e-mail válido e único |
| `name` | 3 a 50 caracteres |
| `password` | 8 a 50 caracteres, com pelo menos 1 maiúscula, 1 número e 1 caractere especial (`!%$*&@#`), sem caracteres repetidos em sequência (`aa`, `44`…) |
| `bio` | opcional, até 160 caracteres |
| `title` | 3 a 50 caracteres |
| `content` | mínimo de 3 caracteres |
| `comment` | 3 a 200 caracteres |
| ids (rota e body) | inteiro positivo até 2147483647 (limite do `INT4`) |

### Formato de resposta

Toda resposta de sucesso vem envolvida em `{ status, data }`.

`GET /post?limit=10`:

```json
{
  "status": 200,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Meu post",
        "content": "conteúdo",
        "published": true,
        "authorId": 1,
        "createdAt": "2026-10-16T12:00:00.000Z",
        "updatedAt": "2026-10-16T12:00:00.000Z",
        "author": { "name": "Pedro" },
        "_count": { "likes": 3, "comments": 2 }
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1,
    "limit": 10
  }
}
```

`GET /post/1` (com token):

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "title": "Meu post",
    "content": "conteúdo",
    "published": true,
    "authorId": 1,
    "author": { "id": 1, "name": "Pedro", "bio": "Dev backend" },
    "likesCount": 3,
    "likedByMe": true,
    "comments": [
      {
        "id": 10,
        "comment": "Ótimo!",
        "author": { "id": 2, "name": "Ana" },
        "likesCount": 1,
        "likedByMe": false,
        "replies": []
      }
    ]
  }
}
```

### Erros

Os erros seguem o formato padrão do NestJS (sem o envelope `{ status, data }`):

```json
{ "statusCode": 404, "message": "Post não encontrado", "error": "Not Found" }
```

Erros do Prisma que escapam dos services são convertidos pelo `PrismaExceptionFilter`:

| Código Prisma | HTTP | Mensagem |
| --- | --- | --- |
| `P2002` (unicidade) | 409 | Registro já existe |
| `P2025` (registro não encontrado) | 404 | Registro não encontrado |
| `P2003` (chave estrangeira) | 404 | Recurso relacionado não existe |
| `P2020` (valor fora do intervalo) | 400 | Valor fora do intervalo |
| outros | 500 | — |

### Rate limiting

O `ThrottlerGuard` é global e conta por IP, com dois limites ao mesmo tempo:

| Nome | Janela | Máximo de requisições |
| --- | --- | --- |
| `short` | 1 segundo | 20 |
| `long` | 1 minuto | 100 |

Ao passar do limite, a API responde `429 Too Many Requests`.

## Como rodar

### Pré-requisitos

- Node.js 20.19+ (a imagem Docker usa Node 24)
- Docker e Docker Compose

### Passo a passo (desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env (usuário, senha, nome do banco e JWT_SECRET)

# 3. Subir só o PostgreSQL
docker compose up -d db

# 4. Aplicar as migrations e gerar o Prisma Client
npx prisma migrate dev
npx prisma generate

# 5. Rodar a API em modo watch
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

### Rodando tudo com Docker

O `docker-compose.yaml` define três serviços:

| Serviço | Descrição |
| --- | --- |
| `db` | PostgreSQL 18 de desenvolvimento, em `127.0.0.1:5432`, com volume persistente |
| `db-test` | PostgreSQL 16 para os testes e2e, em `5433`, rodando em memória (`tmpfs`) |
| `api` | A API buildada pelo `Dockerfile` (multi-stage, roda como usuário `node`), em `3000` |

```bash
docker compose up -d --build db api

# o container não aplica migrations sozinho: rode do host, apontando para o db
npx prisma migrate deploy
```

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais usadas pelo container do Postgres |
| `DATABASE_URL` | String de conexão usada pelo Prisma |
| `JWT_SECRET` | Segredo para assinar os tokens JWT (a API não sobe sem ele) |
| `PORT` | Porta da API (padrão `3000`) |

> O cookie `refreshToken` é criado com `secure: true` e `sameSite: 'strict'`, então navegadores só o enviam via HTTPS. Para testar `/refresh` e `/logout` localmente, use Insomnia, Postman ou curl.

## Testes

```bash
# testes unitários (services, controllers, guards, pipes, middleware)
npm run test

# cobertura
npm run test:cov

# testes e2e (sobem a aplicação inteira contra um banco real)
docker compose up -d db-test
npm run test:e2e
```

O `npm run test:e2e` lê o arquivo **`.env.test`** e aplica as migrations no banco de teste antes de rodar (script `pretest:e2e`). Os testes **limpam o banco a cada teste**, então o `DATABASE_URL` precisa apontar para um banco separado, como o serviço `db-test`:

```bash
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/app_test"
JWT_SECRET=segredo_de_teste
```

## Estrutura do projeto

```
src/
├── Auth/              # login, refresh, logout, AuthGuard e OptionalAuthGuard
├── User/              # usuário, perfil público de autor, UserGuard, pipe de validação e middleware
├── Post/              # posts, PostGuard, pipes de query e decorators @UserId / @OptionalUserId
├── Comments/          # comentários e respostas, CommentGuard e pipe de validação
├── Likes/             # curtidas em posts e comentários
├── prisma/            # PrismaService (conexão via adapter pg)
├── types/             # tipagem de req.user no Express
├── app.interceptors.ts  # DataInterceptor ({ status, data })
├── app.filter.ts        # PrismaExceptionFilter
├── app.module.ts        # módulos, ConfigModule e rate limiting global
└── main.ts              # bootstrap: helmet, CORS, pipes, interceptors, filters e Swagger
prisma/
├── schema.prisma
└── migrations/
test/                  # testes e2e por recurso
Dockerfile             # build multi-stage da API
docker-compose.yaml    # db, db-test e api
```

## O que pratiquei neste projeto

- Organização em módulos e injeção de dependência no NestJS
- Guards de autenticação e de autorização por dono do recurso, e guard de autenticação opcional
- Pipes customizados com acesso ao banco (validação assíncrona) e validação de query params
- Interceptor global para padronizar respostas e serialização com `class-transformer`
- Exception filter global para erros do Prisma
- Decorators de parâmetro customizados
- Access token + refresh token com rotação atômica e sessões persistidas
- Modelagem relacional com Prisma: auto-relacionamento, cascatas, restrições de unicidade, transações e `_count`
- Paginação com `skip` / `take`, ordenação e busca textual
- Segurança básica: helmet, CORS e rate limiting
- Testes unitários com mocks e testes e2e com Supertest em banco real
- Docker: build multi-stage e Compose com bancos de dev e de teste

## Próximos passos

- [x] `@ApiBearerAuth` nas rotas protegidas e DTOs no Swagger via plugin do CLI
- [x] CORS, helmet e rate limiting
- [ ] Limite mais rígido de tentativas no `/login` (o `@Throttle` atual usa o nome `default`, que não existe entre os throttlers `short` / `long`, e por isso é ignorado)
- [ ] Restringir as origens do CORS (hoje aceita qualquer origem)
- [ ] Exemplos e descrições nos DTOs do Swagger
- [ ] Aplicar as migrations automaticamente ao subir o container
- [ ] Pipeline de CI rodando lint e testes
- [ ] Deploy da API e do banco
