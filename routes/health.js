const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FlavorVerse Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || 'v1'
  });
});

// Detailed health check
router.get('/detailed', (req, res) => {
  const healthcheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responsetime: process.hrtime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    services: {
      database: 'connected', // You can add actual DB health check here
      api: 'operational'
    }
  };
  
  res.json(healthcheck);
});

module.exports = router;
