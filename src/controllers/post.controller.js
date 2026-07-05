import { getAllPosts } from "../models/post.model.js";
import { getPostsByUserId } from "../models/user.model.js";
import { getPostsByTopicId } from "../models/topic.model.js";

export async function getPosts(req, res) {
  try {
    const posts = await getAllPosts();
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error en getPosts:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

// REPORTE 1: posts filtrados por usuario.
export async function getPostsByUser(req, res) {
  try {
    const { userId } = req.params;

    if (!userId || Number.isNaN(parseInt(userId, 10))) {
      return res.status(400).json({ error: "userId inválido." });
    }

    const posts = await getPostsByUserId(userId);
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error en getPostsByUser:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

// REPORTE 2: posts filtrados por tópico.
export async function getPostsByTopic(req, res) {
  try {
    const { topicId } = req.params;

    if (!topicId || Number.isNaN(parseInt(topicId, 10))) {
      return res.status(400).json({ error: "topicId inválido." });
    }

    const posts = await getPostsByTopicId(topicId);
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error en getPostsByTopic:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
