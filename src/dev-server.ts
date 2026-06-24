import { spawn, type ChildProcess } from "node:child_process";

export interface DevServerHandle {
  command: string;
  stop(): Promise<void>;
}

export async function startDevServer(
  command: string,
  url: string,
  readyTimeoutMs: number
): Promise<DevServerHandle> {
  const child = spawn(command, {
    shell: true,
    stdio: "ignore",
    windowsHide: true
  });

  await waitForTarget(url, readyTimeoutMs, child);

  return {
    command,
    async stop() {
      await stopProcess(child);
    }
  };
}

async function waitForTarget(url: string, timeoutMs: number, child: ChildProcess): Promise<void> {
  const startedAt = Date.now();
  let lastError = "not ready";

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Dev command exited before ${url} became reachable.`);
    }

    try {
      await fetch(url, { method: "HEAD" });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await delay(500);
    }
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill();
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    delay(3000)
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
