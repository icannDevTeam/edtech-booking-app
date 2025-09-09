const express = require('express');
const router = express.Router();
const { sendChatbotFallback } = require('../controllers/chatbotController');

router.post('/fallback', sendChatbotFallback);

module.exports = router;
