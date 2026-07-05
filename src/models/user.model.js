import prisma from "../config/prisma.js";

/**
 * Devuelve todos los usuarios SIN el campo password.
 * Se usa `select` explícito para garantizar que el hash nunca sale de la capa de datos.
 */
export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Busca un usuario por email INCLUYENDO el password.
 * Uso exclusivo interno (registro/login), para comparar el hash con bcrypt.
 * Nunca debe usarse esta función para responder directamente al cliente.
 */
export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Crea un usuario nuevo. Se espera que `data.password` ya venga hasheado.
 */
export async function createUser(data) {
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  });
}

/**
 * Devuelve los posts de un usuario, incluyendo autor y tópico.
 */
export async function getPostsByUserId(userId) {
  const id = parseInt(userId, 10);

  return prisma.post.findMany({
    where: { userId: id },
    include: {
      user: {
        select: { id: true, username: true, email: true },
      },
      topic: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
