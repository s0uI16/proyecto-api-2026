import { Router } from "express";
import {
  getPosts,
  getPostsByUser,
  getPostsByTopic,
} from "../controllers/post.controller.js";

const router = Router();

router.get("/", getPosts);
router.get("/user/:userId", getPostsByUser);
router.get("/topic/:topicId", getPostsByTopic);

export default router;
