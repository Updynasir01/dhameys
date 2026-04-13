// ecosystem.config.js
// PM2 process manager config — for cPanel Node.js or VPS deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    // ── Main API Server ──────────────────────────────────────────────────
    {
      name:        'dhameys-api',
      script:      './backend/src/server.js',
      cwd:         __dirname,
      instances:   process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode:   'cluster',
      watch:       false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV:  'development',
        PORT:      5000,
      },
      env_production: {
        NODE_ENV:  'production',
        PORT:      5000,
      },
      error_file:  './logs/api-error.log',
      out_file:    './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      autorestart: true,
    },

    // ── Queue Workers ────────────────────────────────────────────────────
    {
      name:       'dhameys-workers',
      script:     './backend/src/queues/workers.js',
      cwd:        __dirname,
      instances:  1,
      watch:      false,
      max_memory_restart: '256M',
      env:        { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      error_file: './logs/workers-error.log',
      out_file:   './logs/workers-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
    },

    // ── Next.js Frontend (Option B — Node.js on cPanel) ──────────────────
    {
      name:       'dhameys-frontend',
      script:     'node_modules/.bin/next',
      args:       'start',
      cwd:        './frontend',
      instances:  1,
      watch:      false,
      env:        { NODE_ENV: 'development', PORT: 3000 },
      env_production: { NODE_ENV: 'production', PORT: 3000 },
      error_file: '../logs/frontend-error.log',
      out_file:   '../logs/frontend-out.log',
      autorestart: true,
    },
  ],

  deploy: {
    production: {
      user:       'your_cpanel_user',
      host:       'your-server.com',
      ref:        'origin/main',
      repo:       'git@github.com:yourorg/dhameys.git',
      path:       '/home/your_cpanel_user/dhameys',
      'pre-deploy-local': '',
      'post-deploy':      'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup':        '',
    },
  },
};
