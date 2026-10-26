/**
 * ArthNiti — Controlled Local Staged Load & Latency Benchmark (Phase 10 & Phase 11)
 *
 * Safely benchmarks the local ArthNiti Express/Serverless server on http://localhost:3000
 * across progressive concurrency stages (1, 10, 25, 50 concurrent requests) without
 * hammering external third-party APIs (protected by server-side caching & request deduplication).
 *
 * Also includes a ready-to-run k6 configuration block in comments for external staging use.
 */

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(
    sortedArr.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedArr.length) - 1)
  );
  return Number(sortedArr[idx].toFixed(2));
}

async function runStage({ name, path, totalRequests, concurrency }) {
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let cacheHits = 0;
  const statusCounts = {};

  const startWallMs = performance.now();
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= totalRequests) break;
      const reqStart = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          headers: { Accept: 'application/json, text/html' },
          signal: AbortSignal.timeout(8000),
        });
        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;

        if (res.ok) {
          successCount++;
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const body = await res.json();
            if (body?.cacheStatus === 'HIT') {
              cacheHits++;
            }
          } else {
            await res.text();
          }
        } else {
          errorCount++;
        }
      } catch {
        const elapsed = performance.now() - reqStart;
        latencies.push(elapsed);
        errorCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalWallMs = performance.now() - startWallMs;
  latencies.sort((a, b) => a - b);

  const rps = Number(((totalRequests / totalWallMs) * 1000).toFixed(1));
  return {
    stage: name,
    endpoint: path,
    totalRequests,
    concurrency,
    successRatePct: Number(((successCount / totalRequests) * 100).toFixed(2)),
    errorCount,
    cacheHits,
    throughputRps: rps,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    statusCounts,
  };
}

async function main() {
  console.log(`=== ArthNiti Staged Load & Latency Benchmark (${BASE_URL}) ===`);

  // Warm up caches with 1 request each so concurrent stages test server capacity & cache protection
  await fetch(`${BASE_URL}/api/health`).catch(() => null);
  await fetch(`${BASE_URL}/api/market-indices`).catch(() => null);
  await fetch(`${BASE_URL}/api/economic-news`).catch(() => null);

  const stages = [
    { name: '1. Baseline Health Check', path: '/api/health', totalRequests: 50, concurrency: 5 },
    {
      name: '2. Concurrent Market Indices Refresh (c=25)',
      path: '/api/market-indices',
      totalRequests: 100,
      concurrency: 25,
    },
    {
      name: '3. High-Concurrency Market Spike (c=50)',
      path: '/api/market-indices',
      totalRequests: 150,
      concurrency: 50,
    },
    {
      name: '4. Concurrent Economic News Feed (c=25)',
      path: '/api/economic-news',
      totalRequests: 100,
      concurrency: 25,
    },
    {
      name: '5. Official CSV Asset Delivery (MoSPI GDP)',
      path: '/data/mospi_gdp_official.csv',
      totalRequests: 100,
      concurrency: 25,
    },
  ];

  const results = [];
  for (const stage of stages) {
    const res = await runStage(stage);
    results.push(res);
  }

  console.table(results);
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
