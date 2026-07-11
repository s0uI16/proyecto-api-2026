# CFT Social — API REST Segura (Entrega Final)

API REST para una plataforma tipo red social de orientación de pregrado, del CFT de la
región de Valparaíso. Este es el proyecto **completo**: entorno seguro, arquitectura MVC,
base de datos con Prisma, autenticación con JWT (`jose`) + cookies seguras, control de
propiedad (anti-IDOR), CSRF, rate limiting, CORS con lista blanca y sanitización de
entrada — según el enfoque *Security by Design* de OWASP Top 10.

## Requisitos previos

- Node.js 20+
- pnpm ≥ 9.15
- PostgreSQL (local o vía Docker)

## Instalación

```bash
pnpm install
```

Como el proyecto usa `ignore-scripts=true` en `.npmrc` (seguridad de cadena de
suministro), los scripts de post-instalación no corren automáticamente. Hay que
ejecutarlos manualmente después de `pnpm install`:

```bash
pnpm exec prisma generate
pnpm rebuild bcrypt
```

> Si pnpm muestra `[ERR_PNPM_IGNORED_BUILDS]` / pide `pnpm approve-builds`: es un
> mecanismo propio de pnpm 10+, independiente de `ignore-scripts`, que bloquea por
> defecto los scripts de paquetes nuevos hasta aprobarlos. Corre:
> ```bash
> pnpm approve-builds "@prisma/client" "@prisma/engines" bcrypt prisma
> ```
> Esto actualiza automáticamente `pnpm-workspace.yaml` con la aprobación, y queda
> versionado para el resto del equipo.

## Base de datos

Levanta PostgreSQL, por ejemplo con el `docker-compose.yml` incluido:

```bash
docker compose up -d
```

Copia `.env.example` a `.env` y ajusta las variables:

```bash
cp .env.example .env
```

Variables documentadas en `.env.example`:

- `PORT`: puerto del servidor Express.
- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `NODE_ENV`: entorno de ejecución.

## Migraciones y datos de prueba

```bash
pnpm exec prisma migrate dev --name init
pnpm run db:seed
```

El seed crea ~22 usuarios, 5 tópicos y 40 posts de ejemplo, con contraseñas hasheadas.

## Levantar el servidor

```bash
pnpm run dev     # con recarga automática
pnpm start       # modo normal
```

El frontend mínimo queda disponible en `http://localhost:3000`.

## Endpoints

> Los endpoints privados requieren la cookie de sesión (`token`, la pone `/api/auth/login`)
> y, en métodos que mutan estado (POST/PUT/DELETE), el header `x-csrf-token` con el valor
> de la cookie `csrfToken` (la entrega cualquier `GET`, incluida la carga de `/`).

### POST /api/auth/register (público)

```bash
curl -c cookies.txt -b cookies.txt http://localhost:3000/  # obtiene csrfToken

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juanito","email":"juan@mail.com","password":"Password123"}'
```

### POST /api/auth/login (público)

```bash
CSRF=$(grep csrfToken cookies.txt | awk '{print $7}')

curl -X POST http://localhost:3000/api/auth/login \
  -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"juan@mail.com","password":"Password123"}'
```

### GET /api/users (público)

```bash
curl http://localhost:3000/api/users
```

### GET /api/topics (público)

```bash
curl http://localhost:3000/api/topics
```

### POST /api/topics (privado)

```bash
curl -X POST http://localhost:3000/api/topics \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"title":"Nuevo tópico","description":"Descripción del tópico."}'
```

### GET /api/posts (público)

```bash
curl http://localhost:3000/api/posts
```

### POST /api/posts (privado)

```bash
curl -X POST http://localhost:3000/api/posts \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"title":"Mi post","content":"Contenido del post.","topicId":1}'
```

### PUT /api/posts/:id (privado, solo el dueño)

```bash
curl -X PUT http://localhost:3000/api/posts/1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"content":"Contenido editado."}'
```

### DELETE /api/posts/:id (privado, solo el dueño)

```bash
curl -X DELETE http://localhost:3000/api/posts/1 \
  -b cookies.txt \
  -H "x-csrf-token: $CSRF"
```

### GET /api/posts/user/:userId (Reporte 1, público)

```bash
curl http://localhost:3000/api/posts/user/1
```

### GET /api/posts/topic/:topicId (Reporte 2, público)

```bash
curl http://localhost:3000/api/posts/topic/1
```

## Seguridad implementada (OWASP Top 10)

- **A02 (fallas criptográficas):** contraseñas hasheadas con bcrypt (10 rondas); nunca en texto plano ni expuestas.
- **A01/A07 (control de acceso / autenticación):**
  - Login firma JWT con `jose` (HS256), nunca `jsonwebtoken`.
  - El token viaja en una cookie `httpOnly`, `sameSite: 'lax'`, `secure` condicional a `NODE_ENV === 'production'` — nunca en `localStorage`.
  - El middleware `isAuthenticated` carga el usuario fresco desde la BD (no confía ciegamente en el payload del JWT).
  - Control de propiedad (anti-IDOR) en `PUT/DELETE /api/posts/:id`: solo el autor puede modificar/eliminar.
  - Rate limiting: `authLimiter` (10 intentos fallidos/15min en login), `registerLimiter` (20/hora), `apiLimiter` general.
- **A03 (inyección):**
  - SQLi: todas las consultas pasan por Prisma (parametrizadas), sin SQL concatenado.
  - XSS: doble defensa — saneamiento de entrada (`src/utils/sanitize.js`, rechaza etiquetas HTML y caracteres de control) **y** codificación de salida (`escapeHtml()` en el frontend antes de insertar en el DOM).
- **A05 (configuración de seguridad):**
  - `helmet` con CSP endurecida (`script-src 'self'`, sin `unsafe-inline`; todo el JS del frontend va en archivos externos).
  - CORS con lista blanca (`CORS_ORIGINS`), sin `origin: '*'`; el mismo origen (el propio frontend en `/public`) nunca se bloquea.
  - CSRF con patrón *double-submit token* (`x-csrf-token` vs cookie `csrfToken`), comparación en tiempo constante.

## Estructura del proyecto

```
src/
  config/       # PrismaClient, configuración de JWT (jose)
  controllers/
  models/       # única capa que importa Prisma
  middlewares/  # auth (JWT), CSRF, rate limiting
  routes/
  utils/        # validación + sanitización de entrada
  public/       # frontend: index.html, register.html, app.js, register.js
  app.js        # ensamblaje MVC, orden de middlewares y arranque del servidor
prisma/
  schema.prisma
  seed.js
```

## Commits sugeridos

1. `config de entorno` — pnpm, `.npmrc`, `.env.example`, `.gitignore`.
2. `modelo y migraciones` — `schema.prisma`, migración aplicada, capa de modelos.
3. `endpoints públicos + frontend` — controladores, rutas, `app.js`, `index.html`, seed.

Recuerda añadir al profesor como colaborador del repositorio privado.
