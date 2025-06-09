// server/src/routes/cards.js
const express = require('express');
const cardsController = require('../controllers/cards');

const router = express.Router();

// Публичные роуты для карт
router.get('/', cardsController.getAllCards);
router.get('/random', cardsController.getRandomCard);
router.get('/random-multiple', cardsController.getRandomCards);
router.get('/:id', cardsController.getCard);
router.get('/:id/meaning', cardsController.getCardMeaning);

module.exports = router;