import prisma from "../config/prisma.js";

const postWithRelations = {
  user: {
    select: { id: true, username: true, email: true },
  },
  topic: {
    select: { id: true, title: true },
  },
};

/**
 * Devuelve todos los posts, incluyendo el autor (id, username, email) y el tópico (id, title).
 */
export async function getAllPosts() {
  return prisma.post.findMany({
    include: postWithRelations,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Busca un post por id, incluyendo autor y tópico.
 * Uso interno: para verificar propiedad (anti-IDOR) antes de editar/borrar.
 */
export async function getPostById(id) {
  const postId = parseInt(id, 10);

  return prisma.post.findUnique({
    where: { id: postId },
    include: postWithRelations,
  });
}

/**
 * Crea un post nuevo. El userId SIEMPRE viene del token (req.user.id),
 * nunca del body — eso se garantiza en el controlador, no aquí.
 */
export async function createPost(data) {
  return prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      userId: data.userId,
      topicId: data.topicId,
    },
    include: postWithRelations,
  });
}

/**
 * Actualiza un post existente. El control de propiedad (dueño o no) se hace
 * en el controlador ANTES de llamar a esta función.
 */
export async function updatePost(id, data) {
  const postId = parseInt(id, 10);

  return prisma.post.update({
    where: { id: postId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
    },
    include: postWithRelations,
  });
}

/**
 * Elimina un post. El control de propiedad se hace en el controlador.
 */
export async function deletePost(id) {
  const postId = parseInt(id, 10);

  return prisma.post.delete({
    where: { id: postId },
  });
}
