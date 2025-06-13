// server/src/routes/readings.js
const express = require('express');
const readingsController = require('../controllers/readings');

const router = express.Router();

// Публичные роуты (для бота)
router.post('/', readingsController.createReading);
router.get('/user/:userId', readingsController.getUserReadings);
router.get('/daily', readingsController.getDailyReading);
router.get('/:readingId', readingsController.getReading);

module.exports = router;