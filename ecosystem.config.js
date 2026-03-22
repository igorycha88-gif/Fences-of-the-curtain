module.exports = {
  apps: [
    {
      name: 'fences-app',
      script: 'npm',
      args: 'start',
      cwd: '/root/Fences-of-the-curtain',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/fences-app/error.log',
      out_file: '/var/log/fences-app/out.log',
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
