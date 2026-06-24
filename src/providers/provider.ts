import type { AgentDefinition, AgentResult, BrowserObservation, RunMode, TargetInfo } from "../types.js";

export interface AgentProvider {
  runAgent(input: {
    agent: AgentDefinition;
    target: TargetInfo;
    scenario: string;
    scenarioInstructions: string;
    mode: RunMode;
    browserObservation: BrowserObservation;
  }): Promise<AgentResult>;
}
