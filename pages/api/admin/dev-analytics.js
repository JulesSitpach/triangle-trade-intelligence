/**
 * ADMIN API: Development Analytics
 * GET /api/admin/dev-analytics - Returns real development metrics and system health
 * Database-driven development monitoring with no hardcoded values
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get real database metrics
    const dbMetrics = await getDatabaseMetrics();

    // Get real file system metrics
    const fileMetrics = await getFileSystemMetrics();

    // Get real system performance metrics
    const performanceMetrics = await getPerformanceMetrics();

    // Get git/development metrics
    const devMetrics = await getDevelopmentMetrics();

    const response = {
      timestamp: new Date().toISOString(),
      database: dbMetrics,
      filesystem: fileMetrics,
      performance: performanceMetrics,
      development: devMetrics,
      status: 'success'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Dev analytics error:', error);
    res.status(500).json({
      error: 'Failed to load development analytics',
      message: error.message
    });
  }
}

/**
 * Get real database metrics from Supabase
 */
async function getDatabaseMetrics() {
  try {
    // Get table counts from actual database
    const tables = [
      'user_profiles',
      'workflow_completions',
      'hs_master_rebuild',
      'tariff_rates',
      'usmca_tariff_rates',
      'rss_feeds'
    ];

    const tableCounts = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        tableCounts[table] = error ? 0 : count;
      } catch {
        tableCounts[table] = 0;
      }
    }

    // Get database size and performance info
    const { data: dbStats, error: statsError } = await supabase
      .rpc('get_db_stats')
      .single();

    return {
      table_counts: tableCounts,
      total_tables: Object.keys(tableCounts).length,
      database_size: dbStats?.database_size || 'Unknown',
      connection_pool_used: dbStats?.active_connections || 0,
      connection_pool_total: process.env.DB_POOL_SIZE || 20,
      avg_query_time: dbStats?.avg_query_time || 'Unknown',
      slow_queries: dbStats?.slow_queries || 0,
      cache_hit_rate: dbStats?.cache_hit_rate || 'Unknown'
    };
  } catch (error) {
    console.error('Database metrics error:', error);
    return {
      table_counts: {},
      error: 'Database metrics unavailable'
    };
  }
}

/**
 * Get real file system metrics
 */
async function getFileSystemMetrics() {
  try {
    const projectRoot = process.cwd();
    const metrics = await analyzeFileSystem(projectRoot);

    return {
      total_files: metrics.totalFiles,
      lines_of_code: metrics.totalLines,
      components: metrics.components,
      api_endpoints: metrics.apiEndpoints,
      pages: metrics.pages,
      project_size: metrics.projectSize,
      largest_files: metrics.largestFiles
    };
  } catch (error) {
    console.error('File system metrics error:', error);
    return {
      error: 'File system metrics unavailable'
    };
  }
}

/**
 * Get real performance metrics
 */
async function getPerformanceMetrics() {
  try {
    const startTime = Date.now();

    // Test API response time
    const apiTestStart = Date.now();
    await supabase.from('hs_master_rebuild').select('id').limit(1);
    const apiResponseTime = Date.now() - apiTestStart;

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Get system uptime
    const uptime = process.uptime();

    return {
      api_response_time: `${apiResponseTime}ms`,
      memory_usage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      memory_total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      uptime_seconds: Math.round(uptime),
      uptime_formatted: formatUptime(uptime),
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
  } catch (error) {
    console.error('Performance metrics error:', error);
    return {
      error: 'Performance metrics unavailable'
    };
  }
}

/**
 * Get development metrics (git, build info, etc.)
 */
async function getDevelopmentMetrics() {
  try {
    // Try to get git info if available
    let gitInfo = {};
    try {
      const { execSync } = require('child_process');
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log -1 --format="%h %s"', { encoding: 'utf8' }).trim();
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();

      gitInfo = {
        current_branch: currentBranch,
        last_commit: lastCommit,
        total_commits: parseInt(commitCount),
        repository_status: 'active'
      };
    } catch {
      gitInfo = {
        repository_status: 'git_unavailable'
      };
    }

    // Get package.json info
    let packageInfo = {};
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      packageInfo = {
        project_name: packageData.name,
        version: packageData.version,
        dependencies_count: Object.keys(packageData.dependencies || {}).length,
        dev_dependencies_count: Object.keys(packageData.devDependencies || {}).length
      };
    } catch {
      packageInfo = {
        error: 'package.json unavailable'
      };
    }

    return {
      git: gitInfo,
      package: packageInfo,
      build_environment: process.env.NODE_ENV || 'development',
      next_version: process.env.NEXT_VERSION || 'Unknown'
    };
  } catch (error) {
    console.error('Development metrics error:', error);
    return {
      error: 'Development metrics unavailable'
    };
  }
}

/**
 * Analyze file system for code metrics
 */
async function analyzeFileSystem(rootPath) {
  const metrics = {
    totalFiles: 0,
    totalLines: 0,
    components: 0,
    apiEndpoints: 0,
    pages: 0,
    projectSize: 0,
    largestFiles: []
  };

  try {
    // Count files in key directories
    const directories = ['pages', 'components', 'lib', 'styles', 'config'];

    for (const dir of directories) {
      const dirPath = path.join(rootPath, dir);
      if (fs.existsSync(dirPath)) {
        const dirMetrics = await analyzeDirectory(dirPath, dir);
        metrics.totalFiles += dirMetrics.files;
        metrics.totalLines += dirMetrics.lines;

        if (dir === 'components') metrics.components = dirMetrics.files;
        if (dir === 'pages') {
          const apiDir = path.join(dirPath, 'api');
          if (fs.existsSync(apiDir)) {
            const apiMetrics = await analyzeDirectory(apiDir, 'api');
            metrics.apiEndpoints = apiMetrics.files;
          }
          metrics.pages = dirMetrics.files - metrics.apiEndpoints;
        }
      }
    }

    // Get project size
    const stats = fs.statSync(rootPath);
    metrics.projectSize = `${Math.round(stats.size / 1024 / 1024)}MB`;

  } catch (error) {
    console.error('File system analysis error:', error);
  }

  return metrics;
}

/**
 * Analyze a directory for metrics
 */
async function analyzeDirectory(dirPath, type) {
  let files = 0;
  let lines = 0;

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const subMetrics = await analyzeDirectory(path.join(dirPath, item.name), type);
        files += subMetrics.files;
        lines += subMetrics.lines;
      } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx') || item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
        files++;
        try {
          const content = fs.readFileSync(path.join(dirPath, item.name), 'utf8');
          lines += content.split('\n').length;
        } catch {
          // Skip if can't read file
        }
      }
    }
  } catch (error) {
    console.error(`Error analyzing directory ${dirPath}:`, error);
  }

  return { files, lines };
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}