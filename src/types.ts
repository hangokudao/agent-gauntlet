export type Severity = "info" | "low" | "medium" | "high";

export type AgentStatus = "completed" | "skipped" | "failed";

export type RunMode = "safe" | "mutation" | "stress";

export type ProviderName = "stub" | "openai";

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

export interface BrowserObservation {
  enabled: boolean;
  status: "completed" | "skipped" | "failed";
  notes: string;
  pagesVisited: string[];
  consoleErrors: string[];
  screenshots: string[];
}

export interface GauntletConfig {
  agents?: string[];
  scenario?: string;
  mode?: RunMode;
  provider?: ProviderName;
  model?: string;
  outputDir?: string;
  browser?: {
    enabled?: boolean;
    maxPages?: number;
  };
  dev?: {
    command?: string;
    readyTimeoutMs?: number;
  };
  target?: {
    allowExternal?: boolean;
    allowedHosts?: string[];
    sameOriginOnly?: boolean;
    maxRequests?: number;
    mutationAllowed?: boolean;
    stressAllowed?: boolean;
  };
}

export interface RunOptions {
  target: string;
  scenario?: string;
  mode?: RunMode;
  provider?: ProviderName;
  model?: string;
  ownsTarget?: boolean;
  allowMutation?: boolean;
  allowStress?: boolean;
  browser?: boolean;
  noBrowser?: boolean;
  devCommand?: string;
  dryRun?: boolean;
  configPath?: string;
  outputDir?: string;
}

export interface RunSummary {
  runId: string;
  runDir: string;
  reportPath: string;
  jsonReportPath: string;
  target: TargetInfo;
  mode: RunMode;
  findingCount: number;
}
