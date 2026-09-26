/**
 * PM2 Ecosystem Configuration for AgriLog
 * Compatible with both Linux (Ubuntu, Debian, CentOS) and Windows (PowerShell/CMD).
 */
module.exports = {
  apps: [
    {
      name: 'agrilog-backend',
      cwd: './agrilog-backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'agrilog-frontend',
      cwd: './agrilog-frontend',
      script: 'start.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
