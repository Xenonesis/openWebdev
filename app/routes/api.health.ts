import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';

interface HealthCheckStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
    external_apis: 'healthy' | 'degraded' | 'unhealthy';
    memory: 'healthy' | 'warning' | 'critical';
  };
  performance: {
    response_time: number;
    memory_usage: number;
    cpu_usage: number;
  };
}

const startTime = Date.now();

async function checkDatabaseHealth(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Simulate database ping - replace with actual database check
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkCacheHealth(): Promise<'healthy' | 'unhealthy'> {
  try {
    // Simulate cache ping - replace with actual cache check
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkExternalAPIs(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  try {
    const checks = await Promise.allSettled([
      // Check Chutes API
      fetch('https://llm.chutes.ai/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }),

      // Add other API checks as needed
    ]);

    const failedChecks = checks.filter((result) => result.status === 'rejected').length;

    if (failedChecks === 0) {
      return 'healthy';
    }

    if (failedChecks < checks.length / 2) {
      return 'degraded';
    }

    return 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}

function checkMemoryUsage(): 'healthy' | 'warning' | 'critical' {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      return 'critical';
    }

    if (heapUsedPercent > 75) {
      return 'warning';
    }
  }

  return 'healthy';
}

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const requestStart = performance.now();

  const [dbHealth, cacheHealth, apiHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkCacheHealth(),
    checkExternalAPIs(),
  ]);

  const memoryHealth = checkMemoryUsage();
  const requestTime = performance.now() - requestStart;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbHealth === 'unhealthy' || memoryHealth === 'critical') {
    overallStatus = 'unhealthy';
  } else if (cacheHealth === 'unhealthy' || apiHealth === 'degraded' || memoryHealth === 'warning') {
    overallStatus = 'degraded';
  }

  const healthStatus: HealthCheckStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Date.now() - startTime,
    checks: {
      database: dbHealth,
      cache: cacheHealth,
      external_apis: apiHealth,
      memory: memoryHealth,
    },
    performance: {
      response_time: Math.round(requestTime * 100) / 100,
      memory_usage:
        typeof process !== 'undefined' && process.memoryUsage
          ? Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100
          : 0,
      cpu_usage: 0, // Would need additional monitoring for actual CPU usage
    },
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return json(healthStatus, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
