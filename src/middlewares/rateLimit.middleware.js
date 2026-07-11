import rateLimit from "express-rate-limit";

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({ error: message });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Demasiadas peticiones. Intenta de nuevo más tarde."),
});

// Solo cuenta los intentos FALLIDOS (skipSuccessfulRequests): así un usuario
// legítimo que se loguea repetidas veces con éxito no se ve penalizado; el
// límite existe para frenar fuerza bruta (muchos intentos fallidos seguidos).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: jsonHandler("Demasiados intentos de login. Intenta de nuevo en 15 minutos."),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Demasiados registros desde esta IP. Intenta de nuevo más tarde."),
});
