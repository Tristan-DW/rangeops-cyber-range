export type AttackStep = {
  id: string;
  name: string;
  tactic: string;
  command: string;
  detectionRuleId: string;
  expectedDetectionDelaySec: number;
};

export type Scenario = {
  id: string;
  name: string;
  difficulty: "easy" | "intermediate" | "advanced";
  description: string;
  steps: AttackStep[];
};

export type Lab = {
  id: string;
  workspaceId: string;
  name: string;
  scenarioId: string;
  status: "provisioning" | "ready" | "destroyed";
  createdAt: string;
  expiresAt: string;
};

export type Run = {
  id: string;
  labId: string;
  scenarioId: string;
  status: "running" | "completed";
  startedAt: string;
  completedAt?: string;
};

export type TimelineEvent = {
  id: string;
  runId: string;
  timestamp: string;
  source: "attacker" | "detector" | "system";
  stepId?: string;
  title: string;
  detail: string;
  detected?: boolean;
};

export type Score = {
  runId: string;
  detectionCoverage: number;
  meanTimeToDetectSec: number;
  falsePositiveCount: number;
  finalScore: number;
};
