import prisma from "../config/prisma.js";

/**
 * Devuelve todos los tópicos disponibles.
 */
export async function getAllTopics() {
  return prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Devuelve los posts de un tópico, incluyendo autor y tópico.
 */
export async function getPostsByTopicId(topicId) {
  const id = parseInt(topicId, 10);

  return prisma.post.findMany({
    where: { topicId: id },
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
