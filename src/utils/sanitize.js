// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/;
const HTML_TAG_REGEX = /<[^>]*>/;

/**
 * Recorta espacios y limita la longitud a 255 caracteres.
 * Devuelve '' si el valor no es un string.
 *
 * Ejemplos:
 *  sanitizeString("  Hola  ")        -> "Hola"
 *  sanitizeString(123)               -> ""
 *  sanitizeString("a".repeat(300)).length -> 255
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, 255);
}

/**
 * Normaliza un email: lowercase, trim, límite de 254 caracteres (máximo RFC).
 *
 * Ejemplos:
 *  sanitizeEmail("  Ana@Correo.COM ") -> "ana@correo.com"
 *  sanitizeEmail(42)                  -> ""
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Detecta caracteres de control ASCII (0-31 y 127), típicos de payloads maliciosos
 * (inyección de bytes nulos, control de terminal, etc.).
 *
 * Ejemplos:
 *  hasControlChars("hola\x00mundo") -> true
 *  hasControlChars("hola mundo")    -> false
 */
export function hasControlChars(str) {
  if (typeof str !== "string") return false;
  return CONTROL_CHARS_REGEX.test(str);
}

/**
 * Detecta si el string contiene algo con forma de etiqueta HTML (defensa de
 * entrada contra XSS). No reemplaza el escapado en la salida, es una capa extra.
 *
 * Ejemplos:
 *  hasHtmlTags("<script>alert(1)</script>") -> true
 *  hasHtmlTags("2 < 3 y 5 > 4")              -> false (no es una etiqueta real)
 *  hasHtmlTags("hola mundo")                 -> false
 */
export function hasHtmlTags(str) {
  if (typeof str !== "string") return false;
  return HTML_TAG_REGEX.test(str);
}
