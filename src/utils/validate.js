const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida el formato de un email con una expresión regular simple.
 *
 * Ejemplos:
 *  isValidEmail("ana@correo.com")   -> true
 *  isValidEmail("ana@correo")       -> false (sin dominio)
 *  isValidEmail("anacorreo.com")    -> false (sin @)
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Normaliza un email: minúsculas + espacios recortados.
 *
 * Ejemplos:
 *  normalizeEmail("  Ana@Correo.COM ") -> "ana@correo.com"
 *  normalizeEmail("PEDRO@MAIL.CL")     -> "pedro@mail.cl"
 *  normalizeEmail("juan@mail.com")     -> "juan@mail.com"
 */
export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Verifica que una contraseña tenga al menos 8 caracteres, con letras y números.
 *
 * Ejemplos:
 *  isStrongEnough("abc123")      -> false (menos de 8 caracteres)
 *  isStrongEnough("12345678")    -> false (solo números)
 *  isStrongEnough("password123") -> true (letras y números, 8+ caracteres)
 */
export function isStrongEnough(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
}
