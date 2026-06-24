import type { AgentDefinition, AgentResult, TargetInfo } from "../types.js";

export interface AgentProvider {
  runAgent(input: {
    agent: AgentDefinition;
    target: TargetInfo;
    scenario: string;
  }): Promise<AgentResult>;
}
