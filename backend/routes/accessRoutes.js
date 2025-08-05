const express = require('express');
const router = express.Router();
const { requestAccess } = require('../controllers/accessController');

router.post('/', requestAccess);

module.exports = router;
