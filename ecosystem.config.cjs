module.exports = {
  apps: [
    {
      name: "cineping-bot",
      script: "dist/index.js",
      interpreter: "node",
      env: {
        ENABLE_BOT: "true",
        ENABLE_SCHEDULER: "false"
      }
    }
  ]
};
