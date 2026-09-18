module.exports = {
  apps: [
    {
      name: "fcmm-system",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=400",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
