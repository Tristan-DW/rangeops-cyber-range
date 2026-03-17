import express from "express";
import cors from "cors";
import { z } from "zod";
import { createLab, createRun, getOverview, getRun, getScenarios, listLabs, listRuns } from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "rangeops-api" });
});

app.get("/api/scenarios", (_req, res) => {
  res.json({ scenarios: getScenarios() });
});

app.get("/api/labs", (_req, res) => {
  res.json({ labs: listLabs() });
});

app.get("/api/runs", (_req, res) => {
  res.json({ runs: listRuns() });
});

app.get("/api/overview", (_req, res) => {
  res.json(getOverview());
});

app.post("/api/labs", (req, res) => {
  const schema = z.object({
    workspaceId: z.string().min(2),
    name: z.string().min(2),
    scenarioId: z.string().min(2),
    ttlMinutes: z.number().int().min(30).max(240)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const lab = createLab(parsed.data);
  res.status(201).json({ lab });
});

app.post("/api/runs", (req, res) => {
  const schema = z.object({
    labId: z.string().uuid()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const state = createRun(parsed.data.labId);
    res.status(201).json({ run: state.run, score: state.score });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/api/runs/:runId", (req, res) => {
  const state = getRun(req.params.runId);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json({ run: state.run, score: state.score });
});

app.get("/api/runs/:runId/timeline", (req, res) => {
  const state = getRun(req.params.runId);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json({ timeline: state.timeline });
});

app.listen(port, () => {
  // Keep startup log explicit for local demos.
  console.log(`RangeOps API listening on http://localhost:${port}`);
});
