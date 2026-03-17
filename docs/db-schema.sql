CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE labs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  scenario_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE runs (
  id UUID PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(id),
  scenario_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id),
  event_ts TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  step_id TEXT,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  detected BOOLEAN
);

CREATE TABLE scores (
  run_id UUID PRIMARY KEY REFERENCES runs(id),
  detection_coverage NUMERIC(5, 4) NOT NULL,
  mean_time_to_detect_sec NUMERIC(8, 2) NOT NULL,
  false_positive_count INT NOT NULL,
  final_score INT NOT NULL
);
