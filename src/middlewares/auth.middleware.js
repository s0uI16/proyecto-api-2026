import { verifyToken } from "../config/jwt.js";
import { getUserById } from "../models/user.model.js";

/**
 * Exige sesión válida. Lee la cookie 'token', la verifica, y carga el usuario
 * FRESCO desde la base de datos (no confía solo en el payload del JWT: si el
 * usuario fue borrado o sus datos cambiaron, esto lo refleja de inmediato).
 *
 * 401 = "no sé quién eres" (no autenticado). Distinto de 403 = "sé quién eres,
 * pero no tienes permiso para esto" (no autorizado).
 */
export async function isAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "No autenticado." });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Sesión inválida o expirada." });
    }

    const user = await getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado." });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Error en isAuthenticated:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Igual que isAuthenticated pero nunca bloquea: si hay token válido carga
 * req.user, si no, sigue de largo con req.user undefined.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const payload = await verifyToken(token);
    if (!payload) return next();

    const user = await getUserById(payload.id);
    if (user) req.user = user;

    return next();
  } catch (error) {
    console.error("Error en optionalAuth:", error);
    return next();
  }
}
