import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import postRoutes from "./routes/post.routes.js";

import { apiLimiter } from "./middlewares/rateLimit.middleware.js";
import { issueCsrfToken, csrfProtection } from "./middlewares/csrf.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Necesario detrás de proxies (Render, Railway, etc.) para que
//    express-rate-limit y las cookies "secure" detecten bien el protocolo real.
app.set("trust proxy", 1);

// 2. Helmet primero: cabeceras de seguridad + CSP endurecida.
//    scriptSrc SOLO 'self': el JS del frontend va en archivos externos (app.js),
//    nunca inline, así un XSS inyectado no puede ejecutar <script> ni onclick="".
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // estilos inline: bajo riesgo
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// 3. Body parser con límite de tamaño (mitiga payloads gigantes / DoS simples).
app.use(express.json({ limit: "100kb" }));

// 4. cookie-parser: LEE cookies entrantes (no emite ninguna; eso lo hace res.cookie()).
app.use(cookieParser());

// 5. CORS con lista blanca. Se permite siempre el mismo origen (el navegador
//    manda el header Origin también en POST del mismo origen) y las peticiones
//    sin Origin (curl, apps nativas). Para orígenes cruzados no autorizados,
//    origin:false (NO lanzar Error, o se rompe también el propio frontend).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// 6. Rate limiting general.
app.use(apiLimiter);

// 7. CSRF: primero emite el token, luego lo exige en métodos que mutan estado.
app.use(issueCsrfToken);
app.use(csrfProtection);

// 8. Frontend estático (Vista del patrón MVC).
app.use(express.static(path.join(__dirname, "public")));

// 9. Endpoints de la API.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/posts", postRoutes);

// 10. Pantalla de inicio / login.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 11. Manejador de errores final: nunca filtra detalles internos al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
