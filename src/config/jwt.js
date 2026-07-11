import { SignJWT, jwtVerify } from "jose";

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-do-not-use-in-production";

function resolveSecret() {
  const envSecret = process.env.JWT_SECRET;

  if (!envSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET no está definido. En producción es OBLIGATORIO configurarlo."
      );
    }
    console.warn(
      "⚠️  JWT_SECRET no definido: usando un secreto de desarrollo INSEGURO. " +
        "Configura JWT_SECRET en tu .env antes de ir a producción."
    );
    return DEV_FALLBACK_SECRET;
  }

  return envSecret;
}

const secretKey = new TextEncoder().encode(resolveSecret());
const ALGORITHM = "HS256";
const EXPIRATION = "7d";

/**
 * Firma un JWT con el payload dado, expira en 7 días.
 */
export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secretKey);
}

/**
 * Verifica un JWT. Devuelve el payload si es válido, o null si es inválido/expiró.
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALGORITHM],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Genera el token de autenticación para un usuario ya autenticado.
 * Solo incluye datos no sensibles (nunca el password).
 */
export async function generateAuthCookie(user) {
  return createToken({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Opciones de la cookie de sesión.
 * - httpOnly: JavaScript del navegador NUNCA puede leerla (mitiga robo vía XSS).
 * - secure: solo viaja por HTTPS quí en producción; en localhost sobre HTTP
 *   una cookie "secure" ni siquiera se guardaría, por eso es condicional.
 * - sameSite: 'lax' evita que se envíe en peticiones cross-site típicas de CSRF,
 *   sin romper la navegación normal (links, redirecciones GET).
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};
