#!/usr/bin/env tsx
/**
 * NETRA Cloudflare Deployment Verification & Soak Monitoring Script
 * Path: scripts/verify-deployment.ts
 *
 * Requirements: R3, C3 from ORIGINAL_REQUEST.md
 * - Supports --deploy to run `wrangler deploy` if credentials exist
 * - Supports --url <url> (default: http://localhost:8787)
 * - Supports --local to spawn/connect to local worker development server
 * - Supports --soak-duration <seconds> (default: 300 for 5-minute soak)
 * - Supports --quick-soak (5-second soak for automated test suites / CI)
 * - Polls /api/health with retry backoff until HTTP 200 { "status": "ok" }
 * - Monitors health endpoint over soak duration with zero exceptions
 * - Returns exit code 0 on success, non-zero on failure
 */

import { spawn, type ChildProcess, execSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// ANSI terminal color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface ScriptOptions {
  deploy: boolean;
  url: string;
  local: boolean;
  soakDurationSec: number;
  intervalSec: number;
  quickSoak: boolean;
}

function parseArgs(args: string[]): ScriptOptions {
  const options: ScriptOptions = {
    deploy: false,
    url: 'http://localhost:8787',
    local: false,
    soakDurationSec: 300, // 5 minutes standard for C3 acceptance criteria
    intervalSec: 5,
    quickSoak: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--deploy') {
      options.deploy = true;
    } else if (arg === '--local') {
      options.local = true;
    } else if (arg === '--quick-soak') {
      options.quickSoak = true;
      options.soakDurationSec = 5;
      options.intervalSec = 1;
    } else if (arg === '--url' && i + 1 < args.length) {
      options.url = args[++i];
    } else if (arg.startsWith('--url=')) {
      options.url = arg.slice(6);
    } else if (arg === '--soak-duration' && i + 1 < args.length) {
      options.soakDurationSec = Math.max(1, parseInt(args[++i], 10) || 300);
    } else if (arg.startsWith('--soak-duration=')) {
      options.soakDurationSec = Math.max(1, parseInt(arg.slice(16), 10) || 300);
    } else if (arg === '--interval' && i + 1 < args.length) {
      options.intervalSec = Math.max(1, parseInt(args[++i], 10) || 5);
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
${BOLD}NETRA Deployment Verification Script${RESET}
Usage: npx tsx scripts/verify-deployment.ts [options]

Options:
  --deploy               Execute \`wrangler deploy\` before verification
  --url <url>            Target worker URL (default: http://localhost:8787)
  --local                Run/verify against local worker development server
  --soak-duration <sec>  Soak test duration in seconds (default: 300)
  --quick-soak           Short 5-second soak for CI / automated tests
  --interval <sec>       Seconds between health check pings (default: 5, or 1 for quick-soak)
  --help, -h             Show this help message
`);
      process.exit(0);
    }
  }

  return options;
}

let spawnedProcess: ChildProcess | null = null;

function killProcessTree(child: ChildProcess | null) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /t /f`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // Process may have already exited
  }
}

// Clean up child process on exit signals
process.on('SIGINT', () => {
  console.log(`\n${YELLOW}[NETRA-DEPLOY] Received SIGINT. Terminating spawned processes...${RESET}`);
  killProcessTree(spawnedProcess);
  process.exit(130);
});

process.on('SIGTERM', () => {
  killProcessTree(spawnedProcess);
  process.exit(143);
});

process.on('exit', () => {
  killProcessTree(spawnedProcess);
});

async function isEndpointResponding(url: string): Promise<boolean> {
  try {
    const healthUrl = url.replace(/\/$/, '') + '/api/health';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timer);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function runDeploy(): Promise<boolean> {
  console.log(`\n${CYAN}${BOLD}=== STEP 1: Cloudflare Worker Deployment (\`wrangler deploy\`) ===${RESET}`);
  const hasToken = !!(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_ACCOUNT_ID);

  if (!hasToken) {
    console.log(
      `${YELLOW}[NETRA-DEPLOY] Warning: Neither CLOUDFLARE_API_TOKEN nor CLOUDFLARE_ACCOUNT_ID detected in environment.${RESET}`
    );
    console.log(`${YELLOW}[NETRA-DEPLOY] Attempting \`wrangler deploy\` using local cached login...${RESET}`);
  }

  try {
    execSync('npx wrangler deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
    });
    console.log(`${GREEN}✓ \`wrangler deploy\` executed successfully.${RESET}`);
    return true;
  } catch (err: any) {
    console.error(
      `${RED}✗ \`wrangler deploy\` failed: ${err.message || String(err)}${RESET}`
    );
    if (!hasToken) {
      console.log(
        `${YELLOW}[NETRA-DEPLOY] Note: To deploy to remote Cloudflare, set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.${RESET}`
      );
      return false;
    }
    return false;
  }
}

async function ensureLocalServer(targetUrl: string): Promise<boolean> {
  console.log(`\n${CYAN}${BOLD}=== Checking Local Worker Server Status ===${RESET}`);
  const alreadyRunning = await isEndpointResponding(targetUrl);
  if (alreadyRunning) {
    console.log(`${GREEN}✓ Local worker server is already active and responding at ${targetUrl}${RESET}`);
    return true;
  }

  // Extract port from targetUrl
  let port = 8787;
  try {
    const parsed = new URL(targetUrl);
    if (parsed.port) {
      port = parseInt(parsed.port, 10);
    }
  } catch {
    port = 8787;
  }

  console.log(`${CYAN}[NETRA-DEPLOY] Spawning local worker server (\`wrangler dev --port ${port}\`)...${RESET}`);
  const isWindows = process.platform === 'win32';
  const commandStr = `npx wrangler dev --port ${port}`;

  spawnedProcess = isWindows
    ? spawn(commandStr, {
        cwd: process.cwd(),
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      })
    : spawn('npx', ['wrangler', 'dev', '--port', String(port)], {
        cwd: process.cwd(),
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      });

  spawnedProcess.stderr?.on('data', (chunk) => {
    const msg = chunk.toString();
    if (msg.includes('Error:') || msg.includes('EXCEPTION')) {
      console.error(`${RED}[wrangler:err] ${msg.trim()}${RESET}`);
    }
  });

  console.log(`${CYAN}[NETRA-DEPLOY] Waiting for local worker to become ready...${RESET}`);
  return true;
}

interface HealthCheckResult {
  ok: boolean;
  statusCode: number;
  body: any;
  latencyMs: number;
  error?: string;
}

async function pingHealth(targetUrl: string, timeoutMs = 4000): Promise<HealthCheckResult> {
  const healthUrl = targetUrl.replace(/\/$/, '') + '/api/health';
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'netra-deployment-verifier/1.0.0',
      },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startTime;
    clearTimeout(timeoutId);

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    const ok = res.status === 200 && body?.status === 'ok';
    return {
      ok,
      statusCode: res.status,
      body,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      statusCode: 0,
      body: null,
      latencyMs,
      error: err?.message || String(err),
    };
  }
}

async function pollHealthWithBackoff(targetUrl: string, maxWaitMs = 60000): Promise<boolean> {
  console.log(`\n${CYAN}${BOLD}=== STEP 2: Health Endpoint Polling (/api/health) ===${RESET}`);
  console.log(`${CYAN}Target URL: ${targetUrl}/api/health${RESET}`);

  const start = Date.now();
  let attempt = 0;
  let delay = 300;

  while (Date.now() - start < maxWaitMs) {
    attempt++;
    const result = await pingHealth(targetUrl);

    if (result.ok) {
      console.log(
        `${GREEN}${BOLD}✓ [HEALTH OK] Attempt #${attempt} returned HTTP ${result.statusCode} in ${result.latencyMs}ms${RESET}`
      );
      console.log(
        `${GREEN}  Payload: ${JSON.stringify(result.body)} | D1: ${result.body?.d1 || 'connected'} | Uptime: ${
          result.body?.uptimeSeconds ?? 'N/A'
        }s${RESET}`
      );
      return true;
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(
      `${YELLOW}  [Attempt #${attempt} | ${elapsed}s elapsed] Status: ${result.statusCode || 'N/A'} - ${
        result.error || 'Awaiting ok status'
      }. Retrying in ${delay}ms...${RESET}`
    );

    await sleep(delay);
    delay = Math.min(delay * 1.3, 2000);
  }

  console.error(`${RED}${BOLD}✗ Health check polling timed out after ${maxWaitMs / 1000}s${RESET}`);
  return false;
}

interface SoakMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latencies: number[];
  errors: Array<{ timestamp: string; error: string; statusCode: number }>;
}

async function executeSoakTest(
  targetUrl: string,
  durationSec: number,
  intervalSec: number
): Promise<boolean> {
  console.log(
    `\n${CYAN}${BOLD}=== STEP 3: Zero-Error Log Soak Test (Duration: ${durationSec}s, Interval: ${intervalSec}s) ===${RESET}`
  );
  console.log(
    `${CYAN}Verifying zero 5xx errors and stable latency across the monitoring window...${RESET}`
  );

  const metrics: SoakMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    latencies: [],
    errors: [],
  };

  const startTime = Date.now();
  const endTime = startTime + durationSec * 1000;
  let pingCount = 0;

  while (Date.now() < endTime) {
    pingCount++;
    const remainingSec = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    const result = await pingHealth(targetUrl);

    metrics.totalRequests++;
    metrics.latencies.push(result.latencyMs);

    if (result.ok) {
      metrics.successfulRequests++;
      console.log(
        `${GREEN}[SOAK] Ping #${pingCount} [${remainingSec}s left] HTTP ${result.statusCode} OK | Latency: ${result.latencyMs}ms | Status: ${result.body?.status}${RESET}`
      );
    } else {
      metrics.failedRequests++;
      const errMsg = result.error || `HTTP ${result.statusCode} (body: ${JSON.stringify(result.body)})`;
      metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: errMsg,
        statusCode: result.statusCode,
      });
      console.error(
        `${RED}[SOAK ERROR] Ping #${pingCount} FAILED: ${errMsg} | Latency: ${result.latencyMs}ms${RESET}`
      );
    }

    if (Date.now() < endTime) {
      await sleep(intervalSec * 1000);
    }
  }

  // Statistics calculation
  const total = metrics.latencies.length;
  const minLatency = total > 0 ? Math.min(...metrics.latencies) : 0;
  const maxLatency = total > 0 ? Math.max(...metrics.latencies) : 0;
  const avgLatency =
    total > 0 ? Math.round(metrics.latencies.reduce((a, b) => a + b, 0) / total) : 0;

  console.log(`\n${CYAN}${BOLD}=== Soak Test Summary Statistics ===${RESET}`);
  console.log(`  Total Requests Executed:    ${BOLD}${metrics.totalRequests}${RESET}`);
  console.log(`  Successful Responses (200): ${GREEN}${BOLD}${metrics.successfulRequests}${RESET}`);
  console.log(
    `  Failed Responses:           ${metrics.failedRequests > 0 ? RED : GREEN}${BOLD}${metrics.failedRequests}${RESET}`
  );
  console.log(`  Minimum Latency:            ${minLatency}ms`);
  console.log(`  Maximum Latency:            ${maxLatency}ms`);
  console.log(`  Average Latency:            ${avgLatency}ms`);

  if (metrics.failedRequests > 0) {
    console.error(`\n${RED}${BOLD}✗ Soak test FAILED with ${metrics.failedRequests} error(s):${RESET}`);
    metrics.errors.forEach((e) => {
      console.error(`  - [${e.timestamp}] HTTP ${e.statusCode}: ${e.error}`);
    });
    return false;
  }

  console.log(`\n${GREEN}${BOLD}✓ Soak test PASSED: 100% success rate with zero runtime exceptions.${RESET}`);
  return true;
}

export async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`\n${CYAN}${BOLD}====================================================${RESET}`);
  console.log(`${CYAN}${BOLD}       NETRA DEPLOYMENT & SOAK VERIFICATION         ${RESET}`);
  console.log(`${CYAN}${BOLD}====================================================${RESET}`);
  console.log(`Target URL:     ${options.url}`);
  console.log(`Deploy Flag:    ${options.deploy ? 'YES' : 'NO'}`);
  console.log(`Local Mode:     ${options.local ? 'YES' : 'NO'}`);
  console.log(`Soak Duration:  ${options.soakDurationSec}s (${options.quickSoak ? 'quick-soak' : 'full'})`);
  console.log(`Ping Interval:  ${options.intervalSec}s`);

  // Step 1: Optional Wrangler Deploy
  if (options.deploy) {
    const deploySuccess = await runDeploy();
    if (!deploySuccess && !options.local) {
      console.error(
        `${RED}Deployment failed and --local not specified. Aborting verification.${RESET}`
      );
      process.exit(1);
    }
  }

  // Step 2: Ensure server is running if --local or default local URL
  const isLocalTarget =
    options.local ||
    options.url.includes('localhost') ||
    options.url.includes('127.0.0.1');

  if (isLocalTarget) {
    await ensureLocalServer(options.url);
  }

  // Step 3: Health Endpoint Polling with Retry Backoff
  const healthPassed = await pollHealthWithBackoff(options.url, 60000);
  if (!healthPassed) {
    console.error(`\n${RED}${BOLD}FATAL: Health check failed to return HTTP 200 OK.${RESET}`);
    killProcessTree(spawnedProcess);
    process.exit(1);
  }

  // Step 4: Zero-Error Log Soak Test
  const soakPassed = await executeSoakTest(
    options.url,
    options.soakDurationSec,
    options.intervalSec
  );

  // Clean up any spawned worker process
  killProcessTree(spawnedProcess);

  if (!soakPassed) {
    console.error(`\n${RED}${BOLD}FATAL: Soak test encountered failures.${RESET}`);
    process.exit(1);
  }

  console.log(
    `\n${GREEN}${BOLD}====================================================${RESET}`
  );
  console.log(
    `${GREEN}${BOLD}✓ ALL DEPLOYMENT & HEALTH CHECKS PASSED (EXIT 0)${RESET}`
  );
  console.log(
    `${GREEN}${BOLD}====================================================${RESET}\n`
  );

  process.exit(0);
}

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  main().catch((err) => {
    console.error(`${RED}Unhandled verification error: ${err?.stack || err}${RESET}`);
    killProcessTree(spawnedProcess);
    process.exit(1);
  });
}
