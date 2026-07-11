import {
  getAllPosts,
  getPostById,
  createPost as createPostModel,
  updatePost as updatePostModel,
  deletePost as deletePostModel,
} from "../models/post.model.js";
import { getPostsByUserId } from "../models/user.model.js";
import { getPostsByTopicId } from "../models/topic.model.js";
import { hasControlChars, hasHtmlTags, sanitizeString } from "../utils/sanitize.js";

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

// Requiere autenticación. El autor SIEMPRE es req.user.id (nunca lo que
// venga en el body) — así se evita que alguien publique en nombre de otro.
export async function postPost(req, res) {
  try {
    const { title, content, topicId } = req.body ?? {};

    if (!title || !content || !topicId) {
      return res.status(400).json({ error: "title, content y topicId son obligatorios." });
    }

    const parsedTopicId = parseInt(topicId, 10);
    if (Number.isNaN(parsedTopicId)) {
      return res.status(400).json({ error: "topicId inválido." });
    }

    const sanitizedTitle = sanitizeString(title);
    const sanitizedContent = typeof content === "string" ? content.trim().slice(0, 5000) : "";

    if (
      hasControlChars(sanitizedTitle) ||
      hasHtmlTags(sanitizedTitle) ||
      hasControlChars(sanitizedContent) ||
      hasHtmlTags(sanitizedContent)
    ) {
      return res.status(400).json({ error: "El título o el contenido contienen caracteres no permitidos." });
    }

    if (sanitizedTitle.length < 3 || sanitizedContent.length < 1) {
      return res.status(400).json({ error: "El título y el contenido no pueden estar vacíos." });
    }

    const post = await createPostModel({
      title: sanitizedTitle,
      content: sanitizedContent,
      userId: req.user.id, // SIEMPRE del token, nunca del body.
      topicId: parsedTopicId,
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error("Error en postPost:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

// Requiere autenticación + ser el dueño del post (control de propiedad / anti-IDOR).
export async function putPost(req, res) {
  try {
    const { id } = req.params;
    const { title, content } = req.body ?? {};

    const post = await getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar este post." });
    }

    const updateData = {};

    if (title !== undefined) {
      const sanitizedTitle = sanitizeString(title);
      if (hasControlChars(sanitizedTitle) || hasHtmlTags(sanitizedTitle) || sanitizedTitle.length < 3) {
        return res.status(400).json({ error: "Título inválido." });
      }
      updateData.title = sanitizedTitle;
    }

    if (content !== undefined) {
      const sanitizedContent = typeof content === "string" ? content.trim().slice(0, 5000) : "";
      if (hasControlChars(sanitizedContent) || hasHtmlTags(sanitizedContent) || sanitizedContent.length < 1) {
        return res.status(400).json({ error: "Contenido inválido." });
      }
      updateData.content = sanitizedContent;
    }

    const updatedPost = await updatePostModel(id, updateData);
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error en putPost:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

// Requiere autenticación + ser el dueño del post (control de propiedad / anti-IDOR).
export async function deletePostController(req, res) {
  try {
    const { id } = req.params;

    const post = await getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este post." });
    }

    await deletePostModel(id);
    return res.status(200).json({ message: "Post eliminado." });
  } catch (error) {
    console.error("Error en deletePost:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
