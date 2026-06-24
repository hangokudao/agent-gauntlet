import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { BrowserObservation, RunMode, TargetInfo } from "./types.js";

interface BrowserRunnerOptions {
  enabled: boolean;
  maxPages: number;
  sameOriginOnly: boolean;
  mode: RunMode;
  runDir: string;
  target: TargetInfo;
}

export async function runBrowserObservation(options: BrowserRunnerOptions): Promise<BrowserObservation> {
  if (!options.enabled) {
    return {
      enabled: false,
      status: "skipped",
      notes: "Browser observation was disabled.",
      pagesVisited: [],
      consoleErrors: [],
      screenshots: []
    };
  }

  let playwright: { chromium: { launch: (options: unknown) => Promise<unknown> } };
  try {
    playwright = (await dynamicImport("playwright")) as typeof playwright;
  } catch {
    return {
      enabled: true,
      status: "failed",
      notes: "Playwright is not installed. Install it with `npm install -D playwright` and run `npx playwright install chromium`.",
      pagesVisited: [],
      consoleErrors: [],
      screenshots: []
    };
  }

  const screenshotsDir = path.join(options.runDir, "browser");
  await mkdir(screenshotsDir, { recursive: true });

  const browser = (await playwright.chromium.launch({ headless: true })) as BrowserLike;
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pagesVisited: string[] = [];
  const screenshots: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    await visitPage(page, options.target.url, pagesVisited, screenshots, screenshotsDir, "home");
    const links = await collectLinks(page, options.target.url, options.sameOriginOnly);
    const budget = Math.max(0, options.maxPages - 1);
    for (const link of links.slice(0, budget)) {
      await visitPage(page, link, pagesVisited, screenshots, screenshotsDir, `page-${pagesVisited.length + 1}`);
    }

    return {
      enabled: true,
      status: "completed",
      notes: `Visited ${pagesVisited.length} page(s) in ${options.mode} mode.`,
      pagesVisited,
      consoleErrors,
      screenshots
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      enabled: true,
      status: "failed",
      notes: `Browser observation failed: ${message}`,
      pagesVisited,
      consoleErrors,
      screenshots
    };
  } finally {
    await browser.close();
  }
}

async function visitPage(
  page: PageLike,
  url: string,
  pagesVisited: string[],
  screenshots: string[],
  screenshotsDir: string,
  name: string
): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  pagesVisited.push(page.url());
  const screenshotPath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  screenshots.push(screenshotPath);
}

async function collectLinks(page: PageLike, baseUrl: string, sameOriginOnly: boolean): Promise<string[]> {
  const base = new URL(baseUrl);
  const links = (await page.$$eval("a[href]", (anchors: Array<{ href: string }>) =>
    anchors.map((anchor) => anchor.href)
  )) as string[];

  const seen = new Set<string>();
  for (const link of links) {
    try {
      const parsed = new URL(link);
      if (sameOriginOnly && parsed.origin !== base.origin) {
        continue;
      }
      parsed.hash = "";
      seen.add(parsed.toString());
    } catch {
      continue;
    }
  }
  return Array.from(seen).filter((link) => link !== base.toString());
}

const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string
) => Promise<unknown>;

interface BrowserLike {
  newContext(): Promise<{ newPage(): Promise<PageLike> }>;
  close(): Promise<void>;
}

interface PageLike {
  goto(url: string, options: unknown): Promise<void>;
  url(): string;
  screenshot(options: unknown): Promise<void>;
  $$eval(selector: string, callback: unknown): Promise<unknown>;
  on(event: "console", callback: (message: { type(): string; text(): string }) => void): void;
  on(event: "pageerror", callback: (error: Error) => void): void;
}
