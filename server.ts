import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // IBM Bob API: repo stats
  app.get("/api/bob/repo-stats", (_req, res) => {
    res.json({
      totalFiles: 2450,
      indexedAt: new Date().toISOString(),
      composition: [
        { name: "TypeScript", value: 65, color: "#0F62FE" },
        { name: "Testing", value: 15, color: "#D12771" },
        { name: "Config", value: 10, color: "#F1C21B" },
        { name: "Docs", value: 10, color: "#11D3BC" },
      ],
      complexity: [
        { module: "Auth", score: 85 },
        { module: "API", score: 60 },
        { module: "Store", score: 45 },
        { module: "Hooks", score: 55 },
        { module: "UI", score: 30 },
      ],
    });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", bob: "online", timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Spark.Studio (IBM Bob) running on http://localhost:${PORT}`);
  });
}

startServer();
