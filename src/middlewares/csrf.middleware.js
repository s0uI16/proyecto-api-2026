import crypto from "node:crypto";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Si no existe la cookie 'csrfToken', genera un token aleatorio y lo setea.
 * httpOnly:false a propósito: el FRONTEND necesita poder leer esta cookie
 * con document.cookie para poder copiarla en el header x-csrf-token.
 * Un atacante externo (otro sitio) no puede leer cookies de tu dominio por
 * la Same-Origin Policy del navegador, así que no puede fabricar ese header
 * aunque sepa que existe la cookie.
 */
export function issueCsrfToken(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    req.cookies[CSRF_COOKIE_NAME] = token;
  }
  next();
}

/**
 * Patrón "double-submit token": exige que el header x-csrf-token coincida
 * con la cookie csrfToken. Solo un script que corre en TU origen puede leer
 * la cookie (vía document.cookie) y ponerla en el header; un formulario o
 * fetch disparado desde otro sitio no puede replicar ese header.
 */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: "Token CSRF faltante." });
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  const isValid =
    cookieBuffer.length === headerBuffer.length &&
    crypto.timingSafeEqual(cookieBuffer, headerBuffer);

  if (!isValid) {
    return res.status(403).json({ error: "Token CSRF inválido." });
  }

  return next();
}
