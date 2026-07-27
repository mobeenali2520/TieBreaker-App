import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { aiServiceManager } from "./server/ai/AIServiceManager";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Endpoint to inspect active provider health / status
app.get("/api/ai-providers", (req, res) => {
  res.json({
    availableProviders: aiServiceManager.getAvailableProviders(),
  });
});

// 1. API: AI INTAKE (3 Clarifying Questions with Multi-Provider Failover)
app.post("/api/ai-intake", async (req, res) => {
  try {
    const { dilemma, rawOptions } = req.body;
    if (!dilemma) {
      return res.status(400).json({ error: "dilemma is required" });
    }

    const result = await aiServiceManager.generateIntakeQuestions(dilemma, rawOptions);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/ai-intake:", err);
    return res.status(500).json({ error: err.message || "Failed to call AI intake service" });
  }
});

// 2. API: FULL MULTI-CRITERIA DECISION ANALYSIS (With Multi-Provider Failover)
app.post("/api/ai-analyze-full", async (req, res) => {
  try {
    const { dilemma, answers, optionsList } = req.body;
    if (!dilemma) {
      return res.status(400).json({ error: "dilemma is required" });
    }

    const result = await aiServiceManager.generateFullAnalysis(dilemma, answers, optionsList);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/ai-analyze-full:", err);
    return res.status(500).json({ error: err.message || "Failed to execute AI analysis" });
  }
});

// 3. API: AI SUGGEST OPTIONS & CRITERIA (With Multi-Provider Failover)
app.post("/api/ai-suggest", async (req, res) => {
  try {
    const { topic, options, criteria } = req.body;
    const result = await aiServiceManager.generateSuggestions(topic, options, criteria);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/ai-suggest:", err);
    return res.status(500).json({ error: err.message || "Failed to generate suggestions" });
  }
});

// 4. API: AI ANALYZE MATRIX (With Multi-Provider Failover)
app.post("/api/ai-analyze", async (req, res) => {
  try {
    const { matrixData } = req.body;
    const result = await aiServiceManager.generateMatrixAnalysis(matrixData);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/ai-analyze:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze decision matrix" });
  }
});

// START EXPRESS & VITE MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
