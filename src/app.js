import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import postRoutes from "./routes/post.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(express.json());

// Servir el frontend estático (Vista del patrón MVC).
app.use(express.static(path.join(__dirname, "public")));

// Endpoints públicos.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
