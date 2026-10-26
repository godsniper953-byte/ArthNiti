/**
 * ArthNiti — Controlled Local Staged Load & Latency Benchmark (Phase 10 & Phase 11)
 *
 * Explicitly separates:
 *   - Cold-Cache / Upstream Fetch Latency (1 sequential cache-miss probe per live endpoint)
 *   - Warm-Cache / In-Memory Cache Hit Capacity (progressive concurrency stages: c=5, c=25, c=50)
 *
 * Note: Per-instance in-memory caches protect upstream providers (Yahoo Finance v8, RBI/Fed/ECB/World Bank RSS)
 * from concurrent burst exhaustion. In serverless deployments (Vercel), each warm lambda instance maintains its own
 * in-memory cache with 15s (market) and 300s (news) TTLs plus a 5s force-refresh cooldown.
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

async function runStage({ name, mode, path, totalRequests, concurrency }) {
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
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
          signal: AbortSignal.timeout(12000),
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
            } else if (body?.cacheStatus === 'MISS') {
              cacheMisses++;
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
    cacheMode: mode,
    endpoint: path,
    totalRequests,
    concurrency,
    successRatePct: Number(((successCount / totalRequests) * 100).toFixed(2)),
    errorCount,
    cacheHits,
    cacheMisses,
    throughputRps: rps,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
  };
}

async function main() {
  console.log(`=== ArthNiti Staged Load & Latency Benchmark (${BASE_URL}) ===`);

  const stages = [
    {
      name: '0A. Cold-Cache Upstream Fetch (Market Indices)',
      mode: 'COLD_UPSTREAM_MISS',
      path: '/api/market-indices?refresh=true',
      totalRequests: 1,
      concurrency: 1,
    },
    {
      name: '0B. Cold-Cache Upstream Fetch (Economic News 10-Feed)',
      mode: 'COLD_UPSTREAM_MISS',
      path: '/api/economic-news?force=1',
      totalRequests: 1,
      concurrency: 1,
    },
    {
      name: '1. Baseline Health Check (c=5)',
      mode: 'STATELESS_JSON',
      path: '/api/health',
      totalRequests: 50,
      concurrency: 5,
    },
    {
      name: '2. Warm-Cache Market Indices (c=25)',
      mode: 'WARM_CACHE_HIT',
      path: '/api/market-indices',
      totalRequests: 100,
      concurrency: 25,
    },
    {
      name: '3. High-Concurrency Market Spike (c=50)',
      mode: 'WARM_CACHE_HIT',
      path: '/api/market-indices',
      totalRequests: 150,
      concurrency: 50,
    },
    {
      name: '4. Warm-Cache Economic News Feed (c=25)',
      mode: 'WARM_CACHE_HIT',
      path: '/api/economic-news',
      totalRequests: 100,
      concurrency: 25,
    },
    {
      name: '5. Official CSV Asset Delivery (MoSPI GDP, c=25)',
      mode: 'STATIC_ASSET',
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
