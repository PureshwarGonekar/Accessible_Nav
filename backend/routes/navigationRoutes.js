const express = require('express');
const router = express.Router();
const { getRoute } = require('../controllers/navigationController');

// POST /api/navigation/route
router.post('/route', getRoute);

module.exports = router;
