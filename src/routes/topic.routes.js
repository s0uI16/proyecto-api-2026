import { Router } from "express";
import { getTopics, postTopic } from "../controllers/topic.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getTopics);
router.post("/", isAuthenticated, postTopic);

export default router;
