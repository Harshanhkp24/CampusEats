module.exports = {
  apps: [
    {
      name: 'campus-eats-api',
      script: 'server.js',
      exec_mode: 'cluster',
      instances: 'max',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        MONGOOSE_AUTO_INDEX: 'false',
      },
    },
  ],
}
