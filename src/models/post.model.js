import prisma from "../config/prisma.js";

/**
 * Devuelve todos los posts, incluyendo el autor (id, username, email) y el tópico (id, title).
 */
export async function getAllPosts() {
  return prisma.post.findMany({
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
