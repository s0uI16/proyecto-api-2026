import bcrypt from "bcrypt";
import { getUserByEmail, createUser } from "../models/user.model.js";
import { isValidEmail, normalizeEmail, isStrongEnough } from "../utils/validate.js";
import { hasControlChars, hasHtmlTags, sanitizeString } from "../utils/sanitize.js";
import { generateAuthCookie, COOKIE_OPTIONS } from "../config/jwt.js";

const SALT_ROUNDS = 10;
const GENERIC_LOGIN_ERROR = "Credenciales inválidas.";

export async function register(req, res) {
  try {
    const { username, email, password } = req.body ?? {};

    // 1. Existencia de los campos requeridos.
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Los campos username, email y password son obligatorios.",
      });
    }

    // 2. Saneamiento de entrada (defensa contra XSS, aparte del escape en la salida).
    const sanitizedUsername = sanitizeString(username);
    if (hasControlChars(sanitizedUsername) || hasHtmlTags(sanitizedUsername)) {
      return res.status(400).json({ error: "El username contiene caracteres no permitidos." });
    }

    // 3. Normalización y validación de email.
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: "El formato del email no es válido." });
    }

    // 4. Fuerza de la contraseña.
    if (!isStrongEnough(password)) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.",
      });
    }

    // 5. Longitud mínima del username.
    if (sanitizedUsername.length < 2) {
      return res.status(400).json({
        error: "El username debe tener al menos 2 caracteres.",
      });
    }

    // 6. Unicidad del email.
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // 7. Hash de la contraseña. Nunca se guarda ni se devuelve en texto plano.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await createUser({
      username: sanitizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 8. Excluir el password de la respuesta mediante desestructuración.
    const { password: _password, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: GENERIC_LOGIN_ERROR });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await getUserByEmail(normalizedEmail);

    // Mismo mensaje de error tanto si el email no existe como si la password
    // es incorrecta: evita que un atacante pueda enumerar emails registrados.
    if (!user) {
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const token = await generateAuthCookie(user);
    res.cookie("token", token, COOKIE_OPTIONS);

    const { password: _password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

export function logout(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.status(200).json({ message: "Sesión cerrada." });
}

// Endpoint de conveniencia (no exigido por el contrato, pero útil para el
// frontend y para verificar la sesión): devuelve el usuario autenticado.
export function me(req, res) {
  return res.status(200).json(req.user);
}
