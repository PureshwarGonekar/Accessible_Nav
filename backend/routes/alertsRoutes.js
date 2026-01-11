const express = require('express');
const router = express.Router();
const { getAlerts, createAlert } = require('../controllers/alertsController');
// potentially add authMiddleware if alerts are protected, but usually public read is fine. 
// Creation should definitely be protected, but for demo keeping it open or using same auth.
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getAlerts);
router.post('/', authMiddleware, createAlert);

module.exports = router;
