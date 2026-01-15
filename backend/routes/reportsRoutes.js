const express = require('express');
const router = express.Router();
const { getReports, createReport, validateReport } = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getReports);
router.post('/', authMiddleware, createReport);
router.post('/:id/validate', authMiddleware, validateReport);

module.exports = router;
