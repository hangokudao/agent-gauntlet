export type Severity = "info" | "low" | "medium" | "high";

export type AgentStatus = "completed" | "skipped" | "failed";

export interface TargetInfo {
  input: string;
  url: string;
  hostname: string;
  isLocal: boolean;
}

export interface Finding {
  id?: string;
  title: string;
  severity: Severity;
  category: string;
  target: string;
  reproductionSteps: string[];
  evidence: string;
  recommendation: string;
  sourceAgent?: string;
}

export interface AgentDefinition {
  name: string;
  prompt: string;
}

export interface AgentResult {
  agentName: string;
  status: AgentStatus;
  notes: string;
  findings: Finding[];
}

export interface GauntletConfig {
  agents?: string[];
  scenario?: string;
  provider?: "stub";
  outputDir?: string;
  target?: {
    allowExternal?: boolean;
  };
}

export interface RunOptions {
  target: string;
  scenario?: string;
  ownsTarget?: boolean;
  dryRun?: boolean;
  configPath?: string;
  outputDir?: string;
}

export interface RunSummary {
  runId: string;
  runDir: string;
  reportPath: string;
  target: TargetInfo;
  findingCount: number;
}
