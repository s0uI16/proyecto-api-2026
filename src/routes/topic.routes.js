import { Router } from "express";
import { getTopics } from "../controllers/topic.controller.js";

const router = Router();

router.get("/", getTopics);

export default router;
