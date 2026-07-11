import { getAllTopics, createTopic, getTopicByTitle } from "../models/topic.model.js";
import { hasControlChars, hasHtmlTags, sanitizeString } from "../utils/sanitize.js";

export async function getTopics(req, res) {
  try {
    const topics = await getAllTopics();
    return res.status(200).json(topics);
  } catch (error) {
    console.error("Error en getTopics:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

// Requiere autenticación (isAuthenticated en la ruta). Cualquier usuario logueado
// puede crear tópicos; el contrato no restringe esto a un rol admin.
export async function postTopic(req, res) {
  try {
    const { title, description } = req.body ?? {};

    if (!title || !description) {
      return res.status(400).json({ error: "title y description son obligatorios." });
    }

    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);

    if (
      hasControlChars(sanitizedTitle) ||
      hasHtmlTags(sanitizedTitle) ||
      hasControlChars(sanitizedDescription) ||
      hasHtmlTags(sanitizedDescription)
    ) {
      return res.status(400).json({ error: "El título o la descripción contienen caracteres no permitidos." });
    }

    if (sanitizedTitle.length < 3) {
      return res.status(400).json({ error: "El título debe tener al menos 3 caracteres." });
    }

    const existingTopic = await getTopicByTitle(sanitizedTitle);
    if (existingTopic) {
      return res.status(400).json({ error: "Ya existe un tópico con ese título." });
    }

    const topic = await createTopic({
      title: sanitizedTitle,
      description: sanitizedDescription,
    });

    return res.status(201).json(topic);
  } catch (error) {
    console.error("Error en postTopic:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
