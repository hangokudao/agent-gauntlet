import type { TargetInfo } from "./types.js";

export class TargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TargetError";
  }
}

export function normalizeTarget(input: string): TargetInfo {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new TargetError("Target URL is required.");
  }

  const withScheme = hasScheme(trimmed) ? trimmed : addLocalScheme(trimmed);
  let parsed: URL;

  try {
    parsed = new URL(withScheme);
  } catch {
    throw new TargetError(`Invalid target URL: ${input}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TargetError("Only http and https targets are supported.");
  }

  return {
    input,
    url: parsed.toString(),
    hostname: parsed.hostname,
    isLocal: isLocalHostname(parsed.hostname)
  };
}

export function assertTargetAllowed(
  target: TargetInfo,
  options: { ownsTarget?: boolean; allowExternal?: boolean }
): void {
  if (target.isLocal) {
    return;
  }

  if (options.ownsTarget || options.allowExternal) {
    return;
  }

  throw new TargetError(
    "External targets require --i-own-this-target or target.allowExternal=true in gauntlet.config.json."
  );
}

function hasScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function addLocalScheme(value: string): string {
  const hostname = value.split(/[/:?#]/, 1)[0] ?? "";
  if (isLocalHostname(hostname)) {
    return `http://${value}`;
  }

  throw new TargetError(
    "External targets must include a scheme, for example https://example.com."
  );
}

function isLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(lower)
  );
}
