// server/src/routes/analytics.js
const express = require('express');
const analyticsController = require('../controllers/analytics');

const router = express.Router();

// Публичные роуты
router.post('/events', analyticsController.trackEvent);
router.get('/users/:userId/stats', analyticsController.getUserStats);

module.exports = router;