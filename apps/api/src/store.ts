import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import YAML from "yaml";
import type { Lab, Run, Scenario, Score, TimelineEvent } from "@rangeops/shared";

type RunState = {
  run: Run;
  timeline: TimelineEvent[];
  score?: Score;
};

const scenariosDir = path.resolve(process.cwd(), "../../scenarios");
const labs = new Map<string, Lab>();
const runs = new Map<string, RunState>();

function readScenarioFile(fileName: string): Scenario {
  const filePath = path.join(scenariosDir, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = YAML.parse(raw) as Scenario;
  return parsed;
}

const scenarioCatalog: Scenario[] = [
  readScenarioFile("easy-linux-credential-access.yaml"),
  readScenarioFile("intermediate-lateral-movement.yaml")
];

function deterministicFloat(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const chunk = hash.slice(0, 8);
  const value = parseInt(chunk, 16);
  return value / 0xffffffff;
}

export function getScenarios(): Scenario[] {
  return scenarioCatalog;
}

export function createLab(input: {
  workspaceId: string;
  name: string;
  scenarioId: string;
  ttlMinutes: number;
}): Lab {
  const now = Date.now();
  const lab: Lab = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    scenarioId: input.scenarioId,
    status: "ready",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + input.ttlMinutes * 60_000).toISOString()
  };
  labs.set(lab.id, lab);
  return lab;
}

export function listLabs(): Lab[] {
  return [...labs.values()];
}

export function listRuns(): Run[] {
  return [...runs.values()].map((state) => state.run);
}

export function createRun(labId: string): RunState {
  const lab = labs.get(labId);
  if (!lab) {
    throw new Error("Lab not found");
  }
  const scenario = scenarioCatalog.find((entry) => entry.id === lab.scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  const start = Date.now();
  const runId = crypto.randomUUID();
  const timeline: TimelineEvent[] = [];
  timeline.push({
    id: crypto.randomUUID(),
    runId,
    timestamp: new Date(start).toISOString(),
    source: "system",
    title: "Run started",
    detail: `Executing scenario ${scenario.name} against lab ${lab.name}.`
  });

  let detectedCount = 0;
  let mttdAccumulator = 0;

  scenario.steps.forEach((step, index) => {
    const attackTs = new Date(start + (index + 1) * 45_000);
    timeline.push({
      id: crypto.randomUUID(),
      runId,
      timestamp: attackTs.toISOString(),
      source: "attacker",
      stepId: step.id,
      title: `${step.name} executed`,
      detail: step.command
    });

    const detected = deterministicFloat(`${runId}-${step.id}`) > 0.25;
    if (detected) {
      detectedCount += 1;
      mttdAccumulator += step.expectedDetectionDelaySec;
      const detectionTs = new Date(attackTs.getTime() + step.expectedDetectionDelaySec * 1000);
      timeline.push({
        id: crypto.randomUUID(),
        runId,
        timestamp: detectionTs.toISOString(),
        source: "detector",
        stepId: step.id,
        title: `Detection matched for ${step.tactic}`,
        detail: `Rule ${step.detectionRuleId} fired.`,
        detected: true
      });
    }
  });

  const run: Run = {
    id: runId,
    labId,
    scenarioId: scenario.id,
    status: "completed",
    startedAt: new Date(start).toISOString(),
    completedAt: new Date(start + (scenario.steps.length + 2) * 45_000).toISOString()
  };

  const coverage = scenario.steps.length === 0 ? 0 : detectedCount / scenario.steps.length;
  const mttd = detectedCount === 0 ? 999 : mttdAccumulator / detectedCount;
  const falsePositives = Math.floor(deterministicFloat(runId) * 2);
  const finalScore = Math.max(0, Math.round(coverage * 70 + Math.max(0, 30 - mttd / 2) - falsePositives * 5));

  const score: Score = {
    runId,
    detectionCoverage: Number(coverage.toFixed(2)),
    meanTimeToDetectSec: Number(mttd.toFixed(1)),
    falsePositiveCount: falsePositives,
    finalScore
  };

  const state: RunState = { run, timeline, score };
  runs.set(run.id, state);
  return state;
}

export function getRun(runId: string): RunState | undefined {
  return runs.get(runId);
}

export function getOverview() {
  const allRuns = [...runs.values()].map((state) => state.score).filter((entry): entry is Score => Boolean(entry));
  const totalRuns = allRuns.length;
  const avgScore =
    totalRuns === 0
      ? 0
      : Number((allRuns.reduce((acc, score) => acc + score.finalScore, 0) / totalRuns).toFixed(1));
  const avgCoverage =
    totalRuns === 0
      ? 0
      : Number((allRuns.reduce((acc, score) => acc + score.detectionCoverage, 0) / totalRuns).toFixed(2));
  const avgMttd =
    totalRuns === 0
      ? 0
      : Number((allRuns.reduce((acc, score) => acc + score.meanTimeToDetectSec, 0) / totalRuns).toFixed(1));

  const tacticTotals = new Map<string, { total: number; detected: number }>();
  for (const state of runs.values()) {
    const runScenario = scenarioCatalog.find((entry) => entry.id === state.run.scenarioId);
    if (!runScenario) {
      continue;
    }

    for (const step of runScenario.steps) {
      const bucket = tacticTotals.get(step.tactic) ?? { total: 0, detected: 0 };
      bucket.total += 1;
      const detected = state.timeline.some((event) => event.stepId === step.id && event.source === "detector");
      if (detected) {
        bucket.detected += 1;
      }
      tacticTotals.set(step.tactic, bucket);
    }
  }

  const attackMatrix = [...tacticTotals.entries()].map(([tactic, value]) => ({
    tactic,
    total: value.total,
    detected: value.detected,
    coverage: value.total === 0 ? 0 : Number((value.detected / value.total).toFixed(2))
  }));

  return {
    scenarios: scenarioCatalog.length,
    labs: labs.size,
    runs: totalRuns,
    avgScore,
    avgCoverage,
    avgMttd,
    attackMatrix
  };
}
