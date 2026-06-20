module.exports = {
  apps: [
    {
      name: 'tolong-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'tolong-admin',
      cwd: './apps/admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      env: { NODE_ENV: 'production' }
    }
  ]
};
