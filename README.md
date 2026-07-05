# CFT Social — API REST (Primera Entrega / Hito 1)

API REST para una plataforma tipo red social de orientación de pregrado, del CFT de la
región de Valparaíso. Esta es la **Primera Entrega Parcial**: entorno seguro,
arquitectura MVC, base de datos con Prisma y endpoints públicos con contraseñas hasheadas.

> ⚠️ Esta entrega **no incluye** login con JWT, cookies, rutas privadas, control de
> propiedad (anti-IDOR) ni CORS con lista blanca. Eso corresponde a la Entrega Final.

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

## Endpoints públicos

### POST /api/auth/register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juanito","email":"juan@mail.com","password":"Password123"}'
```

### GET /api/users

```bash
curl http://localhost:3000/api/users
```

### GET /api/topics

```bash
curl http://localhost:3000/api/topics
```

### GET /api/posts

```bash
curl http://localhost:3000/api/posts
```

### GET /api/posts/user/:userId (Reporte 1)

```bash
curl http://localhost:3000/api/posts/user/1
```

### GET /api/posts/topic/:topicId (Reporte 2)

```bash
curl http://localhost:3000/api/posts/topic/1
```

## Seguridad de esta entrega

- Contraseñas hasheadas con bcrypt (10 rondas); nunca almacenadas ni devueltas en texto plano.
- `.env` fuera del control de versiones; `.env.example` documentado.
- `.npmrc` con `minimum-release-age=1440` e `ignore-scripts=true`.
- Validación de entrada en el registro (email, fuerza de contraseña, largo de username).
- Todas las consultas pasan por Prisma (parametrizadas); sin SQL concatenado.
- El frontend escapa el contenido dinámico (`escapeHtml`) antes de insertarlo en el DOM.

## Estructura del proyecto

```
src/
  config/     # instancia única de PrismaClient
  controllers/
  models/     # única capa que importa Prisma
  routes/
  utils/      # validación de entrada
  public/     # frontend estático (index.html + app.js)
  app.js      # ensamblaje MVC y arranque del servidor
prisma/
  schema.prisma
  seed.js
```

## Commits sugeridos

1. `config de entorno` — pnpm, `.npmrc`, `.env.example`, `.gitignore`.
2. `modelo y migraciones` — `schema.prisma`, migración aplicada, capa de modelos.
3. `endpoints públicos + frontend` — controladores, rutas, `app.js`, `index.html`, seed.

Recuerda añadir al profesor como colaborador del repositorio privado.
