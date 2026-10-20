module.exports = {
  apps: [
    {
      name: "fwl-server",
      script: "dist/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
