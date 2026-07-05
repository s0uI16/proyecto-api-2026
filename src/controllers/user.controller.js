import { getAllUsers } from "../models/user.model.js";

export async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error en getUsers:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
