import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { authLimiter, registerLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", isAuthenticated, me);

export default router;
