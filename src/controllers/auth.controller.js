import bcrypt from "bcrypt";
import { getUserByEmail, createUser } from "../models/user.model.js";
import { isValidEmail, normalizeEmail, isStrongEnough } from "../utils/validate.js";

const SALT_ROUNDS = 10;

export async function register(req, res) {
  try {
    const { username, email, password } = req.body ?? {};

    // 1. Existencia de los campos requeridos.
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Los campos username, email y password son obligatorios.",
      });
    }

    // 2. Normalización y validación de email.
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: "El formato del email no es válido." });
    }

    // 3. Fuerza de la contraseña.
    if (!isStrongEnough(password)) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.",
      });
    }

    // 4. Longitud mínima del username.
    if (typeof username !== "string" || username.trim().length < 2) {
      return res.status(400).json({
        error: "El username debe tener al menos 2 caracteres.",
      });
    }

    // 5. Unicidad del email.
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // 6. Hash de la contraseña. Nunca se guarda ni se devuelve en texto plano.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await createUser({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 7. Excluir el password de la respuesta mediante desestructuración.
    const { password: _password, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
