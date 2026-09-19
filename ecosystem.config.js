module.exports = {
  apps: [
    {
      name: "fcmm-system",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./",
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      node_args: "--max-old-space-size=256",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
