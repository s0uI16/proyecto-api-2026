import { Router } from "express";
import {
  getPosts,
  getPostsByUser,
  getPostsByTopic,
  postPost,
  putPost,
  deletePostController,
} from "../controllers/post.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

// Lectura pública.
router.get("/", getPosts);
router.get("/user/:userId", getPostsByUser);
router.get("/topic/:topicId", getPostsByTopic);

// Escritura privada (requiere sesión; el control de propiedad se hace en el controlador).
router.post("/", isAuthenticated, postPost);
router.put("/:id", isAuthenticated, putPost);
router.delete("/:id", isAuthenticated, deletePostController);

export default router;
