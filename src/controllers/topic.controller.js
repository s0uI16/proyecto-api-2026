import { getAllTopics } from "../models/topic.model.js";

export async function getTopics(req, res) {
  try {
    const topics = await getAllTopics();
    return res.status(200).json(topics);
  } catch (error) {
    console.error("Error en getTopics:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
